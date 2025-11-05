import { NextResponse } from "next/server"

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

    // Configurações do Supabase
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Variáveis de ambiente do Supabase não configuradas")
    }

    const headersWithSchema = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    // Buscar sessão na tabela do n8n
    console.log("🔍 Buscando sessão na tabela impaai.bot_sessions...")
    const sessionResponse = await fetch(
      `${supabaseUrl}/rest/v1/bot_sessions?select=*&sessionId=eq.${sessionId}`,
      { headers: headersWithSchema }
    )

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text()
      console.error("❌ Erro ao buscar sessão:", sessionResponse.status, errorText)
      throw new Error(`Erro ao buscar sessão: ${sessionResponse.status}`)
    }

    const sessions = await sessionResponse.json()
    if (!sessions || sessions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Sessão não encontrada",
        },
        { status: 404 }
      )
    }

    const session = sessions[0]

    // Admin pode atualizar qualquer sessão, user apenas suas próprias
    // Como não temos bot_id na bot_sessions, vamos permitir para admin e user logado
    console.log(`🔄 ${status ? "Reativando" : "Pausando"} bot para este chat...`)

    // Atualizar sessão
    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/bot_sessions?sessionId=eq.${sessionId}`,
      {
        method: "PATCH",
        headers: {
          ...headersWithSchema,
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
      console.error("❌ Erro ao atualizar sessão:", updateResponse.status, errorText)
      throw new Error(`Erro ao atualizar sessão: ${updateResponse.status}`)
    }

    const [updatedSession] = await updateResponse.json()
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

    // Configurações do Supabase
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Variáveis de ambiente do Supabase não configuradas")
    }

    const headersWithSchema = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    // Buscar sessão na tabela do n8n
    console.log("🔍 Buscando sessão na tabela impaai.bot_sessions...")
    const sessionResponse = await fetch(
      `${supabaseUrl}/rest/v1/bot_sessions?select=*&sessionId=eq.${sessionId}`,
      { headers: headersWithSchema }
    )

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text()
      console.error("❌ Erro ao buscar sessão:", sessionResponse.status, errorText)
      throw new Error(`Erro ao buscar sessão: ${sessionResponse.status}`)
    }

    const sessions = await sessionResponse.json()
    if (!sessions || sessions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Sessão não encontrada",
        },
        { status: 404 }
      )
    }

    const session = sessions[0]

    // Admin pode deletar qualquer sessão, user pode deletar se for dele
    // Como não temos bot_id na bot_sessions, vamos permitir para admin e user logado
    console.log("🗑️ Marcando sessão como INATIVA (soft delete)...")
    
    // SOFT DELETE: Marcar como inativa (deleted_at) ao invés de deletar fisicamente
    // Estado resultante: INATIVA (não aparece no painel, mantida no BD)
    // Após 30 dias, será apagada fisicamente por job de limpeza
    const deleteResponse = await fetch(
      `${supabaseUrl}/rest/v1/bot_sessions?sessionId=eq.${sessionId}`,
      {
        method: "PATCH",
        headers: {
          ...headersWithSchema,
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          deleted_at: new Date().toISOString(),
          status: false, // Garante que está pausada também
        }),
      }
    )

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text()
      console.error("❌ Erro ao inativar sessão:", deleteResponse.status, errorText)
      throw new Error(`Erro ao inativar sessão: ${deleteResponse.status}`)
    }

    const [inactivatedSession] = await deleteResponse.json()
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

