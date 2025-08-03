import { NextRequest, NextResponse } from "next/server"
import { getCurrentServerUser } from "@/lib/auth-server"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentServerUser(request)
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get("connection_id")

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 })
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    // Construir query
    let query = `${supabaseUrl}/rest/v1/folowUp24hs_mensagem?select=*,whatsapp_connections!whatsapp_conenections_id(connection_name)&order=tentativa_dia.asc`

    // Filtrar por conexão se especificado
    if (connectionId) {
      query += `&whatsapp_conenections_id=eq.${connectionId}`
    }

    // Se não for admin, filtrar por usuário
    if (user.role !== "admin") {
      // Buscar conexões do usuário primeiro
      const connectionsResponse = await fetch(
        `${supabaseUrl}/rest/v1/whatsapp_connections?select=id&user_id=eq.${user.id}`,
        { headers }
      )
      
      if (!connectionsResponse.ok) {
        throw new Error("Erro ao buscar conexões do usuário")
      }
      
      const userConnections = await connectionsResponse.json()
      const connectionIds = userConnections.map((conn: any) => conn.id)
      
      if (connectionIds.length === 0) {
        return NextResponse.json({ success: true, messages: [] })
      }
      
      query += `&whatsapp_conenections_id=in.(${connectionIds.join(",")})`
    }

    const response = await fetch(query, { headers })

    if (!response.ok) {
      throw new Error("Erro ao buscar mensagens")
    }

    const messages = await response.json()

    return NextResponse.json({
      success: true,
      messages: messages || [],
    })
  } catch (error: any) {
    console.error("Erro na API followup/messages GET:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentServerUser(request)
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { whatsapp_conenections_id, tentativa_dia, tipo_mensagem, mensagem, link } = body

    if (!whatsapp_conenections_id || !tentativa_dia || !tipo_mensagem) {
      return NextResponse.json(
        { error: "Campos obrigatórios: whatsapp_conenections_id, tentativa_dia, tipo_mensagem" },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 })
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    // Verificar se a conexão pertence ao usuário (se não for admin)
    if (user.role !== "admin") {
      const connectionResponse = await fetch(
        `${supabaseUrl}/rest/v1/whatsapp_connections?select=id&id=eq.${whatsapp_conenections_id}&user_id=eq.${user.id}`,
        { headers }
      )

      if (!connectionResponse.ok) {
        throw new Error("Erro ao verificar conexão")
      }

      const connections = await connectionResponse.json()
      if (!connections || connections.length === 0) {
        return NextResponse.json({ error: "Conexão não encontrada ou sem permissão" }, { status: 403 })
      }
    }

    // Criar mensagem
    const newMessage = {
      whatsapp_conenections_id,
      tentativa_dia: Number(tentativa_dia),
      tipo_mensagem,
      mensagem: mensagem || null,
      link: link || null,
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/folowUp24hs_mensagem`, {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "return=representation",
      },
      body: JSON.stringify(newMessage),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Erro ao criar mensagem: ${errorText}`)
    }

    const createdMessage = await response.json()

    return NextResponse.json({
      success: true,
      message: createdMessage[0],
    })
  } catch (error: any) {
    console.error("Erro na API followup/messages POST:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentServerUser(request)
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { id, whatsapp_conenections_id, tentativa_dia, tipo_mensagem, mensagem, link } = body

    if (!id) {
      return NextResponse.json({ error: "ID da mensagem é obrigatório" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 })
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    // Verificar se a mensagem existe e se o usuário tem permissão
    if (user.role !== "admin") {
      const messageResponse = await fetch(
        `${supabaseUrl}/rest/v1/folowUp24hs_mensagem?select=*,whatsapp_connections!whatsapp_conenections_id(user_id)&id=eq.${id}`,
        { headers }
      )

      if (!messageResponse.ok) {
        throw new Error("Erro ao verificar mensagem")
      }

      const messages = await messageResponse.json()
      if (!messages || messages.length === 0) {
        return NextResponse.json({ error: "Mensagem não encontrada" }, { status: 404 })
      }

      if (messages[0].whatsapp_connections?.user_id !== user.id) {
        return NextResponse.json({ error: "Sem permissão para editar esta mensagem" }, { status: 403 })
      }
    }

    // Atualizar mensagem
    const updateData: any = {}
    if (whatsapp_conenections_id !== undefined) updateData.whatsapp_conenections_id = whatsapp_conenections_id
    if (tentativa_dia !== undefined) updateData.tentativa_dia = Number(tentativa_dia)
    if (tipo_mensagem !== undefined) updateData.tipo_mensagem = tipo_mensagem
    if (mensagem !== undefined) updateData.mensagem = mensagem || null
    if (link !== undefined) updateData.link = link || null

    const response = await fetch(`${supabaseUrl}/rest/v1/folowUp24hs_mensagem?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        ...headers,
        Prefer: "return=representation",
      },
      body: JSON.stringify(updateData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Erro ao atualizar mensagem: ${errorText}`)
    }

    const updatedMessage = await response.json()

    return NextResponse.json({
      success: true,
      message: updatedMessage[0],
    })
  } catch (error: any) {
    console.error("Erro na API followup/messages PUT:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentServerUser(request)
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID da mensagem é obrigatório" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 })
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    // Verificar se a mensagem existe e se o usuário tem permissão
    if (user.role !== "admin") {
      const messageResponse = await fetch(
        `${supabaseUrl}/rest/v1/folowUp24hs_mensagem?select=*,whatsapp_connections!whatsapp_conenections_id(user_id)&id=eq.${id}`,
        { headers }
      )

      if (!messageResponse.ok) {
        throw new Error("Erro ao verificar mensagem")
      }

      const messages = await messageResponse.json()
      if (!messages || messages.length === 0) {
        return NextResponse.json({ error: "Mensagem não encontrada" }, { status: 404 })
      }

      if (messages[0].whatsapp_connections?.user_id !== user.id) {
        return NextResponse.json({ error: "Sem permissão para deletar esta mensagem" }, { status: 403 })
      }
    }

    // Deletar mensagem
    const response = await fetch(`${supabaseUrl}/rest/v1/folowUp24hs_mensagem?id=eq.${id}`, {
      method: "DELETE",
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Erro ao deletar mensagem: ${errorText}`)
    }

    return NextResponse.json({
      success: true,
      message: "Mensagem deletada com sucesso",
    })
  } catch (error: any) {
    console.error("Erro na API followup/messages DELETE:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    )
  }
} 