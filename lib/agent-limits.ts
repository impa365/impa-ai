import { supabase } from "./supabase"

/**
 * Verifica se o usuário atingiu o limite de agentes
 * @param userId ID do usuário
 * @returns Objeto com informações sobre o limite de agentes
 */
export async function checkAgentLimit(userId: string): Promise<{
  canCreate: boolean
  currentCount: number
  maxAllowed: number
  message?: string
}> {
  try {
    // Buscar configurações do usuário
    const { data: userSettings, error: userSettingsError } = await supabase
      .from("user_agent_settings")
      .select("agents_limit")
      .eq("user_id", userId)
      .single()

    if (userSettingsError && userSettingsError.code !== "PGRST116") {
      console.error("Erro ao buscar configurações do usuário:", userSettingsError)
      throw userSettingsError
    }

    // Se não encontrou configurações específicas, buscar o limite padrão do sistema
    let agentsLimit = userSettings?.agents_limit

    if (!agentsLimit) {
      const { data: systemSettings, error: systemSettingsError } = await supabase
        .from("system_settings")
        .select("setting_value")
        .eq("setting_key", "default_agents_limit")
        .single()

      if (systemSettingsError) {
        console.error("Erro ao buscar configurações do sistema:", systemSettingsError)
        // Fallback para um valor padrão se não conseguir buscar do banco
        agentsLimit = 3
      } else {
        agentsLimit = systemSettings?.setting_value || 3
      }
    }

    // Contar quantos agentes o usuário já tem
    const { count, error: countError } = await supabase
      .from("ai_agents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)

    if (countError) {
      console.error("Erro ao contar agentes do usuário:", countError)
      throw countError
    }

    const currentCount = count || 0
    const canCreate = currentCount < agentsLimit

    return {
      canCreate,
      currentCount,
      maxAllowed: agentsLimit,
      message: canCreate
        ? `Você pode criar mais ${agentsLimit - currentCount} agente(s).`
        : `Você atingiu o limite de ${agentsLimit} agente(s). Entre em contato com o suporte para aumentar seu limite.`,
    }
  } catch (error) {
    console.error("Erro ao verificar limite de agentes:", error)
    // Em caso de erro, permitir a criação para não bloquear o usuário
    return {
      canCreate: true,
      currentCount: 0,
      maxAllowed: 3,
      message: "Não foi possível verificar seu limite de agentes. Tente novamente mais tarde.",
    }
  }
}
