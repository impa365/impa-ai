import { createClient } from "@/lib/supabase"

export type AgentLimitResponse = {
  canCreate: boolean
  currentCount: number
  maxAllowed: number
  message?: string
}

/**
 * Verifica se um usuário pode criar mais agentes
 * @param userId ID do usuário
 * @returns Objeto com informações sobre o limite de agentes
 */
export async function checkAgentLimit(userId: string): Promise<AgentLimitResponse> {
  const supabase = createClient()

  try {
    // Busca o perfil do usuário para verificar o plano
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("plan_type")
      .eq("user_id", userId)
      .single()

    if (profileError) {
      console.error("Erro ao buscar perfil do usuário:", profileError)
      return {
        canCreate: false,
        currentCount: 0,
        maxAllowed: 0,
        message: "Erro ao verificar perfil do usuário",
      }
    }

    // Determina o limite máximo com base no plano
    let maxAllowed = 1 // Plano gratuito (padrão)

    if (profile?.plan_type === "premium") {
      maxAllowed = 5
    } else if (profile?.plan_type === "business") {
      maxAllowed = 20
    } else if (profile?.plan_type === "enterprise") {
      maxAllowed = 100
    }

    // Conta quantos agentes o usuário já tem
    const { count, error: countError } = await supabase
      .from("ai_agents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    if (countError) {
      console.error("Erro ao contar agentes do usuário:", countError)
      return {
        canCreate: false,
        currentCount: 0,
        maxAllowed,
        message: "Erro ao verificar quantidade de agentes",
      }
    }

    const currentCount = count || 0
    const canCreate = currentCount < maxAllowed

    return {
      canCreate,
      currentCount,
      maxAllowed,
      message: canCreate
        ? undefined
        : `Você atingiu o limite de ${maxAllowed} agentes para seu plano ${profile?.plan_type || "atual"}`,
    }
  } catch (error) {
    console.error("Erro ao verificar limite de agentes:", error)
    return {
      canCreate: false,
      currentCount: 0,
      maxAllowed: 0,
      message: "Erro ao verificar limite de agentes",
    }
  }
}

/**
 * Verifica se um administrador pode criar mais agentes para um usuário
 * @param userId ID do usuário
 * @returns Objeto com informações sobre o limite de agentes
 */
export async function checkAdminAgentLimit(userId: string): Promise<AgentLimitResponse> {
  // Administradores podem criar agentes para usuários mesmo que tenham atingido o limite
  // Mas ainda precisamos verificar o plano para mostrar informações corretas
  const supabase = createClient()

  try {
    // Busca o perfil do usuário para verificar o plano
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("plan_type")
      .eq("user_id", userId)
      .single()

    if (profileError) {
      console.error("Erro ao buscar perfil do usuário:", profileError)
      return {
        canCreate: true, // Admins sempre podem criar
        currentCount: 0,
        maxAllowed: 0,
        message: "Erro ao verificar perfil do usuário, mas administradores podem criar agentes",
      }
    }

    // Determina o limite máximo com base no plano
    let maxAllowed = 1 // Plano gratuito (padrão)

    if (profile?.plan_type === "premium") {
      maxAllowed = 5
    } else if (profile?.plan_type === "business") {
      maxAllowed = 20
    } else if (profile?.plan_type === "enterprise") {
      maxAllowed = 100
    }

    // Conta quantos agentes o usuário já tem
    const { count, error: countError } = await supabase
      .from("ai_agents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    if (countError) {
      console.error("Erro ao contar agentes do usuário:", countError)
      return {
        canCreate: true, // Admins sempre podem criar
        currentCount: 0,
        maxAllowed,
        message: "Erro ao verificar quantidade de agentes, mas administradores podem criar agentes",
      }
    }

    const currentCount = count || 0

    return {
      canCreate: true, // Admins sempre podem criar
      currentCount,
      maxAllowed,
      message:
        currentCount >= maxAllowed
          ? `Atenção: Este usuário já atingiu o limite de ${maxAllowed} agentes para seu plano ${profile?.plan_type || "atual"}, mas você pode criar mais como administrador`
          : undefined,
    }
  } catch (error) {
    console.error("Erro ao verificar limite de agentes:", error)
    return {
      canCreate: true, // Admins sempre podem criar
      currentCount: 0,
      maxAllowed: 0,
      message: "Erro ao verificar limite de agentes, mas administradores podem criar agentes",
    }
  }
}
