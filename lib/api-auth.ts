// @ts-nocheck
// TODO: Arrumar os types desse arquivo
import { db } from "./supabase" // Garanta que db é importado corretamente e funcional
import type { UserProfile } from "@/types/user" // Verifique se este tipo está correto e acessível

interface ApiKeyData {
  id: string
  user_id: string
  name: string
  api_key: string // Coluna que armazena a chave completa (para fins de depuração, idealmente seria um hash)
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

async function verifyApiKeyInDatabase(apiKeyToVerify: string): Promise<ApiKeyData | null> {
  console.log(
    "verifyApiKeyInDatabase: Verificando chave no DB:",
    apiKeyToVerify ? `${apiKeyToVerify.substring(0, 12)}...` : "CHAVE_VAZIA_PARA_DB",
  )

  // Adicionado .trim() para remover espaços em branco no início/fim
  const trimmedApiKey = apiKeyToVerify.trim()

  if (
    !trimmedApiKey ||
    typeof trimmedApiKey !== "string" ||
    !trimmedApiKey.startsWith("impaai_") ||
    trimmedApiKey.length !== 37
  ) {
    console.error("verifyApiKeyInDatabase: Formato inválido da chave para consulta ao DB.", {
      keyReceived: apiKeyToVerify, // Loga a chave original
      length: trimmedApiKey.length, // Loga o comprimento após o trim
    })
    return null
  }

  try {
    const supabaseClient = await db.userApiKeys() // Obtém o cliente Supabase para a tabela
    const { data, error } = await supabaseClient
      .select("*")
      .eq("api_key", trimmedApiKey) // Usa a chave tratada na consulta
      .single()

    if (error) {
      console.error("verifyApiKeyInDatabase: Erro ao buscar API key no DB:", error.message, {
        keyUsedForLookup: trimmedApiKey,
      })
      return null
    }
    if (!data) {
      console.warn("verifyApiKeyInDatabase: API key não encontrada no DB.", { keyUsedForLookup: trimmedApiKey })
      return null
    }
    console.log("verifyApiKeyInDatabase: API key encontrada no DB:", data.api_key.substring(0, 12) + "...")
    return data as ApiKeyData
  } catch (e) {
    console.error("verifyApiKeyInDatabase: Exceção durante consulta ao DB:", e)
    return null
  }
}

export async function validateApiKey(request: Request): Promise<ValidationResult> {
  let extractedApiKey: string | null = null
  const headers = request.headers

  const allHeaders: Record<string, string> = {}
  headers.forEach((value, key) => {
    allHeaders[key.toLowerCase()] = value
  }) // Normaliza para minúsculas
  console.log("validateApiKey: Cabeçalhos recebidos (normalizados para minúsculas):", allHeaders)

  // 1. Tenta pegar do header 'apikey'
  const apiKeyHeaderValue = allHeaders["apikey"] // Acessa normalizado
  if (apiKeyHeaderValue) {
    extractedApiKey = apiKeyHeaderValue
    console.log(
      "validateApiKey: Chave encontrada no header 'apikey':",
      extractedApiKey ? `${extractedApiKey.substring(0, 12)}...` : "VAZIO",
    )
  }

  // 2. Se não encontrou, tenta pegar do header 'Authorization: Bearer <token>'
  if (!extractedApiKey) {
    const authHeaderValue = allHeaders["authorization"] // Acessa normalizado
    console.log("validateApiKey: Valor do header 'authorization':", authHeaderValue)
    if (authHeaderValue) {
      const parts = authHeaderValue.split(" ")
      if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
        extractedApiKey = parts[1]
        console.log(
          "validateApiKey: Chave extraída do 'Authorization: Bearer':",
          extractedApiKey ? `${extractedApiKey.substring(0, 12)}...` : "VAZIO_NO_BEARER",
        )
      } else {
        console.log(
          "validateApiKey: Header 'authorization' encontrado, mas formato não é 'Bearer <token>'. Valor:",
          authHeaderValue,
        )
      }
    } else {
      console.log("validateApiKey: Header 'authorization' não encontrado.")
    }
  }

  if (!extractedApiKey) {
    console.warn("validateApiKey: FALHA FINAL - API key NÃO foi extraída dos headers.")
    return { isValid: false, error: "API key é obrigatória", status: 401 }
  }

  console.log(
    "validateApiKey: Chave extraída para verificação no DB:",
    extractedApiKey ? `${extractedApiKey.substring(0, 12)}...` : "VAZIA_ANTES_DB",
  )

  // Passa a chave extraída para a função de verificação
  const apiKeyData = await verifyApiKeyInDatabase(extractedApiKey)

  if (!apiKeyData) {
    console.warn("validateApiKey: Falha na verificação da API key (não encontrada no DB ou erro no DB).", {
      apiKeyUsed: extractedApiKey ? `${extractedApiKey.substring(0, 12)}...` : "VAZIA_PARA_VERIFICACAO_DB",
    })
    return { isValid: false, error: "API key inválida ou não encontrada", status: 401 }
  }

  if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
    console.warn("validateApiKey: API key expirada.", { apiKeyId: apiKeyData.id })
    return { isValid: false, error: "API key expirada", status: 401 }
  }

  const supabaseUserProfilesClient = await db.userProfiles()
  const { data: user, error: userError } = await supabaseUserProfilesClient
    .select("*")
    .eq("id", apiKeyData.user_id)
    .single()

  if (userError || !user) {
    console.error("validateApiKey: Usuário não encontrado para API key.", {
      userId: apiKeyData.user_id,
      userError: userError?.message,
    })
    return { isValid: false, error: "Usuário associado à API key não encontrado", status: 403 }
  }

  if (user.status !== "active") {
    console.warn("validateApiKey: Usuário não está ativo.", { userId: user.id, userStatus: user.status })
    return { isValid: false, error: "Usuário associado à API key não está ativo", status: 403 }
  }
  ;(async () => {
    try {
      const supabaseApiKeysClient = await db.userApiKeys()
      const { error: updateError } = await supabaseApiKeysClient
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", apiKeyData.id)
      if (updateError) {
        console.error("validateApiKey: Falha ao atualizar last_used_at:", updateError.message)
      } else {
        console.log("validateApiKey: last_used_at atualizado para key ID:", apiKeyData.id)
      }
    } catch (e) {
      console.error("validateApiKey: Exceção ao atualizar last_used_at:", e)
    }
  })()

  console.log("validateApiKey: API key validada com sucesso.", { userId: user.id, apiKeyId: apiKeyData.id })
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
