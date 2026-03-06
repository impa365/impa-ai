import { queryOne } from "./db";

export async function validateApiKey(
  request: Request
): Promise<{ isValid: boolean; user?: any; error?: string }> {
  try {
    const authHeader = request.headers.get("authorization");

    // Debug log (apenas em desenvolvimento)
    if (process.env.NODE_ENV === "development") {
      console.log("Auth header received:", authHeader ? "Present" : "Missing");
    }

    if (!authHeader) {
      return { isValid: false, error: "Authorization header missing" };
    }

    // Verificar se o header está no formato correto
    if (!authHeader.startsWith("Bearer ")) {
      return {
        isValid: false,
        error: "Invalid authorization format. Use: Bearer YOUR_API_KEY",
      };
    }

    const apiKey = authHeader.replace("Bearer ", "").trim();

    if (process.env.NODE_ENV === "development") {
      console.log(
        "API key extracted:",
        apiKey ? `${apiKey.substring(0, 12)}...` : "Empty"
      );
    }

    if (!apiKey) {
      return { isValid: false, error: "API key é obrigatória" };
    }

    // Verificar se a API key tem o formato esperado
    if (!apiKey.startsWith("impaai_")) {
      return { isValid: false, error: "Invalid API key format" };
    }

    // Buscar a API key no banco com JOIN em user_profiles
    const apiKeyData = await queryOne(
      `SELECT 
        ak.id,
        ak.user_id,
        ak.name,
        ak.is_active,
        ak.permissions,
        ak.rate_limit,
        ak.last_used_at,
        up.id as user_profile_id,
        up.email as user_email,
        up.full_name as user_full_name,
        up.role as user_role,
        up.status as user_status
      FROM user_api_keys ak
      INNER JOIN user_profiles up ON ak.user_id = up.id
      WHERE ak.api_key = $1 AND ak.is_active = true`,
      [apiKey]
    );

    if (!apiKeyData) {
      if (process.env.NODE_ENV === "development") {
        console.log("API key lookup error: Key not found");
      }
      return { isValid: false, error: "Invalid or inactive API key" };
    }

    // Verificar se o usuário está ativo
    if (apiKeyData.user_status !== "active") {
      return { isValid: false, error: "User account is not active" };
    }

    // Atualizar o último uso da API key (sem aguardar)
    queryOne(
      `UPDATE user_api_keys SET last_used_at = $1 WHERE id = $2`,
      [new Date().toISOString(), apiKeyData.id]
    ).then(() => {
      if (process.env.NODE_ENV === "development") {
        console.log("API key last_used_at updated");
      }
    }).catch((error) => {
      console.error("Error updating last_used_at:", error);
    });

    return {
      isValid: true,
      user: {
        id: apiKeyData.user_profile_id,
        email: apiKeyData.user_email,
        full_name: apiKeyData.user_full_name,
        role: apiKeyData.user_role,
        api_key_id: apiKeyData.id,
        api_key_name: apiKeyData.name,
        permissions: apiKeyData.permissions || ["read"],
      },
    };
  } catch (error) {
    console.error("Error validating API key:", error);
    return {
      isValid: false,
      error: "Internal server error during authentication",
    };
  }
}

export function hasPermission(user: any, requiredPermission: string): boolean {
  if (!user || !user.permissions) {
    return false;
  }

  // Admin sempre tem todas as permissões
  if (user.role === "admin") {
    return true;
  }

  return (
    user.permissions.includes(requiredPermission) ||
    user.permissions.includes("all")
  );
}

export function canAccessAgent(
  userRole: string,
  isAdminKey: boolean,
  agentUserId: string,
  requestUserId: string
): boolean {
  // Admin ou chave admin pode acessar qualquer agente
  if (userRole === "admin" || isAdminKey) {
    return true;
  }

  // Usuário comum só pode acessar seus próprios agentes
  return agentUserId === requestUserId;
}
