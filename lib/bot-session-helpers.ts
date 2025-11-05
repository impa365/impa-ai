/**
 * Helper functions para gerenciar sessões de bots Uazapi
 */

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
  supabaseUrl: string
  supabaseKey: string
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
  supabaseUrl,
  supabaseKey,
}: CreateSessionParams): Promise<SessionResult> {
  try {
    console.log(`🔄 [BOT-SESSION] Criar/Atualizar sessão para ${remoteJid} no bot ${botId}`)

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    // Verificar se sessão ATIVA já existe (deleted_at IS NULL)
    const existingSessionResponse = await fetch(
      `${supabaseUrl}/rest/v1/bot_sessions?select=*&remoteJid=eq.${remoteJid}&bot_id=eq.${botId}&deleted_at=is.null`,
      { headers }
    )

    if (existingSessionResponse.ok) {
      const existingSessions = await existingSessionResponse.json()
      
      if (existingSessions && existingSessions.length > 0) {
        const existingSession = existingSessions[0]
        console.log(`ℹ️ [BOT-SESSION] Sessão já existe, atualizando status para: ${status}`)

        // Atualizar sessão existente
        const updateResponse = await fetch(
          `${supabaseUrl}/rest/v1/bot_sessions?sessionId=eq.${existingSession.sessionId}`,
          {
            method: "PATCH",
            headers: {
              ...headers,
              Prefer: "return=representation",
            },
            body: JSON.stringify({
              status,
              ultimo_status: new Date().toISOString(),
            }),
          }
        )

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text()
          console.error("❌ [BOT-SESSION] Erro ao atualizar sessão:", errorText)
          return {
            success: false,
            error: `Erro ao atualizar sessão: ${updateResponse.status}`,
          }
        }

        const [updatedSession] = await updateResponse.json()
        console.log("✅ [BOT-SESSION] Sessão atualizada")

        return {
          success: true,
          session: updatedSession,
        }
      }
    }

    // Criar nova sessão
    console.log("➕ [BOT-SESSION] Criando nova sessão")
    const createResponse = await fetch(`${supabaseUrl}/rest/v1/bot_sessions`, {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        bot_id: botId,
        connection_id: connectionId,
        remoteJid,
        status,
      }),
    })

    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      console.error("❌ [BOT-SESSION] Erro ao criar sessão:", errorText)
      return {
        success: false,
        error: `Erro ao criar sessão: ${createResponse.status}`,
      }
    }

    const [newSession] = await createResponse.json()
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
  supabaseUrl,
  supabaseKey,
}: {
  botId: string
  remoteJid: string
  supabaseUrl: string
  supabaseKey: string
}): Promise<boolean> {
  try {
    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    // Buscar apenas sessões ATIVAS (deleted_at IS NULL)
    const sessionResponse = await fetch(
      `${supabaseUrl}/rest/v1/bot_sessions?select=status&remoteJid=eq.${remoteJid}&bot_id=eq.${botId}&deleted_at=is.null`,
      { headers }
    )

    if (!sessionResponse.ok) {
      console.warn("⚠️ [BOT-SESSION] Erro ao verificar sessão, assumindo bot ativo")
      return true // Em caso de erro, assumir bot ativo
    }

    const sessions = await sessionResponse.json()
    
    if (!sessions || sessions.length === 0) {
      // Sem sessão = bot ativo por padrão
      return true
    }

    // Retornar status da sessão
    return Boolean(sessions[0].status)
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
  supabaseUrl,
  supabaseKey,
}: CreateSessionParams): Promise<SessionResult> {
  console.log(`⏸️ [BOT-SESSION] Pausando bot para ${remoteJid}`)
  
  return createOrUpdateSession({
    botId,
    connectionId,
    remoteJid,
    status: false,
    supabaseUrl,
    supabaseKey,
  })
}

/**
 * Reativa o bot para um chat específico
 */
export async function resumeBotForChat({
  botId,
  connectionId,
  remoteJid,
  supabaseUrl,
  supabaseKey,
}: CreateSessionParams): Promise<SessionResult> {
  console.log(`▶️ [BOT-SESSION] Reativando bot para ${remoteJid}`)
  
  return createOrUpdateSession({
    botId,
    connectionId,
    remoteJid,
    status: true,
    supabaseUrl,
    supabaseKey,
  })
}

/**
 * Busca sessões de um bot específico
 */
export async function getSessionsByBot({
  botId,
  supabaseUrl,
  supabaseKey,
  status,
}: {
  botId: string
  supabaseUrl: string
  supabaseKey: string
  status?: boolean
}): Promise<BotSession[]> {
  try {
    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    // Buscar apenas sessões ATIVAS (deleted_at IS NULL)
    let query = `${supabaseUrl}/rest/v1/bot_sessions?select=*&bot_id=eq.${botId}&deleted_at=is.null`
    
    if (typeof status === "boolean") {
      query += `&status=eq.${status}`
    }

    query += `&order=ultimo_status.desc`

    const sessionsResponse = await fetch(query, { headers })

    if (!sessionsResponse.ok) {
      console.error("❌ [BOT-SESSION] Erro ao buscar sessões")
      return []
    }

    const sessions = await sessionsResponse.json()
    return sessions || []
  } catch (error: any) {
    console.error("❌ [BOT-SESSION] Erro ao buscar sessões:", error)
    return []
  }
}

