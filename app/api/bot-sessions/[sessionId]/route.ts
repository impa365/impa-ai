import { NextResponse } from "next/server"
import { queryMany, queryOne, buildUpdate } from "@/lib/db"

/**
 * PUT /api/bot-sessions/[sessionId]
 * Atualiza uma sessão (pausar/reativar bot para um chat)
 * Body: { status: boolean }
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    console.log("📡 API: PUT /api/bot-sessions/[sessionId] chamada para:", sessionId)

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

    const isAdmin = currentUser.role === "admin"

    const body = await request.json()
    const { status } = body
    
    console.log("📦 Dados recebidos:", { status, sessionId })

    if (typeof status !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          error: "Campo 'status' deve ser boolean",
        },
        { status: 400 }
      )
    }

    // Buscar sessão na tabela do n8n
    console.log("🔍 Buscando sessão na tabela impaai.bot_sessions...")
    const session = await queryOne(
      'SELECT * FROM bot_sessions WHERE "sessionId" = $1',
      [sessionId]
    )

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Sessão não encontrada",
        },
        { status: 404 }
      )
    }

    // 🔒 SEGURANÇA CRÍTICA: Validar propriedade através do bot_id ou connection_id
    // Admin tem acesso total, usuários comuns apenas aos seus
    if (session.bot_id && !isAdmin) {
      // Verificar se o bot pertence ao usuário (admin bypassa essa verificação)
      // IMPORTANTE: bot_id é o UUID do bot externo, não o id do ai_agents
      const bots = await queryMany<{ id: string; user_id: string; bot_id: string }>(
        'SELECT id, user_id, bot_id FROM ai_agents WHERE bot_id = $1',
        [session.bot_id]
      )
      
      if (bots && bots.length > 0 && bots[0].user_id !== currentUser.id) {
        console.error("❌ SEGURANÇA VIOLADA: Usuário", currentUser.id, "tentou modificar sessão do bot", session.bot_id, "que pertence a", bots[0].user_id)
        return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
      }
    } else if (session.bot_id && isAdmin) {
      console.log("✅ Admin modificando sessão do bot:", session.bot_id)
    }
    
    if (session.connection_id && !isAdmin) {
      // Verificar se a conexão pertence ao usuário (admin bypassa essa verificação)
      const connections = await queryMany<{ id: string; user_id: string }>(
        'SELECT id, user_id FROM whatsapp_connections WHERE id = $1',
        [session.connection_id]
      )
      
      if (connections && connections.length > 0 && connections[0].user_id !== currentUser.id) {
        console.error("❌ SEGURANÇA VIOLADA: Usuário", currentUser.id, "tentou modificar sessão da conexão", session.connection_id, "que pertence a", connections[0].user_id)
        return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
      }
    } else if (session.connection_id && isAdmin) {
      console.log("✅ Admin modificando sessão da conexão:", session.connection_id)
    }
    
    console.log(`✅ Propriedade validada para usuário: ${currentUser.id}`)
    console.log(`🔄 ${status ? "Reativando" : "Pausando"} bot para este chat...`)

    // Atualizar sessão
    const update = buildUpdate(
      "bot_sessions",
      {
        status,
        ultimo_status: new Date().toISOString(),
      },
      { sessionId }
    )

    const updatedSession = await queryOne(update.text, update.values)

    if (!updatedSession) {
      throw new Error("Erro ao atualizar sessão: nenhum registro retornado")
    }

    console.log(`✅ Bot ${status ? "reativado" : "pausado"} para este chat`)

    return NextResponse.json({
      success: true,
      session: updatedSession,
      message: status ? "Bot reativado para este chat" : "Bot pausado para este chat",
    })
  } catch (error: any) {
    console.error("❌ Erro na API /api/bot-sessions/[sessionId]:", error.message)
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
 * DELETE /api/bot-sessions/[sessionId]
 * Deleta uma sessão
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    console.log("📡 API: DELETE /api/bot-sessions/[sessionId] chamada para:", sessionId)

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

    const isAdmin = currentUser.role === "admin"

    // Buscar sessão na tabela do n8n
    console.log("🔍 Buscando sessão na tabela impaai.bot_sessions...")
    const session = await queryOne(
      'SELECT * FROM bot_sessions WHERE "sessionId" = $1',
      [sessionId]
    )

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Sessão não encontrada",
        },
        { status: 404 }
      )
    }

    // 🔒 SEGURANÇA CRÍTICA: Validar propriedade através do bot_id ou connection_id
    // Admin tem acesso total, usuários comuns apenas aos seus
    if (session.bot_id && !isAdmin) {
      // Verificar se o bot pertence ao usuário (admin bypassa essa verificação)
      // IMPORTANTE: bot_id é o UUID do bot externo, não o id do ai_agents
      const bots = await queryMany<{ id: string; user_id: string; bot_id: string }>(
        'SELECT id, user_id, bot_id FROM ai_agents WHERE bot_id = $1',
        [session.bot_id]
      )
      
      if (bots && bots.length > 0 && bots[0].user_id !== currentUser.id) {
        console.error("❌ SEGURANÇA VIOLADA: Usuário", currentUser.id, "tentou deletar sessão do bot", session.bot_id, "que pertence a", bots[0].user_id)
        return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
      }
    } else if (session.bot_id && isAdmin) {
      console.log("✅ Admin deletando sessão do bot:", session.bot_id)
    }
    
    if (session.connection_id && !isAdmin) {
      // Verificar se a conexão pertence ao usuário (admin bypassa essa verificação)
      const connections = await queryMany<{ id: string; user_id: string }>(
        'SELECT id, user_id FROM whatsapp_connections WHERE id = $1',
        [session.connection_id]
      )
      
      if (connections && connections.length > 0 && connections[0].user_id !== currentUser.id) {
        console.error("❌ SEGURANÇA VIOLADA: Usuário", currentUser.id, "tentou deletar sessão da conexão", session.connection_id, "que pertence a", connections[0].user_id)
        return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
      }
    } else if (session.connection_id && isAdmin) {
      console.log("✅ Admin deletando sessão da conexão:", session.connection_id)
    }
    
    console.log(`✅ Propriedade validada para usuário: ${currentUser.id}`)
    console.log("🗑️ Marcando sessão como INATIVA (soft delete)...")
    
    // SOFT DELETE: Marcar como inativa (deleted_at) ao invés de deletar fisicamente
    // Estado resultante: INATIVA (não aparece no painel, mantida no BD)
    // Após 30 dias, será apagada fisicamente por job de limpeza
    const update = buildUpdate(
      "bot_sessions",
      {
        deleted_at: new Date().toISOString(),
        status: false, // Garante que está pausada também
      },
      { sessionId }
    )

    const inactivatedSession = await queryOne(update.text, update.values)

    if (!inactivatedSession) {
      throw new Error("Erro ao inativar sessão: nenhum registro retornado")
    }

    console.log("✅ Sessão marcada como INATIVA")

    return NextResponse.json({
      success: true,
      message: "Sessão marcada como inativa (não aparecerá mais no painel)",
      session: inactivatedSession,
    })
  } catch (error: any) {
    console.error("❌ Erro na API /api/bot-sessions/[sessionId]:", error.message)
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
