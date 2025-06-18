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
    // Buscar agentes com joins - INCLUINDO TODOS OS CAMPOS
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

    // Log detalhado do primeiro agente para debug
    if (agents.length > 0) {
      console.log("🔍 Primeiro agente (debug):", {
        id: agents[0].id,
        name: agents[0].name,
        identity_description: agents[0].identity_description,
        training_prompt: agents[0].training_prompt,
        voice_response_enabled: agents[0].voice_response_enabled,
        voice_provider: agents[0].voice_provider,
        voice_api_key: agents[0].voice_api_key ? "***PRESENTE***" : "AUSENTE",
        voice_id: agents[0].voice_id,
        calendar_integration: agents[0].calendar_integration,
        calendar_api_key: agents[0].calendar_api_key ? "***PRESENTE***" : "AUSENTE",
        calendar_meeting_id: agents[0].calendar_meeting_id,
      })
    }

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

    // RETORNAR TODOS OS CAMPOS DOS AGENTES - NÃO FILTRAR NADA SENSÍVEL AQUI
    const safeAgents = agents.map((agent: any) => ({
      // Campos básicos
      id: agent.id,
      name: agent.name,
      description: agent.description,
      identity_description: agent.identity_description,
      training_prompt: agent.training_prompt,
      voice_tone: agent.voice_tone,
      main_function: agent.main_function,
      model: agent.model,
      temperature: agent.temperature,

      // Campos booleanos
      transcribe_audio: agent.transcribe_audio,
      understand_images: agent.understand_images,
      voice_response_enabled: agent.voice_response_enabled,
      calendar_integration: agent.calendar_integration,
      chatnode_integration: agent.chatnode_integration,
      orimon_integration: agent.orimon_integration,
      is_default: agent.is_default,
      listening_from_me: agent.listening_from_me,
      stop_bot_from_me: agent.stop_bot_from_me,
      keep_open: agent.keep_open,
      split_messages: agent.split_messages,

      // Campos de API (incluir para edição)
      voice_provider: agent.voice_provider,
      voice_api_key: agent.voice_api_key,
      voice_id: agent.voice_id,
      calendar_api_key: agent.calendar_api_key,
      calendar_meeting_id: agent.calendar_meeting_id,
      chatnode_api_key: agent.chatnode_api_key,
      chatnode_bot_id: agent.chatnode_bot_id,
      orimon_api_key: agent.orimon_api_key,
      orimon_bot_id: agent.orimon_bot_id,

      // Campos de configuração
      trigger_type: agent.trigger_type,
      trigger_operator: agent.trigger_operator,
      trigger_value: agent.trigger_value,
      keyword_finish: agent.keyword_finish,
      debounce_time: agent.debounce_time,
      delay_message: agent.delay_message,
      unknown_message: agent.unknown_message,
      expire_time: agent.expire_time,
      ignore_jids: agent.ignore_jids,

      // Campos de relacionamento
      status: agent.status,
      user_id: agent.user_id,
      whatsapp_connection_id: agent.whatsapp_connection_id,
      evolution_bot_id: agent.evolution_bot_id,

      // Timestamps
      created_at: agent.created_at,
      updated_at: agent.updated_at,

      // Relacionamentos
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
