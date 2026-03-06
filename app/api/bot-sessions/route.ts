import { NextResponse } from "next/server"
import { queryMany, queryOne, buildInsert, buildUpdate } from "@/lib/db"

/**
 * GET /api/bot-sessions
 * Lista todas as sessões de um bot ou conexão
 * Query params: bot_id, connection_id, remoteJid, status
 */
export async function GET(request: Request) {
  try {
    console.log("📡 API: GET /api/bot-sessions chamada")

    // Buscar usuário atual do cookie
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    const userCookie = cookieStore.get("impaai_user")

    if (!userCookie) {
      console.error("❌ Não autorizado: cookie ausente")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    let currentUser
    try {
      currentUser = JSON.parse(userCookie.value)
    } catch (error) {
      console.error("❌ Não autorizado: cookie inválido")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Extrair query params
    const { searchParams } = new URL(request.url)
    const botId = searchParams.get("bot_id")
    const connectionId = searchParams.get("connection_id")
    const remoteJid = searchParams.get("remoteJid")
    const status = searchParams.get("status")
    
    console.log("📋 Query params recebidos:", { botId, connectionId, remoteJid, status })

    // 🔒 SEGURANÇA: EXIGIR bot_id ou connection_id para evitar vazamento de dados
    if (!botId && !connectionId) {
      console.error("❌ SEGURANÇA: Tentativa de buscar TODAS as sessões sem filtro!")
      return NextResponse.json(
        {
          success: false,
          error: "Filtro obrigatório: bot_id ou connection_id deve ser fornecido",
          details: "Por segurança, não é permitido buscar todas as sessões sem filtro",
        },
        { status: 400 }
      )
    }

    // 🔒 SEGURANÇA CRÍTICA: Validar propriedade do bot/conexão ANTES de buscar sessões
    // Admin tem acesso total, usuários comuns apenas aos seus
    const isAdmin = currentUser.role === "admin"
    
    if (botId && !isAdmin) {
      // Verificar se o bot pertence ao usuário (admin bypassa essa verificação)
      // IMPORTANTE: bot_id é o UUID do bot externo, não o id do ai_agents
      const bots = await queryMany<{ id: string; user_id: string; bot_id: string }>(
        'SELECT id, user_id, bot_id FROM ai_agents WHERE bot_id = $1',
        [botId]
      )
      
      if (!bots || bots.length === 0) {
        console.error("❌ SEGURANÇA: Bot não encontrado:", botId)
        return NextResponse.json({ error: "Bot não encontrado" }, { status: 404 })
      }
      
      if (bots[0].user_id !== currentUser.id) {
        console.error("❌ SEGURANÇA VIOLADA: Usuário", currentUser.id, "tentou acessar sessões do bot", botId, "que pertence a", bots[0].user_id)
        return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
      }
      
      console.log("✅ Propriedade do bot validada para usuário:", currentUser.id)
    } else if (botId && isAdmin) {
      console.log("✅ Admin acessando bot:", botId)
    }
    
    if (connectionId && !isAdmin) {
      // Verificar se a conexão pertence ao usuário (admin bypassa essa verificação)
      const connections = await queryMany<{ id: string; user_id: string }>(
        'SELECT id, user_id FROM whatsapp_connections WHERE id = $1',
        [connectionId]
      )
      
      if (!connections || connections.length === 0) {
        console.error("❌ SEGURANÇA: Conexão não encontrada:", connectionId)
        return NextResponse.json({ error: "Conexão não encontrada" }, { status: 404 })
      }
      
      if (connections[0].user_id !== currentUser.id) {
        console.error("❌ SEGURANÇA VIOLADA: Usuário", currentUser.id, "tentou acessar sessões da conexão", connectionId, "que pertence a", connections[0].user_id)
        return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
      }
      
      console.log("✅ Propriedade da conexão validada para usuário:", currentUser.id)
    } else if (connectionId && isAdmin) {
      console.log("✅ Admin acessando conexão:", connectionId)
    }

    // Construir query - buscar direto da bot_sessions
    // IMPORTANTE: Sempre filtrar deleted_at IS NULL para ocultar sessões inativas
    const conditions: string[] = ["deleted_at IS NULL"]
    const values: any[] = []
    let paramIndex = 1

    // Filtros CRÍTICOS para separar Uazapi de Evolution
    if (botId) {
      conditions.push(`bot_id = $${paramIndex++}`)
      values.push(botId)
      console.log("🔍 Filtrando por bot_id:", botId)
    }
    if (connectionId) {
      conditions.push(`connection_id = $${paramIndex++}`)
      values.push(connectionId)
      console.log("🔍 Filtrando por connection_id:", connectionId)
    }
    
    // Filtros adicionais
    if (remoteJid) {
      conditions.push(`"remoteJid" = $${paramIndex++}`)
      values.push(remoteJid)
    }
    if (status) {
      conditions.push(`status = $${paramIndex++}`)
      values.push(status === "true")
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
    const sql = `SELECT * FROM bot_sessions ${whereClause} ORDER BY ultimo_status DESC`

    console.log("🔍 Buscando sessões ativas na tabela impaai.bot_sessions")

    const sessions = await queryMany(sql, values)
    console.log(`✅ ${sessions.length} sessões encontradas`)

    return NextResponse.json({
      success: true,
      sessions,
      count: sessions.length,
    })
  } catch (error: any) {
    console.error("❌ Erro na API /api/bot-sessions:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/bot-sessions
 * Cria uma nova sessão de bot
 * Body: { bot_id, connection_id, remoteJid, status? }
 */
export async function POST(request: Request) {
  try {
    console.log("📡 API: POST /api/bot-sessions chamada")

    // Buscar usuário atual do cookie
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    const userCookie = cookieStore.get("impaai_user")

    if (!userCookie) {
      console.error("❌ Não autorizado: cookie ausente")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    let currentUser
    try {
      currentUser = JSON.parse(userCookie.value)
    } catch (error) {
      console.error("❌ Não autorizado: cookie inválido")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { remoteJid, status = true } = body
    
    console.log("📦 Dados recebidos:", { remoteJid, status })

    // Validações
    if (!remoteJid) {
      return NextResponse.json(
        {
          success: false,
          error: "Campo obrigatório: remoteJid",
        },
        { status: 400 }
      )
    }

    // Verificar se já existe sessão ATIVA para este remoteJid
    // IMPORTANTE: Apenas sessões não deletadas (deleted_at IS NULL)
    console.log("🔍 Verificando se sessão ativa já existe para:", remoteJid)
    const existingSessions = await queryMany(
      'SELECT * FROM bot_sessions WHERE "remoteJid" = $1 AND deleted_at IS NULL',
      [remoteJid]
    )

    if (existingSessions && existingSessions.length > 0) {
      console.log("ℹ️ Sessão já existe, atualizando...")
      // Atualizar sessão existente
      const update = buildUpdate(
        "bot_sessions",
        {
          status,
          ultimo_status: new Date().toISOString(),
        },
        { sessionId: existingSessions[0].sessionId }
      )

      const updatedSession = await queryOne(update.text, update.values)

      if (!updatedSession) {
        throw new Error("Erro ao atualizar sessão: nenhum registro retornado")
      }

      console.log("✅ Sessão atualizada")

      return NextResponse.json({
        success: true,
        session: updatedSession,
        message: "Sessão atualizada",
      })
    }

    // Criar nova sessão
    console.log("➕ Criando nova sessão...")
    const insert = buildInsert("bot_sessions", {
      remoteJid,
      status,
    })

    const newSession = await queryOne(insert.text, insert.values)

    if (!newSession) {
      throw new Error("Erro ao criar sessão: nenhum registro retornado")
    }

    console.log("✅ Sessão criada:", newSession.sessionId)

    return NextResponse.json({
      success: true,
      session: newSession,
      message: "Sessão criada com sucesso",
    })
  } catch (error: any) {
    console.error("❌ Erro na API /api/bot-sessions:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error.message,
      },
      { status: 500 }
    )
  }
}
