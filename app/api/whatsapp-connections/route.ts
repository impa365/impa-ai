import { NextResponse } from "next/server"

export async function GET(request: Request) {
  console.log("📡 API: /api/whatsapp-connections chamada")

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const isAdmin = searchParams.get("isAdmin") === "true"

    console.log("🔍 Parâmetros:", { userId, isAdmin })

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

    let url = `${supabaseUrl}/rest/v1/whatsapp_connections?select=*&order=connection_name.asc`

    // Se não for admin e tiver userId, filtrar por usuário
    if (!isAdmin && userId) {
      url += `&user_id=eq.${userId}`
    }

    console.log("🔍 Buscando conexões WhatsApp...")
    const response = await fetch(url, { headers })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Erro ao buscar conexões:", response.status, errorText)
      throw new Error(`Erro ao buscar conexões: ${response.status}`)
    }

    const connections = await response.json()
    console.log("✅ Conexões encontradas:", connections.length)

    // Filtrar dados sensíveis
    const safeConnections = connections.map((conn: any) => ({
      id: conn.id,
      connection_name: conn.connection_name,
      instance_name: conn.instance_name,
      status: conn.status,
      user_id: conn.user_id,
      phone_number: conn.phone_number,
      created_at: conn.created_at,
    }))

    return NextResponse.json({
      success: true,
      connections: safeConnections,
    })
  } catch (error: any) {
    console.error("❌ Erro na API whatsapp-connections:", error.message)
    return NextResponse.json(
      {
        error: "Erro ao buscar conexões WhatsApp",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  console.log("📡 API: POST /api/whatsapp-connections chamada")

  try {
    const connectionData = await request.json()
    console.log("📝 Dados da conexão recebidos:", { name: connectionData.connection_name })

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

    const response = await fetch(`${supabaseUrl}/rest/v1/whatsapp_connections`, {
      method: "POST",
      headers,
      body: JSON.stringify(connectionData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Erro ao criar conexão:", response.status, errorText)
      throw new Error(`Erro ao criar conexão: ${response.status}`)
    }

    const newConnection = await response.json()
    console.log("✅ Conexão criada com sucesso")

    return NextResponse.json({
      success: true,
      connection: newConnection[0],
    })
  } catch (error: any) {
    console.error("❌ Erro ao criar conexão:", error.message)
    return NextResponse.json(
      {
        error: "Erro ao criar conexão",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request) {
  console.log("📡 API: PUT /api/whatsapp-connections chamada")

  try {
    const { id, ...connectionData } = await request.json()
    console.log("📝 Atualizando conexão:", id)

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

    const response = await fetch(`${supabaseUrl}/rest/v1/whatsapp_connections?id=eq.${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(connectionData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Erro ao atualizar conexão:", response.status, errorText)
      throw new Error(`Erro ao atualizar conexão: ${response.status}`)
    }

    console.log("✅ Conexão atualizada com sucesso")

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error("❌ Erro ao atualizar conexão:", error.message)
    return NextResponse.json(
      {
        error: "Erro ao atualizar conexão",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request) {
  console.log("📡 API: DELETE /api/whatsapp-connections chamada")

  try {
    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get("id")

    if (!connectionId) {
      throw new Error("ID da conexão é obrigatório")
    }

    console.log("🗑️ Deletando conexão:", connectionId)

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

    const response = await fetch(`${supabaseUrl}/rest/v1/whatsapp_connections?id=eq.${connectionId}`, {
      method: "DELETE",
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Erro ao deletar conexão:", response.status, errorText)
      throw new Error(`Erro ao deletar conexão: ${response.status}`)
    }

    console.log("✅ Conexão deletada com sucesso")

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error("❌ Erro ao deletar conexão:", error.message)
    return NextResponse.json(
      {
        error: "Erro ao deletar conexão",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
