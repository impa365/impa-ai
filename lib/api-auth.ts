import { createClient } from "@supabase/supabase-js"

export async function validateApiKey(request: Request): Promise<{ isValid: boolean; user?: any; error?: string }> {
  try {
    const authHeader = request.headers.get("authorization")

    // Debug log (apenas em desenvolvimento)
    if (process.env.NODE_ENV === "development") {
      console.log("Auth header received:", authHeader ? "Present" : "Missing")
    }

    if (!authHeader) {
      return { isValid: false, error: "Authorization header missing" }
    }

    // Verificar se o header está no formato correto
    if (!authHeader.startsWith("Bearer ")) {
      return { isValid: false, error: "Invalid authorization format. Use: Bearer YOUR_API_KEY" }
    }

    const apiKey = authHeader.replace("Bearer ", "").trim()

    if (process.env.NODE_ENV === "development") {
      console.log("API key extracted:", apiKey ? `${apiKey.substring(0, 12)}...` : "Empty")
    }

    if (!apiKey) {
      return { isValid: false, error: "API key é obrigatória" }
    }

    // Verificar se a API key tem o formato esperado
    if (!apiKey.startsWith("impaai_")) {
      return { isValid: false, error: "Invalid API key format" }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return { isValid: false, error: "Server configuration error" }
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: "impaai" },
    })

    // Buscar a API key no banco
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from("user_api_keys")
      .select(`
        id,
        user_id,
        name,
        is_active,
        permissions,
        rate_limit,
        last_used_at,
        user_profiles!inner(
          id,
          email,
          full_name,
          role,
          status
        )
      `)
      .eq("api_key", apiKey)
      .eq("is_active", true)
      .single()

    if (apiKeyError || !apiKeyData) {
      if (process.env.NODE_ENV === "development") {
        console.log("API key lookup error:", apiKeyError?.message || "Key not found")
      }
      return { isValid: false, error: "Invalid or inactive API key" }
    }

    // Verificar se o usuário está ativo
    if (apiKeyData.user_profiles.status !== "active") {
      return { isValid: false, error: "User account is not active" }
    }

    // Atualizar o último uso da API key (sem aguardar)
    supabase
      .from("user_api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", apiKeyData.id)
      .then(() => {
        if (process.env.NODE_ENV === "development") {
          console.log("API key last_used_at updated")
        }
      })
      .catch((error) => {
        console.error("Error updating last_used_at:", error)
      })

    return {
      isValid: true,
      user: {
        id: apiKeyData.user_profiles.id,
        email: apiKeyData.user_profiles.email,
        full_name: apiKeyData.user_profiles.full_name,
        role: apiKeyData.user_profiles.role,
        api_key_id: apiKeyData.id,
        api_key_name: apiKeyData.name,
        permissions: apiKeyData.permissions || ["read"],
      },
    }
  } catch (error) {
    console.error("Error validating API key:", error)
    return { isValid: false, error: "Internal server error during authentication" }
  }
}

export function hasPermission(user: any, requiredPermission: string): boolean {
  if (!user || !user.permissions) {
    return false
  }

  // Admin sempre tem todas as permissões
  if (user.role === "admin") {
    return true
  }

  return user.permissions.includes(requiredPermission) || user.permissions.includes("all")
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
