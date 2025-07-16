import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  console.log("📡 API: /api/user/agents chamada")

  try {
    // Buscar usuário atual do cookie (igual ao admin)
    const cookieStore = await cookies()
    const userCookie = cookieStore.get("impaai_user")

    if (!userCookie) {
      console.log("❌ Cookie de usuário não encontrado")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    let currentUser
    try {
      currentUser = JSON.parse(userCookie.value)
      console.log("✅ Usuário encontrado:", currentUser.email)
    } catch (error) {
      console.log("❌ Erro ao parsear cookie do usuário")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

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

    console.log("🔍 Buscando agentes do usuário:", currentUser.id)
    // FILTRAR NO BACKEND - apenas agentes do usuário atual
    const agentsResponse = await fetch(
      `${supabaseUrl}/rest/v1/ai_agents?select=*,whatsapp_connections!ai_agents_whatsapp_connection_id_fkey(id,connection_name,phone_number,instance_name,status)&user_id=eq.${currentUser.id}&order=created_at.desc`,
      { headers },
    )

    if (!agentsResponse.ok) {
      const errorText = await agentsResponse.text()
      console.error("❌ Erro ao buscar agentes:", agentsResponse.status, errorText)
      throw new Error(`Erro ao buscar agentes: ${agentsResponse.status}`)
    }

    const agents = await agentsResponse.json()
    console.log("✅ Agentes do usuário encontrados:", agents.length)

    console.log("🔍 Buscando conexões WhatsApp do usuário...")
    // FILTRAR NO BACKEND - apenas conexões do usuário atual
    const connectionsResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?select=*&user_id=eq.${currentUser.id}&order=connection_name.asc`,
      { headers },
    )

    if (!connectionsResponse.ok) {
      const errorText = await connectionsResponse.text()
      console.error("❌ Erro ao buscar conexões:", connectionsResponse.status, errorText)
      throw new Error(`Erro ao buscar conexões: ${connectionsResponse.status}`)
    }

    const connections = await connectionsResponse.json()
    console.log("✅ Conexões do usuário encontradas:", connections.length)

    // Buscar limites do usuário
    console.log("🔍 Buscando limites do usuário...")
    const userResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?select=agents_limit,connections_limit,role&id=eq.${currentUser.id}`,
      { headers },
    )

    let userLimits = { max_agents: 5, max_whatsapp_connections: 3 }
    if (userResponse.ok) {
      const userData = await userResponse.json()
      if (userData && userData.length > 0) {
        const user = userData[0]
        userLimits = {
                max_agents: user.role === "admin" ? 999 : user.agents_limit || 1,
      max_whatsapp_connections: user.role === "admin" ? 999 : user.connections_limit || 1,
        }
      }
    }

    console.log("🔍 Buscando configurações de provedores LLM...")
    // Buscar configurações de sistema para provedores LLM
    const settingsResponse = await fetch(
      `${supabaseUrl}/rest/v1/system_settings?select=setting_key,setting_value&setting_key=in.(available_llm_providers,default_model)`,
      { headers }
    )

    let llmConfig = {
      available_providers: ["openai", "anthropic", "google"],
      default_model: "gpt-4o-mini"
    }

    if (settingsResponse.ok) {
      const settings = await settingsResponse.json()
      settings.forEach((setting: any) => {
        if (setting.setting_key === 'available_llm_providers') {
          try {
            llmConfig.available_providers = JSON.parse(setting.setting_value)
          } catch (e) {
            console.warn("Erro ao parsear available_llm_providers, usando padrão")
          }
        }
        if (setting.setting_key === 'default_model') {
          llmConfig.default_model = setting.setting_value
        }
      })
    }
    console.log("✅ Configurações LLM carregadas:", llmConfig.available_providers.length, "provedores")

    console.log("✅ Dados processados com sucesso - APENAS DO USUÁRIO")
    return NextResponse.json({
      success: true,
      agents: agents || [],
      connections: connections || [],
      limits: userLimits,
      llm_config: llmConfig,
      // NÃO enviamos dados de outros usuários
    })
  } catch (error: any) {
    console.error("❌ Erro na API user/agents:", error.message)
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
  console.log("📡 API: POST /api/user/agents chamada")

  try {
    // Buscar usuário atual do cookie
    const cookieStore = await cookies()
    const userCookie = cookieStore.get("impaai_user")

    if (!userCookie) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    let currentUser
    try {
      currentUser = JSON.parse(userCookie.value)
    } catch (error) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const agentData = await request.json()
    console.log("📝 Dados do agente recebidos:", { name: agentData.name, user_id: currentUser.id })

    // Verificar configurações do Supabase
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

    // Validar se a conexão WhatsApp pertence ao usuário
    console.log("🔍 Validando conexão WhatsApp...")
    const connectionResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?select=*&id=eq.${agentData.whatsapp_connection_id}&user_id=eq.${currentUser.id}`,
      { headers }
    )

    if (!connectionResponse.ok) {
      throw new Error("Erro ao validar conexão WhatsApp")
    }

    const connections = await connectionResponse.json()
    if (!connections || connections.length === 0) {
      throw new Error("Conexão WhatsApp não encontrada ou não pertence ao usuário")
    }

    const connection = connections[0]
    console.log("✅ Conexão validada:", connection.connection_name)

    // Preparar dados para inserção no banco - garantir segurança
    console.log("💾 Preparando dados do agente...")
    const ignoreJidsArray = Array.isArray(agentData.ignore_jids) ? agentData.ignore_jids : ["@g.us"]

    const secureAgentData = {
      name: agentData.name,
      identity_description: agentData.identity_description,
      training_prompt: agentData.training_prompt,
      voice_tone: agentData.voice_tone,
      main_function: agentData.main_function,
      temperature: agentData.temperature,
      description: agentData.description,
      status: agentData.status || "active",
      is_default: String(Boolean(agentData.is_default)),
      user_id: currentUser.id, // FORÇAR user_id para segurança
      whatsapp_connection_id: agentData.whatsapp_connection_id,
      model: agentData.model,
      model_config: agentData.model_config,
      // Campos Evolution API
      trigger_type: agentData.trigger_type || "keyword",
      trigger_operator: agentData.trigger_operator || "equals",
      trigger_value: agentData.trigger_value,
      keyword_finish: agentData.keyword_finish,
      debounce_time: agentData.debounce_time || 1000,
      listening_from_me: String(Boolean(agentData.listening_from_me)),
      stop_bot_from_me: String(Boolean(agentData.stop_bot_from_me)),
      keep_open: String(Boolean(agentData.keep_open)),
      split_messages: String(Boolean(agentData.split_messages)),
      unknown_message: agentData.unknown_message,
      delay_message: agentData.delay_message || 1000,
      expire_time: agentData.expire_time || 600000,
      ignore_jids: ignoreJidsArray,
      // Funcionalidades opcionais
      transcribe_audio: String(Boolean(agentData.transcribe_audio)),
      understand_images: String(Boolean(agentData.understand_images)),
      voice_response_enabled: String(Boolean(agentData.voice_response_enabled)),
      voice_provider: agentData.voice_provider,
      voice_api_key: agentData.voice_api_key,
      voice_id: agentData.voice_id,
      calendar_integration: String(Boolean(agentData.calendar_integration)),
      calendar_api_key: agentData.calendar_api_key,
      calendar_meeting_id: agentData.calendar_meeting_id,
      chatnode_integration: String(Boolean(agentData.chatnode_integration)),
      chatnode_api_key: agentData.chatnode_api_key,
      chatnode_bot_id: agentData.chatnode_bot_id,
      orimon_integration: String(Boolean(agentData.orimon_integration)),
      orimon_api_key: agentData.orimon_api_key,
      orimon_bot_id: agentData.orimon_bot_id,
    }

    // Ajustar o formato ignore_jids para PostgreSQL
    const formattedAgentData = {
      ...secureAgentData,
      ignore_jids: `{${ignoreJidsArray.map((jid: string) => `"${jid}"`).join(",")}}`,
    }

    // Criar agente no banco de dados
    console.log("💾 Criando agente no banco de dados...")
    const createResponse = await fetch(`${supabaseUrl}/rest/v1/ai_agents`, {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "return=representation",
      },
      body: JSON.stringify(formattedAgentData),
    })

    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      console.error("❌ Erro ao criar agente no banco:", createResponse.status, errorText)
      throw new Error(`Erro ao criar agente no banco: ${createResponse.status}`)
    }

    const [newAgent] = await createResponse.json()
    const agentId = newAgent.id
    console.log("✅ Agente criado no banco com ID:", agentId)

    // Buscar configuração do N8N para incluir no webhook
    console.log("🔍 Buscando configuração do N8N...")
    let n8nWebhookUrl = null
    let n8nIntegrations = null
    try {
      const n8nResponse = await fetch(
        `${supabaseUrl}/rest/v1/integrations?select=*&type=eq.n8n&is_active=eq.true`,
        { headers }
      )

      if (n8nResponse.ok) {
        n8nIntegrations = await n8nResponse.json()
        if (n8nIntegrations && n8nIntegrations.length > 0) {
          const n8nConfig =
            typeof n8nIntegrations[0].config === "string"
              ? JSON.parse(n8nIntegrations[0].config)
              : n8nIntegrations[0].config
          n8nWebhookUrl = n8nConfig.flowUrl
          console.log("✅ N8N webhook encontrado")
        }
      }
    } catch (n8nError) {
      console.log("⚠️ N8N não configurado, continuando sem webhook N8N")
    }

    // Criar bot na Evolution API usando o ID real do agente
    let evolutionBotId = null
    if (connection.instance_name) {
      console.log("🤖 Criando bot na Evolution API com agentId:", agentId)
      try {
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
        const evolutionApiUrl = `${baseUrl}/api/integrations/evolution/evolutionBot/create/${connection.instance_name}`

        console.log("🔗 URL da Evolution API:", evolutionApiUrl)

        // Preparar dados para Evolution API no formato correto
        const evolutionBotData = {
          enabled: true,
          description: agentData.name,
          // Usar o ID real do agente no webhook
          apiUrl: n8nWebhookUrl
            ? `${n8nWebhookUrl}?agentId=${agentId}`
            : `${baseUrl}/api/agents/webhook?agentId=${agentId}`,
          apiKey:
            n8nWebhookUrl && n8nIntegrations?.[0]?.api_key
              ? n8nIntegrations[0].api_key
              : undefined,
          triggerType: agentData.trigger_type || "keyword",
          triggerOperator: agentData.trigger_operator || "equals",
          triggerValue: agentData.trigger_value || "",
          expire: agentData.expire_time || 0,
          keywordFinish: agentData.keyword_finish || "#sair",
          delayMessage: agentData.delay_message || 1000,
          unknownMessage:
            agentData.unknown_message || "Desculpe, não entendi sua mensagem.",
          listeningFromMe: Boolean(agentData.listening_from_me),
          stopBotFromMe: Boolean(agentData.stop_bot_from_me),
          keepOpen: Boolean(agentData.keep_open),
          debounceTime: agentData.debounce_time || 10,
          ignoreJids: Array.isArray(agentData.ignore_jids)
            ? agentData.ignore_jids
            : ["@g.us"],
          splitMessages: Boolean(agentData.split_messages),
          timePerChar: agentData.time_per_char || 100,
        }

        console.log("📤 Enviando dados para Evolution API:", evolutionBotData)
        console.log("Instance token:", connection.instance_token)

        const createBotResponse = await fetch(evolutionApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: connection.instance_token,
          },
          body: JSON.stringify(evolutionBotData),
        })

        console.log("📥 Resposta da Evolution API:", createBotResponse.status)

        if (createBotResponse.ok) {
          const botResult = await createBotResponse.json()
          evolutionBotId = botResult.id
          console.log("✅ Bot criado na Evolution API:", evolutionBotId)

          // Atualizar agente no banco com o evolution_bot_id
          console.log("🔄 Atualizando agente com evolution_bot_id...")
          const updateResponse = await fetch(
            `${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}`,
            {
              method: "PATCH",
              headers,
              body: JSON.stringify({ evolution_bot_id: evolutionBotId }),
            }
          )

          if (!updateResponse.ok) {
            console.warn("⚠️ Erro ao atualizar evolution_bot_id, mas agente foi criado")
          } else {
            console.log("✅ evolution_bot_id atualizado no banco")
          }
        } else {
          const errorText = await createBotResponse.text()
          console.warn(
            "⚠️ Falha ao criar bot na Evolution API:",
            createBotResponse.status,
            errorText
          )
          // Continuar sem o bot da Evolution API
        }
      } catch (evolutionError) {
        console.warn("⚠️ Erro ao criar bot na Evolution API:", evolutionError)
        // Continuar sem o bot da Evolution API
      }
    }

    console.log("✅ Processo completo - Agente criado com sucesso:", agentId)

    return NextResponse.json({
      success: true,
      agent: { ...newAgent, evolution_bot_id: evolutionBotId },
      evolutionBotId: evolutionBotId,
      message: "Agente criado com sucesso",
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
