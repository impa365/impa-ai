// @ts-nocheck
// TODO: Arrumar os types desse arquivo
import { db } from "./supabase"
import type { UserProfile } from "@/types/user" // Certifique-se que este tipo está correto

interface ApiKeyData {
  id: string
  user_id: string
  name: string
  key_hash: string // Assumindo que você armazena o hash da chave
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

// Função para simular a verificação de hash (substitua pela sua lógica real)
// Em um cenário real, você usaria bcrypt.compare() ou similar.
// Para este exemplo, vamos assumir que a chave completa é passada e comparada diretamente
// com um valor não hasheado no banco, o que NÃO é seguro para produção.
// A forma correta é: cliente envia a chave, servidor busca pelo prefixo,
// depois compara o hash da parte secreta da chave enviada com o hash armazenado.
// Por simplicidade e para focar no problema do header, vamos manter a lógica atual de busca.

async function verifyApiKey(apiKey: string): Promise<ApiKeyData | null> {
  if (!apiKey || typeof apiKey !== "string") {
    console.error("verifyApiKey: API key is invalid or not a string.", { apiKey })
    return null
  }

  // As chaves geradas são "impaai_" + 30 caracteres aleatórios.
  // O prefixo "impaai_" tem 7 caracteres.
  // A chave completa tem 37 caracteres.
  if (!apiKey.startsWith("impaai_") || apiKey.length !== 37) {
    console.error("verifyApiKey: API key format is invalid.", { keyReceived: apiKey, length: apiKey.length })
    return null
  }

  try {
    const { data, error } = await (await db.userApiKeys())
      .select("*")
      .eq("api_key", apiKey) // Assumindo que você armazena a chave completa (NÃO SEGURO)
      // .eq("key_prefix", apiKey.substring(0, 15)) // Exemplo se usasse prefixo
      .single()

    if (error) {
      console.error("verifyApiKey: Error fetching API key from DB:", error.message, { keyUsedForLookup: apiKey })
      return null
    }
    if (!data) {
      console.warn("verifyApiKey: API key not found in DB.", { keyUsedForLookup: apiKey })
      return null
    }
    console.log("verifyApiKey: API key data found in DB:", data)
    return data as ApiKeyData
  } catch (e) {
    console.error("verifyApiKey: Exception during DB query:", e)
    return null
  }
}

export async function validateApiKey(request: Request): Promise<ValidationResult> {
  let apiKey: string | null = null

  // 1. Tenta pegar do header 'apikey' (case-insensitive)
  const apiKeyHeader = request.headers.get("apikey") || request.headers.get("Apikey") || request.headers.get("APIKEY")
  if (apiKeyHeader) {
    apiKey = apiKeyHeader
    console.log("validateApiKey: Found key in 'apikey' header:", apiKey)
  }

  // 2. Se não encontrou, tenta pegar do header 'Authorization: Bearer <token>'
  if (!apiKey) {
    const authHeader = request.headers.get("Authorization") || request.headers.get("authorization")
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      apiKey = authHeader.substring(7) // Remove "Bearer "
      console.log("validateApiKey: Found key in 'Authorization: Bearer' header:", apiKey)
    }
  }

  if (!apiKey) {
    console.warn("validateApiKey: API key not found in headers.")
    return { isValid: false, error: "API key é obrigatória", status: 401 }
  }

  const apiKeyData = await verifyApiKey(apiKey)

  if (!apiKeyData) {
    console.warn("validateApiKey: API key verification failed (not found or DB error).", { apiKey })
    return { isValid: false, error: "API key inválida ou não encontrada", status: 401 }
  }

  // Verifica se a chave expirou (se houver expires_at)
  if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
    console.warn("validateApiKey: API key has expired.", { apiKeyData })
    return { isValid: false, error: "API key expirada", status: 401 }
  }

  const { data: user, error: userError } = await (await db.userProfiles())
    .select("*")
    .eq("id", apiKeyData.user_id)
    .single()

  if (userError || !user) {
    console.error("validateApiKey: User not found for API key.", { userId: apiKeyData.user_id, userError })
    return {
      isValid: false,
      error: "Usuário associado à API key não encontrado",
      status: 403,
    }
  }

  if (user.status !== "active") {
    console.warn("validateApiKey: User is not active.", { userStatus: user.status })
    return { isValid: false, error: "Usuário associado à API key não está ativo", status: 403 }
  }
  // Atualiza last_used_at (não precisa esperar)
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

// Função de verificação de permissão (exemplo)
export function hasPermission(
  userRole: string | undefined,
  isAdminKey: boolean | undefined,
  requiredRole: string,
): boolean {
  if (!userRole) return false
  if (isAdminKey) return true // Chave de admin tem todas as permissões
  return userRole === "admin" || userRole === requiredRole
}

// Função para verificar se pode acessar um agente específico
export function canAccessAgent(
  userRole: string | undefined,
  isAdminKey: boolean | undefined,
  agentUserId: string | undefined,
  currentUserId: string | undefined,
): boolean {
  if (!userRole || !currentUserId) return false
  if (isAdminKey) return true // Chave de admin pode acessar qualquer agente
  if (userRole === "admin") return true // Usuário admin pode acessar qualquer agente
  return agentUserId === currentUserId // Usuário comum só pode acessar seus próprios agentes
}
