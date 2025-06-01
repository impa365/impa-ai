import { supabase } from "@/lib/supabase"

export async function getUserAgentLimit(userId: string): Promise<number> {
  try {
    // Primeiro, tenta obter o limite específico do usuário
    const { data: userSettings, error: userError } = await supabase
      .from("user_settings")
      .select("agents_limit")
      .eq("user_id", userId)
      .single()

    if (userSettings?.agents_limit !== undefined && userSettings?.agents_limit !== null) {
      return userSettings.agents_limit
    }

    // Se não encontrar configuração específica, usa o padrão do sistema
    const { data: systemSettings, error: systemError } = await supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "default_agents_limit")
      .single()

    if (systemSettings?.setting_value) {
      return Number.parseInt(systemSettings.setting_value)
    }

    // Valor padrão caso não encontre nenhuma configuração
    return 5
  } catch (error) {
    console.error("Erro ao obter limite de agentes:", error)
    return 5 // Valor padrão em caso de erro
  }
}

export async function getUserAgentCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("ai_agents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)

    if (error) throw error
    return count || 0
  } catch (error) {
    console.error("Erro ao contar agentes do usuário:", error)
    return 0
  }
}

export async function checkUserCanCreateAgent(userId: string): Promise<{
  canCreate: boolean
  currentCount: number
  limit: number
}> {
  const limit = await getUserAgentLimit(userId)
  const currentCount = await getUserAgentCount(userId)

  return {
    canCreate: currentCount < limit,
    currentCount,
    limit,
  }
}
