import { NextResponse } from "next/server"

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

    // Configurações do Supabase
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Variáveis de ambiente do Supabase não configuradas")
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    // Extrair query params
    const { searchParams } = new URL(request.url)
    const botId = searchParams.get("bot_id")
    const connectionId = searchParams.get("connection_id")
    const remoteJid = searchParams.get("remoteJid")
    const status = searchParams.get("status")
    
    console.log("📋 Query params recebidos:", { botId, connectionId, remoteJid, status })

    // Usar a tabela bot_sessions no schema impaai
    const headersWithSchema = {
      ...headers,
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
    }

    // Construir query - buscar direto da bot_sessions
    // IMPORTANTE: Sempre filtrar deleted_at IS NULL para ocultar sessões inativas
    let query = `${supabaseUrl}/rest/v1/bot_sessions?select=*&deleted_at=is.null`

    // Filtros
    if (remoteJid) query += `&remoteJid=eq.${remoteJid}`
    if (status) query += `&status=eq.${status === "true"}`

    query += `&order=ultimo_status.desc`

    console.log("🔍 Buscando sessões ativas na tabela impaai.bot_sessions:", query)

    const sessionsResponse = await fetch(query, { headers: headersWithSchema })

    if (!sessionsResponse.ok) {
      const errorText = await sessionsResponse.text()
      console.error("❌ Erro ao buscar sessões:", sessionsResponse.status, errorText)
      throw new Error(`Erro ao buscar sessões: ${sessionsResponse.status}`)
    }

    const sessions = await sessionsResponse.json()
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

    // Verificar se já existe sessão ATIVA para este remoteJid
    // IMPORTANTE: Apenas sessões não deletadas (deleted_at IS NULL)
    console.log("🔍 Verificando se sessão ativa já existe para:", remoteJid)
    const existingSessionResponse = await fetch(
      `${supabaseUrl}/rest/v1/bot_sessions?select=*&remoteJid=eq.${remoteJid}&deleted_at=is.null`,
      { headers: headersWithSchema }
    )

    if (existingSessionResponse.ok) {
      const existingSessions = await existingSessionResponse.json()
      if (existingSessions && existingSessions.length > 0) {
        console.log("ℹ️ Sessão já existe, atualizando...")
        // Atualizar sessão existente
        const updateResponse = await fetch(
          `${supabaseUrl}/rest/v1/bot_sessions?sessionId=eq.${existingSessions[0].sessionId}`,
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
        console.log("✅ Sessão atualizada")

        return NextResponse.json({
          success: true,
          session: updatedSession,
          message: "Sessão atualizada",
        })
      }
    }

    // Criar nova sessão
    console.log("➕ Criando nova sessão...")
    const createResponse = await fetch(`${supabaseUrl}/rest/v1/bot_sessions`, {
      method: "POST",
      headers: {
        ...headersWithSchema,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        remoteJid,
        status,
      }),
    })

    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      console.error("❌ Erro ao criar sessão:", createResponse.status, errorText)
      throw new Error(`Erro ao criar sessão: ${createResponse.status}`)
    }

    const [newSession] = await createResponse.json()
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

