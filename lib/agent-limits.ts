import { queryOne } from "@/lib/db"

export async function getUserAgentLimit(userId: string): Promise<number> {
  try {
    // Primeiro, tenta obter o limite específico do usuário
    const userSettings = await queryOne<{ agents_limit: number }>(
      `SELECT agents_limit FROM user_settings WHERE user_id = $1`,
      [userId]
    );

    if (userSettings?.agents_limit !== undefined && userSettings?.agents_limit !== null) {
      return userSettings.agents_limit
    }

    // Se não encontrar configuração específica, usa o padrão do sistema
    const systemSettings = await queryOne<{ setting_value: string }>(
      `SELECT setting_value FROM system_settings WHERE setting_key = $1`,
      ["default_agents_limit"]
    );

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
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM ai_agents WHERE user_id = $1`,
      [userId]
    );

    return parseInt(result?.count || "0")
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
