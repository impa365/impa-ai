import { db } from "./supabase"

export interface ApiKeyData {
  id: string
  user_id: string
  name: string
  api_key: string
  description?: string
  permissions: string[]
  rate_limit: number
  is_active: boolean
  is_admin_key: boolean
  access_scope: string
  created_at: string
  updated_at: string
}

export interface UserData {
  id: string
  email: string
  full_name: string
  role: string
  status: string
}

export async function validateApiKey(apiKey: string): Promise<{
  isValid: boolean
  user?: UserData
  apiKeyData?: ApiKeyData
  error?: string
}> {
  try {
    if (!apiKey || !apiKey.startsWith("impa_")) {
      return { isValid: false, error: "API key inválida" }
    }

    // Buscar API key usando query direta ao invés de RPC
    const { data: apiKeyData, error: apiKeyError } = await (await db.users())
      .select(`
        id,
        user_id,
        name,
        api_key,
        description,
        permissions,
        rate_limit,
        is_active,
        is_admin_key,
        access_scope,
        created_at,
        updated_at
      `)
      .eq("api_key", apiKey)
      .eq("is_active", true)
      .single()

    if (apiKeyError) {
      console.error("Erro ao buscar API key:", apiKeyError)
      return { isValid: false, error: "API key não encontrada" }
    }

    if (!apiKeyData) {
      return { isValid: false, error: "API key não encontrada" }
    }

    // Buscar dados do usuário
    const { data: userData, error: userError } = await (await db.users())
      .select("id, email, full_name, role, status")
      .eq("id", apiKeyData.user_id)
      .eq("status", "active")
      .single()

    if (userError || !userData) {
      return { isValid: false, error: "Usuário não encontrado ou inativo" }
    }

    // Atualizar último uso da API key
    await (await db.users()).rpc("update_api_key_usage", [apiKey])

    return {
      isValid: true,
      user: userData as UserData,
      apiKeyData: apiKeyData as ApiKeyData,
    }
  } catch (error) {
    console.error("Erro na validação da API key:", error)
    return { isValid: false, error: "Erro interno do servidor" }
  }
}

export function canAccessAgent(
  userRole: string,
  isAdminKey: boolean,
  agentUserId: string,
  requestUserId: string,
): boolean {
  // Admin ou chave admin pode acessar qualquer agente
  if (userRole === "admin" || isAdminKey) {
    return true
  }

  // Usuário comum só pode acessar seus próprios agentes
  return agentUserId === requestUserId
}

export async function getDefaultModel(): Promise<string> {
  try {
    const { data: setting, error } = await (await db.users())
      .select("setting_value")
      .eq("setting_key", "default_model")
      .single()

    if (error || !setting) {
      console.warn("Modelo padrão não encontrado, usando gpt-4o-mini")
      return "gpt-4o-mini"
    }

    return setting.setting_value as string
  } catch (error: any) {
    console.error("Erro ao buscar modelo padrão:", error.message)
    return "gpt-4o-mini"
  }
}
