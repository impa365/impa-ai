import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { checkRateLimit, getRequestIdentifier, RATE_LIMITS } from "@/lib/rate-limit"
import { logAccessDenied, logRateLimitExceeded } from "@/lib/security-audit"

export async function GET(request: NextRequest) {
  console.log("📡 API: /api/user/agents chamada")

  try {
    // 🔒 SEGURANÇA: Autenticar usuário via JWT
    let currentUser
    try {
      currentUser = await requireAuth(request)
    } catch (authError) {
      console.error("❌ Não autorizado:", (authError as Error).message)
      logAccessDenied(undefined, undefined, '/api/user/agents', request, 'Token JWT inválido ou ausente')
      return NextResponse.json(
        { error: "Não autorizado - Usuário não autenticado" },
        { status: 401 }
      )
    }

    console.log("✅ Usuário autenticado:", currentUser.email, "| Role:", currentUser.role)

    // 🔒 RATE LIMITING
    const rateLimit = checkRateLimit(getRequestIdentifier(request, currentUser.id), RATE_LIMITS.READ)
    if (!rateLimit.allowed) {
      console.warn(`⚠️ [RATE-LIMIT] ${currentUser.email} bloqueado por ${rateLimit.retryAfter}s`)
      logRateLimitExceeded(currentUser.id, currentUser.email, '/api/user/agents', request)
      return NextResponse.json(
        { success: false, error: `Muitas requisições. Aguarde ${rateLimit.retryAfter}s` },
        { status: 429 }
      )
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
      `${supabaseUrl}/rest/v1/ai_agents?select=*,whatsapp_connections!ai_agents_whatsapp_connection_id_fkey(id,connection_name,phone_number,instance_name,status,api_type)&user_id=eq.${currentUser.id}&order=created_at.desc`,
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
          max_agents: user.role === "admin" ? 999 : user.agents_limit || 5,
          max_whatsapp_connections: user.role === "admin" ? 999 : user.connections_limit || 3,
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

export async function POST(request: NextRequest) {
  console.log("📡 API: POST /api/user/agents chamada")

  try {
    // 🔒 SEGURANÇA: Autenticar usuário via JWT
    let currentUser
    try {
      currentUser = await requireAuth(request)
    } catch (authError) {
      console.error("❌ Não autorizado:", (authError as Error).message)
      logAccessDenied(undefined, undefined, '/api/user/agents (POST)', request, 'Token JWT inválido ou ausente')
      return NextResponse.json(
        { error: "Não autorizado - Usuário não autenticado" },
        { status: 401 }
      )
    }

    console.log("✅ Usuário autenticado:", currentUser.email)

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
    const apiType = connection.api_type || "evolution"
    console.log(`✅ Conexão validada: ${connection.connection_name} (${apiType})`)

    // Preparar dados para inserção no banco - garantir segurança
    console.log("💾 Preparando dados do agente...")
    const ignoreJidsArray = Array.isArray(agentData.ignore_jids) ? agentData.ignore_jids : ["@g.us"]

    const calendarProvider = agentData.calendar_provider || "calcom"
    const calendarVersion =
      calendarProvider === "calcom"
        ? agentData.calendar_api_version || "v1"
        : agentData.calendar_api_version || null
    const calendarUrl =
      calendarProvider === "calcom"
        ? agentData.calendar_api_url ||
          (calendarVersion === "v2" ? "https://api.cal.com/v2" : "https://api.cal.com/v1")
        : agentData.calendar_api_url || null

    const secureAgentData = {
      name: agentData.name,
      identity_description: agentData.identity_description,
      training_prompt: agentData.training_prompt,
      voice_tone: agentData.voice_tone,
      main_function: agentData.main_function,
      temperature: Number(agentData.temperature) || 0.7,
      description: agentData.description,
      status: agentData.status || "active",
      is_default: Boolean(agentData.is_default), // Boolean, não string
      user_id: currentUser.id, // FORÇAR user_id para segurança
      whatsapp_connection_id: agentData.whatsapp_connection_id,
      model: agentData.model,
      model_config: agentData.model_config,
      llm_api_key: agentData.llm_api_key || null,
      // Campos Evolution API
      trigger_type: agentData.trigger_type || "keyword",
      trigger_operator: agentData.trigger_operator || "equals",
      trigger_value: agentData.trigger_value,
      keyword_finish: agentData.keyword_finish,
      debounce_time: Number(agentData.debounce_time) || 1000,
      listening_from_me: Boolean(agentData.listening_from_me), // Boolean, não string
      stop_bot_from_me: Boolean(agentData.stop_bot_from_me), // Boolean, não string
      keep_open: Boolean(agentData.keep_open), // Boolean, não string
      split_messages: Boolean(agentData.split_messages), // Boolean, não string
      unknown_message: agentData.unknown_message,
      delay_message: Number(agentData.delay_message) || 1000,
      expire_time: Number(agentData.expire_time) || 0,
      ignore_jids: ignoreJidsArray,
      // Funcionalidades opcionais
      transcribe_audio: Boolean(agentData.transcribe_audio), // Boolean, não string
      understand_images: Boolean(agentData.understand_images), // Boolean, não string
      voice_response_enabled: Boolean(agentData.voice_response_enabled), // Boolean, não string
      voice_provider: agentData.voice_provider,
      voice_api_key: agentData.voice_api_key,
      voice_id: agentData.voice_id,
      calendar_integration: Boolean(agentData.calendar_integration), // Boolean, não string
      calendar_provider: calendarProvider,
      calendar_api_version: calendarVersion,
      calendar_api_url: calendarUrl,
      calendar_api_key: agentData.calendar_api_key,
      calendar_meeting_id: agentData.calendar_meeting_id,
      chatnode_integration: Boolean(agentData.chatnode_integration), // Boolean, não string
      chatnode_api_key: agentData.chatnode_api_key,
      chatnode_bot_id: agentData.chatnode_bot_id,
      orimon_integration: Boolean(agentData.orimon_integration), // Boolean, não string
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
    console.log("📦 Payload sendo enviado ao Supabase:", JSON.stringify(formattedAgentData, null, 2))
    
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
      console.error("❌ Erro ao criar agente no banco:", createResponse.status)
      console.error("❌ Detalhes do erro:", errorText)
      console.error("❌ Payload enviado:", JSON.stringify(formattedAgentData, null, 2))
      throw new Error(`Erro ao criar agente no banco: ${createResponse.status} - ${errorText}`)
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

    // ============================================
    // CRIAR BOT - EVOLUTION OU UAZAPI
    // ============================================
    let evolutionBotId = null
    let createdBotId = null // Para rollback

    if (apiType === "uazapi") {
      // ==================== UAZAPI ====================
      console.log("🤖 [UAZAPI] Iniciando criação de bot customizado")
      
      try {
        // Buscar configuração do N8N Session
        console.log("🔍 [UAZAPI] Buscando configuração N8N Session...")
        const n8nSessionResponse = await fetch(
          `${supabaseUrl}/rest/v1/integrations?select=*&type=eq.n8n_session&is_active=eq.true`,
          { headers }
        )

        let n8nSessionUrl = null
        if (n8nSessionResponse.ok) {
          const n8nSessions = await n8nSessionResponse.json()
          if (n8nSessions && n8nSessions.length > 0) {
            const n8nSessionConfig =
              typeof n8nSessions[0].config === "string"
                ? JSON.parse(n8nSessions[0].config)
                : n8nSessions[0].config
            n8nSessionUrl = n8nSessionConfig.webhookUrl || n8nSessionConfig.webhook_url
          }
        }

        if (!n8nSessionUrl) {
          throw new Error("N8N Session não configurado. Configure em Integrações.")
        }

        console.log("✅ [UAZAPI] N8N Session encontrado")

        // Buscar API key ativa do ADMIN (não do usuário) para incluir no url_api
        console.log("🔍 [UAZAPI] Buscando API key ativa do ADMIN...")
        let userApiKey = null
        try {
          // Primeiro buscar o admin
          const adminResponse = await fetch(
            `${supabaseUrl}/rest/v1/user_profiles?select=id&role=eq.admin&limit=1`,
            { headers }
          )
          if (!adminResponse.ok) {
            throw new Error("Não foi possível buscar informações do admin")
          }
          const admins = await adminResponse.json()
          if (!admins || admins.length === 0) {
            throw new Error("Nenhum administrador encontrado no sistema")
          }
          const adminId = admins[0].id
          console.log("✅ [UAZAPI] Admin identificado:", adminId)

          // Agora buscar API key do admin
          const apiKeyResponse = await fetch(
            `${supabaseUrl}/rest/v1/user_api_keys?select=api_key&user_id=eq.${adminId}&is_active=eq.true&order=created_at.desc&limit=1`,
            { headers }
          )
          if (apiKeyResponse.ok) {
            const apiKeys = await apiKeyResponse.json()
            if (apiKeys && apiKeys.length > 0) {
              userApiKey = apiKeys[0].api_key
              console.log("✅ [UAZAPI] API key do admin encontrada")
            } else {
              console.warn("⚠️ [UAZAPI] Nenhuma API key ativa encontrada para o admin")
              throw new Error("O administrador precisa criar uma API key antes que agentes possam ser criados. Entre em contato com o administrador do sistema.")
            }
          }
        } catch (apiKeyError: any) {
          console.error("❌ [UAZAPI] Erro com API key do admin:", apiKeyError.message)
          throw apiKeyError
        }

        // ============================================
        // VALIDAÇÕES DE SEGURANÇA (BACKEND)
        // ============================================
        console.log("🔒 [UAZAPI] Validando dados do bot...")
        
        // Validar gatilho
        const validGatilhos = ["Palavra-chave", "Todos", "Avançado", "Nenhum"]
        if (!validGatilhos.includes(agentData.bot_gatilho)) {
          throw new Error(`Tipo de gatilho inválido: ${agentData.bot_gatilho}`)
        }

        // Validar operador
        const validOperadores = ["Contém", "Igual", "Começa Com", "Termina Com", "Regex"]
        if (!validOperadores.includes(agentData.bot_operador)) {
          throw new Error(`Operador de gatilho inválido: ${agentData.bot_operador}`)
        }

        // Validar palavra-chave quando gatilho é "Palavra-chave"
        if (agentData.bot_gatilho === "Palavra-chave") {
          if (!agentData.bot_value || agentData.bot_value.trim() === "") {
            throw new Error("A palavra-chave é obrigatória quando o tipo de gatilho é 'Palavra-chave'")
          }
        }

        // Validar debounce (deve ser número >= 0)
        const debounce = Number(agentData.bot_debounce)
        if (isNaN(debounce) || debounce < 0) {
          throw new Error("Debounce deve ser um número maior ou igual a 0")
        }

        // Validar splitMessage (deve ser número >= 1)
        const splitMessage = Number(agentData.bot_splitMessage)
        if (isNaN(splitMessage) || splitMessage < 1) {
          throw new Error("Split Message deve ser um número maior ou igual a 1")
        }

        console.log("✅ [UAZAPI] Validações passaram com sucesso")

        // ETAPA 1: Criar bot no banco
        console.log("📝 [UAZAPI] ETAPA 1/3: Criando bot no banco...")
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
        
        // Converter bot_ignoreJids de array para string com vírgulas
        let ignoreJidsString = "@g.us,"
        if (agentData.bot_ignoreJids) {
          if (Array.isArray(agentData.bot_ignoreJids)) {
            // Se for array, juntar com vírgulas e adicionar vírgula no final
            ignoreJidsString = agentData.bot_ignoreJids.join(",") + ","
          } else if (typeof agentData.bot_ignoreJids === "string") {
            // Se já for string, usar diretamente
            ignoreJidsString = agentData.bot_ignoreJids
          }
        }
        console.log("🔍 [UAZAPI] ignoreJids convertido:", ignoreJidsString)
        
        // Construir URL com agentId, panelUrl e apiKey
        let botUrlApi
        if (n8nWebhookUrl) {
          botUrlApi = `${n8nWebhookUrl}?agentId=${agentId}`
          if (userApiKey) {
            botUrlApi += `&panelUrl=${encodeURIComponent(baseUrl)}&apiKey=${encodeURIComponent(userApiKey)}`
          }
        } else {
          botUrlApi = `${baseUrl}/api/agents/webhook?agentId=${agentId}`
          if (userApiKey) {
            botUrlApi += `&panelUrl=${encodeURIComponent(baseUrl)}&apiKey=${encodeURIComponent(userApiKey)}`
          }
        }
        
        console.log("📌 [UAZAPI] URL API construída:", botUrlApi)
        
        const botPayload = {
          nome: agentData.name,
          url_api: botUrlApi,
          apikey: n8nIntegrations?.[0]?.api_key || null,
          gatilho: agentData.bot_gatilho || "Palavra-chave",
          operador_gatilho: agentData.bot_operador || "Contém",
          value_gatilho: agentData.bot_value || null,
          debounce: agentData.bot_debounce || 5,
          splitMessage: agentData.bot_splitMessage || 2,
          ignoreJids: ignoreJidsString,
          padrao: Boolean(agentData.bot_padrao) || false,
          user_id: currentUser.id,
          connection_id: agentData.whatsapp_connection_id,
        }

        const createBotResponse = await fetch(`${supabaseUrl}/rest/v1/bots`, {
          method: "POST",
          headers: { ...headers, Prefer: "return=representation" },
          body: JSON.stringify(botPayload),
        })

        if (!createBotResponse.ok) {
          const errorText = await createBotResponse.text()
          throw new Error(`Falha ao criar bot no banco: ${errorText}`)
        }

        const [createdBot] = await createBotResponse.json()
        createdBotId = createdBot.id
        console.log(`✅ [UAZAPI] Bot criado no banco: ${createdBotId}`)

        // ETAPA 2: Configurar webhook na Uazapi
        console.log("🌐 [UAZAPI] ETAPA 2/3: Configurando webhook na Uazapi...")
        
        const { createUazapiWebhook, shouldIgnoreGroups } = await import("@/lib/uazapi-webhook-helpers")
        const { getUazapiConfigServer } = await import("@/lib/uazapi-server")
        
        const uazapiConfig = await getUazapiConfigServer()
        if (!uazapiConfig) {
          throw new Error("Uazapi não configurada")
        }

        const webhookUrl = `${n8nSessionUrl}?botId=${createdBotId}`
        const ignoreGroups = shouldIgnoreGroups(botPayload.ignoreJids)

        const webhookResult = await createUazapiWebhook({
          uazapiServerUrl: uazapiConfig.serverUrl,
          instanceToken: connection.instance_token,
          webhookUrl,
          ignoreGroups,
        })

        if (!webhookResult.success) {
          throw new Error(`Falha ao criar webhook na Uazapi: ${webhookResult.error}`)
        }

        console.log(`✅ [UAZAPI] Webhook configurado: ${webhookResult.webhookId}`)

        // ETAPA 3: Salvar webhook_id no bot
        console.log("💾 [UAZAPI] ETAPA 3/3: Salvando webhook_id no bot...")
        const updateBotResponse = await fetch(
          `${supabaseUrl}/rest/v1/bots?id=eq.${createdBotId}`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({ webhook_id: webhookResult.webhookId }),
          }
        )

        if (!updateBotResponse.ok) {
          throw new Error("Falha ao salvar webhook_id no bot")
        }

        console.log("✅ [UAZAPI] webhook_id salvo no bot")

        // ETAPA 4: Vincular bot ao agente
        console.log("🔗 [UAZAPI] Vinculando bot ao agente...")
        console.log(`📝 [UAZAPI] Atualizando agente ${agentId} com bot_id: ${createdBotId}`)
        const updateAgentResponse = await fetch(
          `${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({ bot_id: createdBotId }),
          }
        )

        if (!updateAgentResponse.ok) {
          const errorText = await updateAgentResponse.text()
          console.error(`❌ [UAZAPI] Erro ao vincular bot - Status: ${updateAgentResponse.status}`)
          console.error(`❌ [UAZAPI] Erro detalhado:`, errorText)
          throw new Error(`Falha ao vincular bot ao agente: ${updateAgentResponse.status} - ${errorText}`)
        }

        console.log("✅ [UAZAPI] Bot vinculado ao agente com sucesso!")

      } catch (uazapiError: any) {
        console.error("❌ [UAZAPI] Erro:", uazapiError.message)

        // ==================== ROLLBACK ====================
        console.log("🔄 [UAZAPI] Iniciando ROLLBACK...")

        // Deletar agente do banco
        try {
          console.log(`🗑️ [UAZAPI ROLLBACK] Deletando agente: ${agentId}`)
          await fetch(`${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}`, {
            method: "DELETE",
            headers,
          })
          console.log("✅ [UAZAPI ROLLBACK] Agente deletado")
        } catch (e) {
          console.error("❌ [UAZAPI ROLLBACK] Falha ao deletar agente:", e)
        }

        // Deletar bot do banco (se foi criado)
        if (createdBotId) {
          try {
            console.log(`🗑️ [UAZAPI ROLLBACK] Deletando bot: ${createdBotId}`)
            
            // Buscar webhook_id do bot para deletar da Uazapi
            const getBotResponse = await fetch(
              `${supabaseUrl}/rest/v1/bots?id=eq.${createdBotId}&select=webhook_id`,
              { headers }
            )
            
            if (getBotResponse.ok) {
              const [bot] = await getBotResponse.json()
              
              if (bot?.webhook_id) {
                console.log(`🗑️ [UAZAPI ROLLBACK] Deletando webhook: ${bot.webhook_id}`)
                const { deleteUazapiWebhook } = await import("@/lib/uazapi-webhook-helpers")
                const { getUazapiConfigServer } = await import("@/lib/uazapi-server")
                const uazapiConfig = await getUazapiConfigServer()
                
                if (uazapiConfig) {
                  await deleteUazapiWebhook({
                    uazapiServerUrl: uazapiConfig.serverUrl,
                    instanceToken: connection.instance_token,
                    webhookId: bot.webhook_id,
                  })
                  console.log("✅ [UAZAPI ROLLBACK] Webhook deletado")
                }
              }
            }

            // Deletar bot do banco
            await fetch(`${supabaseUrl}/rest/v1/bots?id=eq.${createdBotId}`, {
              method: "DELETE",
              headers,
            })
            console.log("✅ [UAZAPI ROLLBACK] Bot deletado")
          } catch (e) {
            console.error("❌ [UAZAPI ROLLBACK] Falha ao deletar bot:", e)
          }
        }

        console.log("🔄 [UAZAPI ROLLBACK] Completo")
        throw new Error(`Falha ao criar agente Uazapi: ${uazapiError.message}`)
      }

    } else {
      // ==================== EVOLUTION API ====================
      if (connection.instance_name) {
        console.log("🤖 Criando bot na Evolution API com agentId:", agentId)
        try {
          const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
          const evolutionApiUrl = `${baseUrl}/api/integrations/evolution/evolutionBot/create/${connection.instance_name}`

          console.log("🔗 URL da Evolution API:", evolutionApiUrl)

          // Buscar API key ativa do ADMIN (não do usuário) para incluir no webhook
          console.log("🔍 Buscando API key ativa do ADMIN...")
          let userApiKey = null
          try {
            // Primeiro buscar o admin
            const adminResponse = await fetch(
              `${supabaseUrl}/rest/v1/user_profiles?select=id&role=eq.admin&limit=1`,
              { headers }
            )
            if (!adminResponse.ok) {
              throw new Error("Não foi possível buscar informações do admin")
            }
            const admins = await adminResponse.json()
            if (!admins || admins.length === 0) {
              throw new Error("Nenhum administrador encontrado no sistema")
            }
            const adminId = admins[0].id
            console.log("✅ Admin identificado:", adminId)

            // Agora buscar API key do admin
            const apiKeyResponse = await fetch(
              `${supabaseUrl}/rest/v1/user_api_keys?select=api_key&user_id=eq.${adminId}&is_active=eq.true&order=created_at.desc&limit=1`,
              { headers }
            )
            if (apiKeyResponse.ok) {
              const apiKeys = await apiKeyResponse.json()
              if (apiKeys && apiKeys.length > 0) {
                userApiKey = apiKeys[0].api_key
                console.log("✅ API key do admin encontrada")
              } else {
                console.warn("⚠️ Nenhuma API key ativa encontrada para o admin")
                throw new Error("É necessário criar uma API key antes de criar um agente. Vá para 'Configurações > API Keys' e crie uma chave de API ativa.")
              }
            }
          } catch (apiKeyError: any) {
            console.error("❌ Erro com API key do usuário:", apiKeyError.message)
            throw apiKeyError
          }

          // Construir URL do webhook com agentId, panelUrl e apiKey
          let webhookUrl
          if (n8nWebhookUrl) {
            webhookUrl = `${n8nWebhookUrl}?agentId=${agentId}`
            if (userApiKey) {
              webhookUrl += `&panelUrl=${encodeURIComponent(baseUrl)}&apiKey=${encodeURIComponent(userApiKey)}`
            }
          } else {
            webhookUrl = `${baseUrl}/api/agents/webhook?agentId=${agentId}`
            if (userApiKey) {
              webhookUrl += `&panelUrl=${encodeURIComponent(baseUrl)}&apiKey=${encodeURIComponent(userApiKey)}`
            }
          }

          console.log("📌 Webhook URL construída:", webhookUrl)

          // Preparar dados para Evolution API no formato correto
          const evolutionBotData = {
            enabled: true,
            description: agentData.name,
            apiUrl: webhookUrl,
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
