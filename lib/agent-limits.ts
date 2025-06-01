import { supabase } from "@/lib/supabase"

export interface AgentLimitResponse {
  canCreate: boolean
  currentCount: number
  maxAllowed: number
  message?: string
}

export async function checkAgentLimit(userId: string): Promise<AgentLimitResponse> {
  try {
    // Buscar configurações do usuário
    const { data: userSettings, error: settingsError } = await supabase
      .from("user_settings")
      .select("ai_agents_limit")
      .eq("user_id", userId)
      .single()

    if (settingsError && settingsError.code !== "PGRST116") {
      throw settingsError
    }

    const maxAllowed = userSettings?.ai_agents_limit || 3 // Limite padrão

    // Contar agentes existentes
    const { count, error: countError } = await supabase
      .from("ai_agents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "active")

    if (countError) throw countError

    const currentCount = count || 0
    const canCreate = currentCount < maxAllowed

    let message = ""
    if (!canCreate) {
      message = `Você atingiu o limite de ${maxAllowed} agentes. Exclua um agente existente ou faça upgrade do seu plano.`
    } else if (currentCount >= maxAllowed - 1) {
      message = `Você está próximo do limite de agentes (${currentCount}/${maxAllowed}).`
    }

    return {
      canCreate,
      currentCount,
      maxAllowed,
      message,
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

export async function checkAdminAgentLimit(userId: string): Promise<AgentLimitResponse> {
  try {
    // Para admins, verificar se o usuário existe
    const { data: user, error: userError } = await supabase
      .from("user_profiles")
      .select("id, role")
      .eq("id", userId)
      .single()

    if (userError) {
      throw new Error("Usuário não encontrado")
    }

    // Buscar configurações do usuário
    const { data: userSettings, error: settingsError } = await supabase
      .from("user_settings")
      .select("ai_agents_limit")
      .eq("user_id", userId)
      .single()

    if (settingsError && settingsError.code !== "PGRST116") {
      throw settingsError
    }

    const maxAllowed = userSettings?.ai_agents_limit || 3 // Limite padrão

    // Contar agentes existentes
    const { count, error: countError } = await supabase
      .from("ai_agents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "active")

    if (countError) throw countError

    const currentCount = count || 0
    const canCreate = currentCount < maxAllowed

    let message = ""
    if (!canCreate) {
      message = `O usuário atingiu o limite de ${maxAllowed} agentes. Aumente o limite nas configurações do usuário.`
    } else if (currentCount >= maxAllowed - 1) {
      message = `O usuário está próximo do limite de agentes (${currentCount}/${maxAllowed}).`
    }

    return {
      canCreate,
      currentCount,
      maxAllowed,
      message,
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
