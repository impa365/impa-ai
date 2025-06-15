// @ts-nocheck
// TODO: Arrumar os types desse arquivo
import { db } from "./supabase"
import type { UserProfile } from "@/types/user"

interface ApiKeyData {
  id: string
  user_id: string
  name: string
  api_key: string // Mantendo o nome da coluna como está no seu banco
  is_admin_key: boolean
  last_used_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

interface ValidationResult {
  isValid: boolean
  user?: UserProfile | null
  apiKeyData?: ApiKeyData | null
  error?: string
  status?: number
}

async function verifyApiKey(apiKeyToVerify: string): Promise<ApiKeyData | null> {
  // Log para ver a chave que está sendo verificada
  console.log(
    "verifyApiKey: Attempting to verify key:",
    apiKeyToVerify ? `${apiKeyToVerify.substring(0, 12)}...` : "EMPTY_KEY_RECEIVED",
  )

  if (!apiKeyToVerify || typeof apiKeyToVerify !== "string") {
    console.error("verifyApiKey: API key is invalid or not a string.", { apiKeyToVerify })
    return null
  }

  if (!apiKeyToVerify.startsWith("impaai_") || apiKeyToVerify.length !== 37) {
    console.error("verifyApiKey: API key format is invalid.", {
      keyReceived: apiKeyToVerify,
      length: apiKeyToVerify.length,
    })
    return null
  }

  try {
    const { data, error } = await (await db.userApiKeys())
      .select("*")
      .eq("api_key", apiKeyToVerify) // Usando a coluna "api_key" como no seu schema
      .single()

    if (error) {
      console.error("verifyApiKey: Error fetching API key from DB:", error.message, {
        keyUsedForLookup: apiKeyToVerify,
      })
      return null
    }
    if (!data) {
      console.warn("verifyApiKey: API key not found in DB.", { keyUsedForLookup: apiKeyToVerify })
      return null
    }
    console.log("verifyApiKey: API key data found in DB for key prefix:", data.api_key.substring(0, 12) + "...")
    return data as ApiKeyData
  } catch (e) {
    console.error("verifyApiKey: Exception during DB query:", e)
    return null
  }
}

export async function validateApiKey(request: Request): Promise<ValidationResult> {
  let apiKey: string | null = null
  const headers = request.headers

  // Log de todos os cabeçalhos recebidos para depuração
  const allHeaders: Record<string, string> = {}
  headers.forEach((value, key) => {
    allHeaders[key] = value
  })
  console.log("validateApiKey: Received headers:", allHeaders)

  // 1. Tenta pegar do header 'apikey' (case-insensitive)
  const apiKeyHeaderValue = headers.get("apikey")
  if (apiKeyHeaderValue) {
    apiKey = apiKeyHeaderValue
    console.log(
      "validateApiKey: Found key in 'apikey' header:",
      apiKey ? `${apiKey.substring(0, 12)}...` : "EMPTY_APIKEY_HEADER",
    )
  }

  // 2. Se não encontrou, tenta pegar do header 'Authorization: Bearer <token>'
  if (!apiKey) {
    const authHeaderValue = headers.get("Authorization")
    console.log("validateApiKey: Value of 'Authorization' header:", authHeaderValue)
    if (authHeaderValue) {
      const parts = authHeaderValue.split(" ")
      if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
        apiKey = parts[1]
        console.log(
          "validateApiKey: Extracted key from 'Authorization: Bearer' header:",
          apiKey ? `${apiKey.substring(0, 12)}...` : "EMPTY_BEARER_TOKEN",
        )
      } else {
        console.log(
          "validateApiKey: 'Authorization' header found, but not in 'Bearer <token>' format. Value:",
          authHeaderValue,
        )
      }
    } else {
      console.log("validateApiKey: 'Authorization' header not found.")
    }
  }

  if (!apiKey) {
    console.warn("validateApiKey: Final check - API key was NOT extracted from headers.")
    return { isValid: false, error: "API key é obrigatória", status: 401 }
  }

  console.log(
    "validateApiKey: API key extracted for verification:",
    apiKey ? `${apiKey.substring(0, 12)}...` : "EMPTY_EXTRACTED_KEY",
  )

  const apiKeyData = await verifyApiKey(apiKey)

  if (!apiKeyData) {
    console.warn("validateApiKey: API key verification failed (key not found in DB or DB error).", {
      apiKeyUsed: apiKey ? `${apiKey.substring(0, 12)}...` : "EMPTY_KEY_FOR_VERIFY",
    })
    return { isValid: false, error: "API key inválida ou não encontrada", status: 401 }
  }

  if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
    console.warn("validateApiKey: API key has expired.", { apiKeyId: apiKeyData.id })
    return { isValid: false, error: "API key expirada", status: 401 }
  }

  const { data: user, error: userError } = await (await db.userProfiles())
    .select("*")
    .eq("id", apiKeyData.user_id)
    .single()

  if (userError || !user) {
    console.error("validateApiKey: User not found for API key.", {
      userId: apiKeyData.user_id,
      userError: userError?.message,
    })
    return {
      isValid: false,
      error: "Usuário associado à API key não encontrado",
      status: 403,
    }
  }

  if (user.status !== "active") {
    console.warn("validateApiKey: User is not active.", { userId: user.id, userStatus: user.status })
    return { isValid: false, error: "Usuário associado à API key não está ativo", status: 403 }
  }
  ;(async () => {
    try {
      const { error: updateError } = await (await db.userApiKeys())
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", apiKeyData.id)
      if (updateError) {
        console.error("validateApiKey: Failed to update last_used_at:", updateError.message)
      } else {
        console.log("validateApiKey: Successfully updated last_used_at for key ID:", apiKeyData.id)
      }
    } catch (e) {
      console.error("validateApiKey: Exception during last_used_at update:", e)
    }
  })()

  console.log("validateApiKey: API key validated successfully.", { userId: user.id, apiKeyId: apiKeyData.id })
  return { isValid: true, user: user as UserProfile, apiKeyData, status: 200 }
}

export function hasPermission(
  userRole: string | undefined,
  isAdminKey: boolean | undefined,
  requiredRole: string,
): boolean {
  if (!userRole) return false
  if (isAdminKey === true) return true
  return userRole === "admin" || userRole === requiredRole
}

export function canAccessAgent(
  userRole: string | undefined,
  isAdminKey: boolean | undefined,
  agentUserId: string | undefined,
  currentUserId: string | undefined,
): boolean {
  if (!userRole || !currentUserId) return false
  if (isAdminKey === true) return true
  if (userRole === "admin") return true
  return agentUserId === currentUserId
}
