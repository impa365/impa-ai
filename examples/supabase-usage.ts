import { db } from "@/lib/supabase"
import { TABLES } from "@/lib/supabase-config"

// Exemplo 1: Buscar todos os usuários
async function getAllUsers() {
  const { data, error } = await db.users().select("*")

  if (error) {
    console.error("Erro ao buscar usuários:", error)
    return []
  }

  return data
}

// Exemplo 2: Buscar agentes de um usuário específico
async function getUserAgents(userId: string) {
  const { data, error } = await db.agents().select("*").eq("user_id", userId)

  if (error) {
    console.error("Erro ao buscar agentes:", error)
    return []
  }

  return data
}

// Exemplo 3: Inserir um novo log de atividade
async function createActivityLog(agentId: string, activityType: string, activityData: any) {
  const { data, error } = await db.activityLogs().insert({
    agent_id: agentId,
    activity_type: activityType,
    activity_data: activityData,
  })

  if (error) {
    console.error("Erro ao criar log:", error)
    return false
  }

  return true
}

// Exemplo 4: Usando a API REST diretamente
async function getAgentLogsREST(agentId: string) {
  return db.fetchRest(TABLES.AGENT_ACTIVITY_LOGS, {
    select: "id,activity_type,created_at,activity_data",
    filters: { agent_id: agentId },
    limit: 50,
    order: { column: "created_at", ascending: false },
  })
}

// Exemplo 5: Atualizar configurações do usuário
async function updateUserSettings(userId: string, settings: any) {
  const { data, error } = await db.userSettings().update(settings).eq("user_id", userId)

  if (error) {
    console.error("Erro ao atualizar configurações:", error)
    return false
  }

  return true
}
