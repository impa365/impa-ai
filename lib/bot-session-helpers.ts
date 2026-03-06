/**
 * Helper functions para gerenciar sessões de bots
 * Migrated from Supabase REST API to direct PostgreSQL via lib/db
 */

import { queryOne, queryMany } from "@/lib/db"

export interface BotSession {
  sessionId: string
  remoteJid: string
  status: boolean
  ultimo_status: string
  criado_em: string
  bot_id: string
  connection_id: string
  deleted_at: string | null  // NULL = Ativa/Pausada, timestamp = Inativa
}

export interface CreateSessionParams {
  botId: string
  connectionId: string
  remoteJid: string
  status?: boolean
}

export interface SessionResult {
  success: boolean
  session?: BotSession
  error?: string
}

/**
 * Cria ou atualiza uma sessão de bot
 * Se já existir sessão para este remoteJid + botId, atualiza
 * Se não existir, cria nova
 */
export async function createOrUpdateSession({
  botId,
  connectionId,
  remoteJid,
  status = true,
}: CreateSessionParams): Promise<SessionResult> {
  try {
    console.log(`🔄 [BOT-SESSION] Criar/Atualizar sessão para ${remoteJid} no bot ${botId}`)

    // Verificar se sessão ATIVA já existe (deleted_at IS NULL)
    const existingSession = await queryOne<BotSession>(
      `SELECT * FROM bot_sessions
       WHERE "remoteJid" = $1 AND bot_id = $2 AND deleted_at IS NULL
       LIMIT 1`,
      [remoteJid, botId]
    )

    if (existingSession) {
      console.log(`ℹ️ [BOT-SESSION] Sessão já existe, atualizando status para: ${status}`)

      const updatedSession = await queryOne<BotSession>(
        `UPDATE bot_sessions
         SET status = $1, ultimo_status = $2
         WHERE "sessionId" = $3
         RETURNING *`,
        [status, new Date().toISOString(), existingSession.sessionId]
      )

      if (!updatedSession) {
        console.error("❌ [BOT-SESSION] Erro ao atualizar sessão")
        return {
          success: false,
          error: "Erro ao atualizar sessão",
        }
      }

      console.log("✅ [BOT-SESSION] Sessão atualizada")
      return {
        success: true,
        session: updatedSession,
      }
    }

    // Criar nova sessão
    console.log("➕ [BOT-SESSION] Criando nova sessão")
    const newSession = await queryOne<BotSession>(
      `INSERT INTO bot_sessions (bot_id, connection_id, "remoteJid", status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [botId, connectionId, remoteJid, status]
    )

    if (!newSession) {
      console.error("❌ [BOT-SESSION] Erro ao criar sessão")
      return {
        success: false,
        error: "Erro ao criar sessão",
      }
    }

    console.log("✅ [BOT-SESSION] Sessão criada:", newSession.sessionId)
    return {
      success: true,
      session: newSession,
    }
  } catch (error: any) {
    console.error("❌ [BOT-SESSION] Erro ao criar/atualizar sessão:", error)
    return {
      success: false,
      error: error.message || "Erro desconhecido",
    }
  }
}

/**
 * Verifica se o bot está ativo para um chat específico
 * Retorna true se não houver sessão (bot ativo por padrão)
 * Retorna false se houver sessão com status = false (bot pausado)
 */
export async function isBotActiveForChat({
  botId,
  remoteJid,
}: {
  botId: string
  remoteJid: string
}): Promise<boolean> {
  try {
    const session = await queryOne<{ status: boolean }>(
      `SELECT status FROM bot_sessions
       WHERE "remoteJid" = $1 AND bot_id = $2 AND deleted_at IS NULL
       LIMIT 1`,
      [remoteJid, botId]
    )

    if (!session) {
      return true // Sem sessão = bot ativo por padrão
    }

    return Boolean(session.status)
  } catch (error: any) {
    console.error("❌ [BOT-SESSION] Erro ao verificar status:", error)
    return true // Em caso de erro, assumir bot ativo
  }
}

/**
 * Pausa o bot para um chat específico
 */
export async function pauseBotForChat({
  botId,
  connectionId,
  remoteJid,
}: Omit<CreateSessionParams, 'status'>): Promise<SessionResult> {
  console.log(`⏸️ [BOT-SESSION] Pausando bot para ${remoteJid}`)
  
  return createOrUpdateSession({
    botId,
    connectionId,
    remoteJid,
    status: false,
  })
}

/**
 * Reativa o bot para um chat específico
 */
export async function resumeBotForChat({
  botId,
  connectionId,
  remoteJid,
}: Omit<CreateSessionParams, 'status'>): Promise<SessionResult> {
  console.log(`▶️ [BOT-SESSION] Reativando bot para ${remoteJid}`)
  
  return createOrUpdateSession({
    botId,
    connectionId,
    remoteJid,
    status: true,
  })
}

/**
 * Busca sessões de um bot específico
 */
export async function getSessionsByBot({
  botId,
  status,
}: {
  botId: string
  status?: boolean
}): Promise<BotSession[]> {
  try {
    let sql = `SELECT * FROM bot_sessions WHERE bot_id = $1 AND deleted_at IS NULL`
    const params: any[] = [botId]

    if (typeof status === "boolean") {
      sql += ` AND status = $2`
      params.push(status)
    }

    sql += ` ORDER BY ultimo_status DESC`

    const sessions = await queryMany<BotSession>(sql, params)
    return sessions || []
  } catch (error: any) {
    console.error("❌ [BOT-SESSION] Erro ao buscar sessões:", error)
    return []
  }
}

