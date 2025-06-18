import { NextResponse } from "next/server"

export async function GET() {
  console.log("📡 API: /api/admin/agents chamada")

  try {
    // Usar fetch nativo para REST API do Supabase
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Variáveis de ambiente do Supabase não configuradas")
    }

    // Headers para Supabase REST API
    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    console.log("🔍 Buscando agentes...")
    // Buscar agentes com joins
    const agentsResponse = await fetch(
      `${supabaseUrl}/rest/v1/ai_agents?select=*,user_profiles!ai_agents_user_id_fkey(id,email,full_name),whatsapp_connections!ai_agents_whatsapp_connection_id_fkey(connection_name,status)&order=created_at.desc`,
      { headers },
    )

    if (!agentsResponse.ok) {
      const errorText = await agentsResponse.text()
      console.error("❌ Erro ao buscar agentes:", agentsResponse.status, errorText)
      throw new Error(`Erro ao buscar agentes: ${agentsResponse.status}`)
    }

    const agents = await agentsResponse.json()
    console.log("✅ Agentes encontrados:", agents.length)

    console.log("🔍 Buscando usuários...")
    // Buscar usuários
    const usersResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?select=id,email,full_name&order=full_name.asc`,
      { headers },
    )

    if (!usersResponse.ok) {
      const errorText = await usersResponse.text()
      console.error("❌ Erro ao buscar usuários:", usersResponse.status, errorText)
      throw new Error(`Erro ao buscar usuários: ${usersResponse.status}`)
    }

    const users = await usersResponse.json()
    console.log("✅ Usuários encontrados:", users.length)

    console.log("🔍 Buscando conexões WhatsApp...")
    // Buscar conexões WhatsApp
    const connectionsResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?select=*&order=connection_name.asc`,
      { headers },
    )

    if (!connectionsResponse.ok) {
      const errorText = await connectionsResponse.text()
      console.error("❌ Erro ao buscar conexões:", connectionsResponse.status, errorText)
      throw new Error(`Erro ao buscar conexões: ${connectionsResponse.status}`)
    }

    const connections = await connectionsResponse.json()
    console.log("✅ Conexões encontradas:", connections.length)

    // Filtrar dados sensíveis antes de retornar
    const safeAgents = agents.map((agent: any) => ({
      id: agent.id,
      name: agent.name,
      identity_description: agent.identity_description,
      main_function: agent.main_function,
      voice_tone: agent.voice_tone,
      temperature: agent.temperature,
      transcribe_audio: agent.transcribe_audio,
      understand_images: agent.understand_images,
      voice_response_enabled: agent.voice_response_enabled,
      calendar_integration: agent.calendar_integration,
      status: agent.status,
      is_default: agent.is_default,
      user_id: agent.user_id,
      whatsapp_connection_id: agent.whatsapp_connection_id,
      evolution_bot_id: agent.evolution_bot_id,
      model: agent.model,
      trigger_type: agent.trigger_type,
      trigger_value: agent.trigger_value,
      created_at: agent.created_at,
      updated_at: agent.updated_at,
      user_profiles: agent.user_profiles,
      whatsapp_connections: agent.whatsapp_connections,
    }))

    const safeUsers = users.map((user: any) => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
    }))

    const safeConnections = connections.map((conn: any) => ({
      id: conn.id,
      connection_name: conn.connection_name,
      instance_name: conn.instance_name,
      status: conn.status,
      user_id: conn.user_id,
      phone_number: conn.phone_number,
      created_at: conn.created_at,
    }))

    console.log("✅ Dados processados com sucesso")
    return NextResponse.json({
      success: true,
      agents: safeAgents,
      users: safeUsers,
      connections: safeConnections,
    })
  } catch (error: any) {
    console.error("❌ Erro na API admin/agents:", error.message)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  console.log("📡 API: POST /api/admin/agents chamada")

  try {
    const agentData = await request.json()
    console.log("📝 Dados do agente recebidos:", { name: agentData.name, user_id: agentData.user_id })

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

    // Criar agente
    const response = await fetch(`${supabaseUrl}/rest/v1/ai_agents`, {
      method: "POST",
      headers,
      body: JSON.stringify(agentData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Erro ao criar agente:", response.status, errorText)
      throw new Error(`Erro ao criar agente: ${response.status}`)
    }

    const newAgent = await response.json()
    console.log("✅ Agente criado com sucesso:", newAgent[0]?.id)

    return NextResponse.json({
      success: true,
      agent: newAgent[0],
    })
  } catch (error: any) {
    console.error("❌ Erro ao criar agente:", error.message)
    return NextResponse.json(
      {
        error: "Erro ao criar agente",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request) {
  console.log("📡 API: PUT /api/admin/agents chamada")

  try {
    const { id, ...agentData } = await request.json()
    console.log("📝 Atualizando agente:", id)

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

    // Atualizar agente
    const response = await fetch(`${supabaseUrl}/rest/v1/ai_agents?id=eq.${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(agentData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Erro ao atualizar agente:", response.status, errorText)
      throw new Error(`Erro ao atualizar agente: ${response.status}`)
    }

    console.log("✅ Agente atualizado com sucesso")

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error("❌ Erro ao atualizar agente:", error.message)
    return NextResponse.json(
      {
        error: "Erro ao atualizar agente",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request) {
  console.log("📡 API: DELETE /api/admin/agents chamada")

  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get("id")

    if (!agentId) {
      throw new Error("ID do agente é obrigatório")
    }

    console.log("🗑️ Deletando agente:", agentId)

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

    // Deletar agente
    const response = await fetch(`${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}`, {
      method: "DELETE",
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Erro ao deletar agente:", response.status, errorText)
      throw new Error(`Erro ao deletar agente: ${response.status}`)
    }

    console.log("✅ Agente deletado com sucesso")

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error("❌ Erro ao deletar agente:", error.message)
    return NextResponse.json(
      {
        error: "Erro ao deletar agente",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
