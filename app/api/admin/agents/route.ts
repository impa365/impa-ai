import { NextResponse } from "next/server";

export async function GET() {
  console.log("📡 API: /api/admin/agents chamada");

  try {
    // Usar as variáveis que já existem no projeto
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Variáveis de ambiente não encontradas:", {
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey,
      });
      throw new Error("Variáveis de ambiente do Supabase não configuradas");
    }

    // Headers para Supabase REST API
    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    };

    console.log("🔍 Buscando agentes...");
    // Buscar agentes com joins - incluindo model_config para provedor LLM
    const agentsResponse = await fetch(
      `${supabaseUrl}/rest/v1/ai_agents?select=*,user_profiles!ai_agents_user_id_fkey(id,email,full_name),whatsapp_connections!ai_agents_whatsapp_connection_id_fkey(connection_name,status,api_type)&order=created_at.desc`,
      { headers }
    );

    if (!agentsResponse.ok) {
      const errorText = await agentsResponse.text();
      console.error(
        "❌ Erro ao buscar agentes:",
        agentsResponse.status,
        errorText
      );
      throw new Error(`Erro ao buscar agentes: ${agentsResponse.status}`);
    }

    const agents = await agentsResponse.json();
    console.log("✅ Agentes encontrados:", agents.length);

    console.log("🔍 Buscando usuários...");
    // Buscar usuários
    const usersResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?select=id,email,full_name&order=full_name.asc`,
      { headers }
    );

    if (!usersResponse.ok) {
      const errorText = await usersResponse.text();
      console.error(
        "❌ Erro ao buscar usuários:",
        usersResponse.status,
        errorText
      );
      throw new Error(`Erro ao buscar usuários: ${usersResponse.status}`);
    }

    const users = await usersResponse.json();
    console.log("✅ Usuários encontrados:", users.length);

    console.log("🔍 Buscando conexões WhatsApp...");
    // Buscar conexões WhatsApp
    const connectionsResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?select=*&order=connection_name.asc`,
      { headers }
    );

    if (!connectionsResponse.ok) {
      const errorText = await connectionsResponse.text();
      console.error(
        "❌ Erro ao buscar conexões:",
        connectionsResponse.status,
        errorText
      );
      throw new Error(`Erro ao buscar conexões: ${connectionsResponse.status}`);
    }

    const connections = await connectionsResponse.json();
    console.log("✅ Conexões encontradas:", connections.length);

    console.log("🔍 Buscando configurações de provedores LLM...");
    // Buscar configurações de sistema para provedores LLM
    const settingsResponse = await fetch(
      `${supabaseUrl}/rest/v1/system_settings?select=setting_key,setting_value&setting_key=in.(available_llm_providers,default_model)`,
      { headers }
    );

    let llmConfig = {
      available_providers: ["openai", "anthropic", "google"],
      default_model: "gpt-4o-mini"
    };

    if (settingsResponse.ok) {
      const settings = await settingsResponse.json();
      settings.forEach((setting: any) => {
        if (setting.setting_key === 'available_llm_providers') {
          try {
            llmConfig.available_providers = JSON.parse(setting.setting_value);
          } catch (e) {
            console.warn("Erro ao parsear available_llm_providers, usando padrão");
          }
        }
        if (setting.setting_key === 'default_model') {
          llmConfig.default_model = setting.setting_value;
        }
      });
    }
    console.log("✅ Configurações LLM carregadas:", llmConfig.available_providers.length, "provedores");

    console.log("✅ Dados processados com sucesso");
    return NextResponse.json({
      success: true,
      agents: agents || [],
      users: users || [],
      connections: connections || [],
      llm_config: llmConfig,
    });
  } catch (error: any) {
    console.error("❌ Erro na API admin/agents:", error.message);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  console.log("📡 API: POST /api/admin/agents chamada");

  try {
    const agentData = await request.json();
    console.log("📝 Dados do agente recebidos:", {
      name: agentData.name,
      user_id: agentData.user_id,
    });

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Variáveis de ambiente do Supabase não configuradas");
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    };

    // Primeiro, buscar a conexão WhatsApp para obter o instance_name
    console.log("🔍 Buscando dados da conexão WhatsApp...");
    const connectionResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?select=*&id=eq.${agentData.whatsapp_connection_id}`,
      { headers }
    );

    if (!connectionResponse.ok) {
      throw new Error("Erro ao buscar conexão WhatsApp");
    }

    const connections = await connectionResponse.json();
    if (!connections || connections.length === 0) {
      throw new Error("Conexão WhatsApp não encontrada");
    }

    const connection = connections[0];
    console.log("✅ Conexão encontrada:", connection.connection_name);

    // PRIMEIRO: Criar agente no banco para obter o ID real
    console.log("💾 Criando agente no banco de dados primeiro...");

    // Preparar dados para inserção no banco - APENAS campos que existem em ai_agents
    const ignoreJidsArray = Array.isArray(agentData.ignore_jids)
      ? agentData.ignore_jids
      : ["@g.us"];

    const calendarProvider = agentData.calendar_provider || "calcom";
    const calendarVersion =
      calendarProvider === "calcom"
        ? agentData.calendar_api_version || "v1"
        : agentData.calendar_api_version || null;
    const calendarUrl =
      calendarProvider === "calcom"
        ? agentData.calendar_api_url ||
          (calendarVersion === "v2" ? "https://api.cal.com/v2" : "https://api.cal.com/v1")
        : agentData.calendar_api_url || null;

    // ============================================
    // IMPORTANTE: Incluir APENAS campos da tabela ai_agents
    // NÃO incluir campos bot_* que são para a tabela bots
    // ============================================
    const dbAgentData = {
      // Campos básicos
      name: agentData.name,
      description: agentData.description,
      user_id: agentData.user_id,
      whatsapp_connection_id: agentData.whatsapp_connection_id,
      
      // Configurações da IA
      identity_description: agentData.identity_description,
      training_prompt: agentData.training_prompt,
      voice_tone: agentData.voice_tone,
      main_function: agentData.main_function,
      model: agentData.model,
      model_config: agentData.model_config,
      llm_api_key: agentData.llm_api_key || null,
      temperature: Number(agentData.temperature) || 0.7,
      
      // Status
      status: agentData.status || "active",
      is_default: Boolean(agentData.is_default),
      
      // Evolution API fields
      evolution_bot_id: null, // Será preenchido depois
      trigger_type: agentData.trigger_type || "keyword",
      trigger_operator: agentData.trigger_operator || "equals",
      trigger_value: agentData.trigger_value,
      keyword_finish: agentData.keyword_finish,
      debounce_time: Number(agentData.debounce_time) || 10,
      listening_from_me: Boolean(agentData.listening_from_me),
      stop_bot_from_me: Boolean(agentData.stop_bot_from_me),
      keep_open: Boolean(agentData.keep_open),
      split_messages: Boolean(agentData.split_messages),
      delay_message: Number(agentData.delay_message) || 1000,
      unknown_message: agentData.unknown_message,
      expire_time: Number(agentData.expire_time) || 0,
      ignore_jids: `{${ignoreJidsArray.map((jid) => `"${jid}"`).join(",")}}`,
      
      // Funcionalidades extras
      transcribe_audio: Boolean(agentData.transcribe_audio),
      understand_images: Boolean(agentData.understand_images),
      voice_response_enabled: Boolean(agentData.voice_response_enabled),
      voice_provider: agentData.voice_provider,
      voice_api_key: agentData.voice_api_key,
      voice_id: agentData.voice_id,
      calendar_integration: Boolean(agentData.calendar_integration),
      calendar_provider: calendarProvider,
      calendar_api_version: calendarVersion,
      calendar_api_url: calendarUrl,
      calendar_api_key: agentData.calendar_api_key,
      calendar_meeting_id: agentData.calendar_meeting_id,
      chatnode_integration: Boolean(agentData.chatnode_integration),
      chatnode_api_key: agentData.chatnode_api_key,
      chatnode_bot_id: agentData.chatnode_bot_id,
      orimon_integration: Boolean(agentData.orimon_integration),
      orimon_api_key: agentData.orimon_api_key,
      orimon_bot_id: agentData.orimon_bot_id,
      
      // NÃO incluir bot_* campos aqui! Eles são para a tabela bots
    };

    const createAgentResponse = await fetch(
      `${supabaseUrl}/rest/v1/ai_agents`,
      {
        method: "POST",
        headers: {
          ...headers,
          Prefer: "return=representation",
        },
        body: JSON.stringify(dbAgentData),
      }
    );

    if (!createAgentResponse.ok) {
      const errorText = await createAgentResponse.text();
      console.error(
        "❌ Erro ao criar agente no banco:",
        createAgentResponse.status,
        errorText
      );
      throw new Error(
        `Erro ao criar agente no banco: ${createAgentResponse.status}`
      );
    }

    const newAgentArray = await createAgentResponse.json();
    const newAgent = newAgentArray[0];
    const agentId = newAgent.id;

    console.log("✅ Agente criado no banco com ID:", agentId);

    // SEGUNDO: Buscar configuração do N8N para incluir no webhook
    console.log("🔍 Buscando configuração do N8N...");
    let n8nWebhookUrl = null;
    let n8nIntegrations = null;
    try {
      const n8nResponse = await fetch(
        `${supabaseUrl}/rest/v1/integrations?select=*&type=eq.n8n&is_active=eq.true`,
        {
          headers,
        }
      );

      if (n8nResponse.ok) {
        n8nIntegrations = await n8nResponse.json();
        if (n8nIntegrations && n8nIntegrations.length > 0) {
          const n8nConfig =
            typeof n8nIntegrations[0].config === "string"
              ? JSON.parse(n8nIntegrations[0].config)
              : n8nIntegrations[0].config;
          n8nWebhookUrl = n8nConfig.flowUrl;
          console.log("✅ N8N webhook encontrado");
        }
      }
    } catch (n8nError) {
      console.log("⚠️ N8N não configurado, continuando sem webhook N8N");
    }

    // ============================================
    // DETECTAR API TYPE E CRIAR BOT APROPRIADO
    // ============================================
    const apiType = connection.api_type || "evolution";
    console.log(`✅ Conexão validada: ${connection.connection_name} (${apiType})`);

    let evolutionBotId = null;
    let createdBotId = null;

    if (apiType === "uazapi") {
      // ==================== UAZAPI ====================
      console.log("🤖 [UAZAPI] Iniciando criação de bot customizado");

      try {
        // Buscar configuração do N8N Session
        console.log("🔍 [UAZAPI] Buscando configuração N8N Session...");
        const n8nSessionResponse = await fetch(
          `${supabaseUrl}/rest/v1/integrations?select=*&type=eq.n8n_session&is_active=eq.true`,
          { headers }
        );

        let n8nSessionUrl = null;
        if (n8nSessionResponse.ok) {
          const n8nSessions = await n8nSessionResponse.json();
          if (n8nSessions && n8nSessions.length > 0) {
            const n8nSessionConfig =
              typeof n8nSessions[0].config === "string"
                ? JSON.parse(n8nSessions[0].config)
                : n8nSessions[0].config;
            n8nSessionUrl = n8nSessionConfig.webhookUrl || n8nSessionConfig.webhook_url;
          }
        }

        if (!n8nSessionUrl) {
          throw new Error("N8N Session não configurado. Configure em Integrações.");
        }

        console.log("✅ [UAZAPI] N8N Session encontrado");

        // Buscar API key ativa do usuário que está criando o agente
        console.log("🔍 [UAZAPI] Buscando API key ativa do usuário:", agentData.user_id);
        let userApiKey = null;
        try {
          // Buscar API key do usuário diretamente
          const apiKeyUrl = `${supabaseUrl}/rest/v1/user_api_keys?select=api_key&user_id=eq.${agentData.user_id}&is_active=eq.true&order=created_at.desc&limit=1`;
          console.log("📊 [DEBUG] API Key URL:", apiKeyUrl);
          const apiKeyResponse = await fetch(apiKeyUrl, { headers });
          console.log("📊 [DEBUG] API Key response status:", apiKeyResponse.status);
          if (apiKeyResponse.ok) {
            const apiKeys = await apiKeyResponse.json();
            console.log("📊 [DEBUG] API Keys encontradas:", JSON.stringify(apiKeys));
            if (apiKeys && apiKeys.length > 0) {
              userApiKey = apiKeys[0].api_key;
              console.log("✅ [UAZAPI] API key do usuário encontrada");
            } else {
              console.warn("⚠️ [UAZAPI] Nenhuma API key ativa encontrada");
              throw new Error("Você precisa criar uma API key antes de criar agentes. Vá para 'Gerenciar API Keys' e crie uma chave de API ativa.");
            }
          } else {
            const errorText = await apiKeyResponse.text();
            console.error("❌ [DEBUG] API Key response error:", errorText);
            throw new Error("Erro ao buscar API key");
          }
        } catch (apiKeyError: any) {
          console.error("❌ [UAZAPI] Erro com API key:", apiKeyError.message);
          throw apiKeyError;
        }

        // VALIDAÇÕES DE SEGURANÇA (BACKEND)
        console.log("🔒 [UAZAPI] Validando dados do bot...");
        
        const validGatilhos = ["Palavra-chave", "Todos", "Avançado", "Nenhum"];
        if (!validGatilhos.includes(agentData.bot_gatilho)) {
          throw new Error(`Tipo de gatilho inválido: ${agentData.bot_gatilho}`);
        }

        const validOperadores = ["Contém", "Igual", "Começa Com", "Termina Com", "Regex"];
        if (!validOperadores.includes(agentData.bot_operador)) {
          throw new Error(`Operador de gatilho inválido: ${agentData.bot_operador}`);
        }

        if (agentData.bot_gatilho === "Palavra-chave") {
          if (!agentData.bot_value || agentData.bot_value.trim() === "") {
            throw new Error("A palavra-chave é obrigatória quando o tipo de gatilho é 'Palavra-chave'");
          }
        }

        console.log("✅ [UAZAPI] Validações passaram com sucesso");

        // ETAPA 1: Criar bot no banco
        console.log("📝 [UAZAPI] ETAPA 1/3: Criando bot no banco...");
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        
        // Converter bot_ignoreJids de array para string com vírgulas
        let ignoreJidsString = "@g.us,";
        if (agentData.bot_ignoreJids) {
          if (Array.isArray(agentData.bot_ignoreJids)) {
            ignoreJidsString = agentData.bot_ignoreJids.join(",") + ",";
          } else if (typeof agentData.bot_ignoreJids === "string") {
            ignoreJidsString = agentData.bot_ignoreJids;
          }
        }
        console.log("🔍 [UAZAPI] ignoreJids convertido:", ignoreJidsString);
        
        // Construir URL com agentId, panelUrl e apiKey
        let botUrlApi;
        if (n8nWebhookUrl) {
          botUrlApi = `${n8nWebhookUrl}?agentId=${agentId}`;
          if (userApiKey) {
            botUrlApi += `&panelUrl=${encodeURIComponent(baseUrl)}&apiKey=${encodeURIComponent(userApiKey)}`;
          }
        } else {
          botUrlApi = `${baseUrl}/api/agents/webhook?agentId=${agentId}`;
          if (userApiKey) {
            botUrlApi += `&panelUrl=${encodeURIComponent(baseUrl)}&apiKey=${encodeURIComponent(userApiKey)}`;
          }
        }
        
        console.log("📌 [UAZAPI] URL API construída:", botUrlApi);
        
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
          user_id: agentData.user_id,
          connection_id: agentData.whatsapp_connection_id,
        };

        const createBotResponse = await fetch(`${supabaseUrl}/rest/v1/bots`, {
          method: "POST",
          headers: { ...headers, Prefer: "return=representation", "Content-Profile": "impaai", "Accept-Profile": "impaai" },
          body: JSON.stringify(botPayload),
        });

        if (!createBotResponse.ok) {
          const errorText = await createBotResponse.text();
          throw new Error(`Falha ao criar bot no banco: ${errorText}`);
        }

        const [createdBot] = await createBotResponse.json();
        createdBotId = createdBot.id;
        console.log(`✅ [UAZAPI] Bot criado no banco: ${createdBotId}`);

        // ETAPA 2: Configurar webhook na Uazapi
        console.log("🌐 [UAZAPI] ETAPA 2/3: Configurando webhook na Uazapi...");

        const { createUazapiWebhook, shouldIgnoreGroups } = await import("@/lib/uazapi-webhook-helpers");
        const { getUazapiConfigServer } = await import("@/lib/uazapi-server");

        const uazapiConfig = await getUazapiConfigServer();
        if (!uazapiConfig) {
          throw new Error("Uazapi não configurada");
        }

        const webhookUrl = `${n8nSessionUrl}?botId=${createdBotId}`;
        const ignoreGroups = shouldIgnoreGroups(botPayload.ignoreJids);

        const webhookResult = await createUazapiWebhook({
          uazapiServerUrl: uazapiConfig.serverUrl,
          instanceToken: connection.instance_token,
          webhookUrl,
          ignoreGroups,
        });

        if (!webhookResult.success) {
          throw new Error(`Falha ao criar webhook na Uazapi: ${webhookResult.error}`);
        }

        console.log(`✅ [UAZAPI] Webhook configurado: ${webhookResult.webhookId}`);

        // ETAPA 3: Salvar webhook_id no bot
        console.log("💾 [UAZAPI] ETAPA 3/3: Salvando webhook_id no bot...");
        const updateBotResponse = await fetch(
          `${supabaseUrl}/rest/v1/bots?id=eq.${createdBotId}`,
          {
            method: "PATCH",
            headers: { ...headers, "Content-Profile": "impaai", "Accept-Profile": "impaai" },
            body: JSON.stringify({ webhook_id: webhookResult.webhookId }),
          }
        );

        if (!updateBotResponse.ok) {
          throw new Error("Falha ao salvar webhook_id no bot");
        }

        console.log("✅ [UAZAPI] webhook_id salvo no bot");

        // ETAPA 4: Vincular bot ao agente
        console.log("🔗 [UAZAPI] Vinculando bot ao agente...");
        console.log(`📝 [UAZAPI] Atualizando agente ${agentId} com bot_id: ${createdBotId}`);
        const updateAgentResponse = await fetch(
          `${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}`,
          {
            method: "PATCH",
            headers: { ...headers, "Content-Profile": "impaai", "Accept-Profile": "impaai" },
            body: JSON.stringify({ bot_id: createdBotId }),
          }
        );

        if (!updateAgentResponse.ok) {
          const errorText = await updateAgentResponse.text();
          console.error(`❌ [UAZAPI] Erro ao vincular bot - Status: ${updateAgentResponse.status}`);
          console.error(`❌ [UAZAPI] Erro detalhado:`, errorText);
          throw new Error(`Falha ao vincular bot ao agente: ${updateAgentResponse.status} - ${errorText}`);
        }

        console.log("✅ [UAZAPI] Bot vinculado ao agente com sucesso!");

      } catch (uazapiError: any) {
        console.error("❌ [UAZAPI] Erro:", uazapiError.message);

        // ROLLBACK
        console.log("🔄 [UAZAPI] Iniciando ROLLBACK...");

        try {
          console.log(`🗑️ [UAZAPI ROLLBACK] Deletando agente: ${agentId}`);
          await fetch(`${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}`, {
            method: "DELETE",
            headers: { ...headers, "Content-Profile": "impaai", "Accept-Profile": "impaai" },
          });
          console.log("✅ [UAZAPI ROLLBACK] Agente deletado");
        } catch (e) {
          console.error("❌ [UAZAPI ROLLBACK] Falha ao deletar agente:", e);
        }

        if (createdBotId) {
          try {
            console.log(`🗑️ [UAZAPI ROLLBACK] Deletando bot: ${createdBotId}`);

            const getBotResponse = await fetch(
              `${supabaseUrl}/rest/v1/bots?id=eq.${createdBotId}&select=webhook_id`,
              { headers: { ...headers, "Content-Profile": "impaai", "Accept-Profile": "impaai" } }
            );

            if (getBotResponse.ok) {
              const [bot] = await getBotResponse.json();

              if (bot?.webhook_id) {
                console.log(`🗑️ [UAZAPI ROLLBACK] Deletando webhook: ${bot.webhook_id}`);
                const { deleteUazapiWebhook } = await import("@/lib/uazapi-webhook-helpers");
                const { getUazapiConfigServer } = await import("@/lib/uazapi-server");
                const uazapiConfig = await getUazapiConfigServer();

                if (uazapiConfig) {
                  await deleteUazapiWebhook({
                    uazapiServerUrl: uazapiConfig.serverUrl,
                    instanceToken: connection.instance_token,
                    webhookId: bot.webhook_id,
                  });
                  console.log("✅ [UAZAPI ROLLBACK] Webhook deletado");
                }
              }
            }

            await fetch(`${supabaseUrl}/rest/v1/bots?id=eq.${createdBotId}`, {
              method: "DELETE",
              headers: { ...headers, "Content-Profile": "impaai", "Accept-Profile": "impaai" },
            });
            console.log("✅ [UAZAPI ROLLBACK] Bot deletado");
          } catch (e) {
            console.error("❌ [UAZAPI ROLLBACK] Falha ao deletar bot:", e);
          }
        }

        console.log("🔄 [UAZAPI ROLLBACK] Completo");
        throw new Error(`Falha ao criar agente Uazapi: ${uazapiError.message}`);
      }

    } else {
      // ==================== EVOLUTION API ====================
      // TERCEIRO: Criar bot na Evolution API usando o ID real do agente
      if (connection.instance_name) {
      console.log("🤖 Criando bot na Evolution API com agentId:", agentId);
      try {
        // PROBLEMA IDENTIFICADO: Usar URL absoluta ao invés de relativa no Docker
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const evolutionApiUrl = `${baseUrl}/api/integrations/evolution/evolutionBot/create/${connection.instance_name}`;

        console.log("🔗 URL da Evolution API:", evolutionApiUrl);

        // Buscar API key ativa do ADMIN para incluir no webhook
        console.log("🔍 Buscando API key ativa do ADMIN...");
        let userApiKey = null;
        try {
          // Primeiro buscar o admin
          const adminResponse = await fetch(
            `${supabaseUrl}/rest/v1/user_profiles?select=id&role=eq.admin&limit=1`,
            { headers }
          );
          if (!adminResponse.ok) {
            throw new Error("Não foi possível buscar informações do admin");
          }
          const admins = await adminResponse.json();
          if (!admins || admins.length === 0) {
            throw new Error("Nenhum administrador encontrado no sistema");
          }
          const adminId = admins[0].id;
          console.log("✅ Admin identificado:", adminId);

          // Agora buscar API key do admin
          const apiKeyResponse = await fetch(
            `${supabaseUrl}/rest/v1/user_api_keys?select=api_key&user_id=eq.${adminId}&is_active=eq.true&order=created_at.desc&limit=1`,
            { headers }
          );
          if (apiKeyResponse.ok) {
            const apiKeys = await apiKeyResponse.json();
            if (apiKeys && apiKeys.length > 0) {
              userApiKey = apiKeys[0].api_key;
              console.log("✅ API key do admin encontrada");
            } else {
              console.warn("⚠️ Nenhuma API key ativa encontrada para o admin");
              throw new Error("O administrador precisa criar uma API key antes que agentes possam ser criados. Vá para 'Gerenciar API Keys' e crie uma chave de API ativa.");
            }
          }
        } catch (apiKeyError: any) {
          console.error("❌ Erro com API key do usuário:", apiKeyError.message);
          throw apiKeyError;
        }

        // Construir URL do webhook com agentId, panelUrl e apiKey
        let webhookUrl;
        if (n8nWebhookUrl) {
          webhookUrl = `${n8nWebhookUrl}?agentId=${agentId}`;
          if (userApiKey) {
            webhookUrl += `&panelUrl=${encodeURIComponent(baseUrl)}&apiKey=${encodeURIComponent(userApiKey)}`;
          }
        } else {
          webhookUrl = `${baseUrl}/api/agents/webhook?agentId=${agentId}`;
          if (userApiKey) {
            webhookUrl += `&panelUrl=${encodeURIComponent(baseUrl)}&apiKey=${encodeURIComponent(userApiKey)}`;
          }
        }

        console.log("📌 Webhook URL construída:", webhookUrl);

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
        };

        console.log("📤 Enviando dados para Evolution API:", evolutionBotData);

        // const evolutionIntegration = connections[0];
        // console.log(
        //   "✅ Integração Evolution API encontrada:",
        //   evolutionIntegration.name
        // );

        // // Extrair configurações do JSON
        // let evolutionConfig;
        // try {
        //   evolutionConfig =
        //     typeof evolutionIntegration.config === "string"
        //       ? JSON.parse(evolutionIntegration.config)
        //       : evolutionIntegration.config;
        // } catch (parseError) {
        //   console.error("❌ Erro ao fazer parse da configuração:", parseError);
        //   throw new Error("Configuração da Evolution API está malformada");
        // }

        // const evolutionUrl = evolutionConfig.apiUrl;
        // const evolutionKey = evolutionConfig.apiKey;

        // if (!evolutionUrl || !evolutionKey) {
        //   console.error("❌ Configurações incompletas:", {
        //     hasUrl: !!evolutionUrl,
        //     hasKey: !!evolutionKey,
        //     config: evolutionConfig,
        //   });
        //   throw new Error(
        //     "Configurações da Evolution API incompletas. Verifique apiUrl e apiKey."
        //   );
        // }
        console.log("Instance token ->>", connection.instance_token);
        const createBotResponse = await fetch(evolutionApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: connection.instance_token,
          },
          body: JSON.stringify(evolutionBotData),
        });

        console.log("📥 Resposta da Evolution API:", createBotResponse.status);

        if (createBotResponse.ok) {
          const botResult = await createBotResponse.json();
          evolutionBotId = botResult.id;
          console.log("✅ Bot criado na Evolution API:", evolutionBotId);

          // QUARTO: Atualizar agente no banco com o evolution_bot_id
          console.log("🔄 Atualizando agente com evolution_bot_id...");
          const updateResponse = await fetch(
            `${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}`,
            {
              method: "PATCH",
              headers,
              body: JSON.stringify({ evolution_bot_id: evolutionBotId }),
            }
          );

          if (!updateResponse.ok) {
            console.warn(
              "⚠️ Erro ao atualizar evolution_bot_id, mas agente foi criado"
            );
          } else {
            console.log("✅ evolution_bot_id atualizado no banco");
          }
        } else {
          const errorText = await createBotResponse.text();
          console.warn(
            "⚠️ Falha ao criar bot na Evolution API:",
            createBotResponse.status,
            errorText
          );
          // Continuar sem o bot da Evolution API
        }
      } catch (evolutionError) {
        console.warn("⚠️ Erro ao criar bot na Evolution API:", evolutionError);
        // Continuar sem o bot da Evolution API
      }
    }
    } // Fechar bloco else do Evolution

    console.log("✅ Processo completo - Agente criado com sucesso:", agentId);

    return NextResponse.json({
      success: true,
      agent: { ...newAgent, evolution_bot_id: evolutionBotId, bot_id: createdBotId },
      evolutionBotId: evolutionBotId,
      botId: createdBotId,
      message: "Agente criado com sucesso",
    });
  } catch (error: any) {
    console.error("❌ Erro ao criar agente:", error.message);
    return NextResponse.json(
      {
        error: "Erro ao criar agente",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  console.log("📡 API: PUT /api/admin/agents chamada");

  try {
    const { id, ...agentData } = await request.json();
    console.log("📝 Atualizando agente:", id);

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Variáveis de ambiente do Supabase não configuradas");
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    };

    // Buscar agente atual para obter evolution_bot_id, bot_id e connection info
    const currentAgentResponse = await fetch(
      `${supabaseUrl}/rest/v1/ai_agents?select=*,whatsapp_connections!ai_agents_whatsapp_connection_id_fkey(instance_name)&id=eq.${id}`,
      { headers }
    );

    let currentAgent = null;
    if (currentAgentResponse.ok) {
      const currentAgents = await currentAgentResponse.json();
      if (currentAgents && currentAgents.length > 0) {
        currentAgent = currentAgents[0];

        // Atualizar bot na Evolution API se existir
        if (
          currentAgent.evolution_bot_id &&
          currentAgent.whatsapp_connections?.instance_name
        ) {
          console.log("🤖 Atualizando bot na Evolution API...");
          try {
            // PROBLEMA IDENTIFICADO: Usar URL absoluta ao invés de relativa no Docker
            const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
            const evolutionApiUrl = `${baseUrl}/api/integrations/evolution/evolutionBot/update/${currentAgent.evolution_bot_id}/${currentAgent.whatsapp_connections.instance_name}`;

            console.log(
              "🔗 URL da Evolution API para update:",
              evolutionApiUrl
            );

            // Buscar configuração do N8N para incluir no webhook
            let n8nWebhookUrl = null;
            let n8nIntegrations = null;
            try {
              const n8nResponse = await fetch(
                `${supabaseUrl}/rest/v1/integrations?select=*&type=eq.n8n&is_active=eq.true`,
                { headers }
              );

              if (n8nResponse.ok) {
                n8nIntegrations = await n8nResponse.json();
                if (n8nIntegrations && n8nIntegrations.length > 0) {
                  const n8nConfig =
                    typeof n8nIntegrations[0].config === "string"
                      ? JSON.parse(n8nIntegrations[0].config)
                      : n8nIntegrations[0].config;
                  n8nWebhookUrl = n8nConfig.flowUrl;
                }
              }
            } catch (n8nError) {
              console.log("⚠️ N8N não configurado para atualização");
            }

            // Buscar API key ativa do usuário para incluir no webhook
            console.log("🔍 Buscando API key ativa do usuário...");
            let userApiKey = null;
            try {
              const apiKeyResponse = await fetch(
                `${supabaseUrl}/rest/v1/user_api_keys?select=api_key&user_id=eq.${agentData.user_id}&is_active=eq.true&order=created_at.desc&limit=1`,
                { headers }
              );
              if (apiKeyResponse.ok) {
                const apiKeys = await apiKeyResponse.json();
                if (apiKeys && apiKeys.length > 0) {
                  userApiKey = apiKeys[0].api_key;
                  console.log("✅ API key do usuário encontrada");
                } else {
                  console.warn("⚠️ Nenhuma API key ativa encontrada para o usuário");
                }
              }
            } catch (apiKeyError) {
              console.warn("⚠️ Erro ao buscar API key do usuário:", apiKeyError);
            }

            // Construir URL do webhook com agentId, panelUrl e apiKey
            let webhookUrl;
            if (n8nWebhookUrl) {
              webhookUrl = `${n8nWebhookUrl}?agentId=${id}`;
              if (userApiKey) {
                webhookUrl += `&panelUrl=${encodeURIComponent(baseUrl)}&apiKey=${encodeURIComponent(userApiKey)}`;
              }
            } else {
              webhookUrl = `${baseUrl}/api/agents/webhook?agentId=${id}`;
              if (userApiKey) {
                webhookUrl += `&panelUrl=${encodeURIComponent(baseUrl)}&apiKey=${encodeURIComponent(userApiKey)}`;
              }
            }

            console.log("📌 Webhook URL construída:", webhookUrl);

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
                agentData.unknown_message ||
                "Desculpe, não entendi sua mensagem.",
              listeningFromMe: Boolean(agentData.listening_from_me),
              stopBotFromMe: Boolean(agentData.stop_bot_from_me),
              keepOpen: Boolean(agentData.keep_open),
              debounceTime: agentData.debounce_time || 10,
              ignoreJids: Array.isArray(agentData.ignore_jids)
                ? agentData.ignore_jids
                : ["@g.us"],
              splitMessages: Boolean(agentData.split_messages),
              timePerChar: agentData.time_per_char || 100,
            };

            console.log(
              "📤 Enviando dados de update para Evolution API:",
              evolutionBotData
            );

            const updateBotResponse = await fetch(evolutionApiUrl, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(evolutionBotData),
            });

            console.log(
              "📥 Resposta do update da Evolution API:",
              updateBotResponse.status
            );

            if (updateBotResponse.ok) {
              console.log("✅ Bot atualizado na Evolution API");
            } else {
              const errorText = await updateBotResponse.text();
              console.warn(
                "⚠️ Erro ao atualizar bot na Evolution API:",
                updateBotResponse.status,
                errorText
              );
            }
          } catch (evolutionError) {
            console.warn(
              "⚠️ Erro ao atualizar bot na Evolution API:",
              evolutionError
            );
          }
        }
      }
    }

    // Preparar dados para atualização no banco - CORRIGIR formatação do ignore_jids
    const ignoreJidsArray = Array.isArray(agentData.ignore_jids)
      ? agentData.ignore_jids
      : ["@g.us"];

    // Filtrar apenas campos da tabela ai_agents (excluir campos de bot)
    const { 
      bot_gatilho, 
      bot_operador, 
      bot_value, 
      bot_debounce, 
      bot_splitMessage, 
      bot_ignoreJids, 
      bot_padrao,
      ...aiAgentFields 
    } = agentData;

    const dbAgentData = {
      ...aiAgentFields,
      // Garantir que campos booleanos sejam strings para o Supabase
      transcribe_audio: String(Boolean(agentData.transcribe_audio)),
      understand_images: String(Boolean(agentData.understand_images)),
      voice_response_enabled: String(Boolean(agentData.voice_response_enabled)),
      calendar_integration: String(Boolean(agentData.calendar_integration)),
      chatnode_integration: String(Boolean(agentData.chatnode_integration)),
      orimon_integration: String(Boolean(agentData.orimon_integration)),
      is_default: String(Boolean(agentData.is_default)),
      listening_from_me: String(Boolean(agentData.listening_from_me)),
      stop_bot_from_me: String(Boolean(agentData.stop_bot_from_me)),
      keep_open: String(Boolean(agentData.keep_open)),
      split_messages: String(Boolean(agentData.split_messages)),
      // CORRIGIR: Usar formato PostgreSQL array ao invés de JSON string
      ignore_jids: `{${ignoreJidsArray.map((jid) => `"${jid}"`).join(",")}}`,
    };

    // Atualizar agente no banco
    const response = await fetch(
      `${supabaseUrl}/rest/v1/ai_agents?id=eq.${id}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify(dbAgentData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erro ao atualizar agente:", response.status, errorText);
      throw new Error(`Erro ao atualizar agente: ${response.status}`);
    }

    console.log("✅ Agente atualizado com sucesso");

    // ============================================
    // ATUALIZAR CONFIGURAÇÕES DO BOT (UazAPI)
    // ============================================
    if (currentAgent.bot_id && (bot_gatilho || bot_operador || bot_value || bot_debounce || bot_splitMessage || bot_ignoreJids || bot_padrao !== undefined)) {
      console.log("🤖 [UAZAPI] Atualizando configurações do bot:", currentAgent.bot_id);
      
      try {
        // Preparar dados do bot
        const botData: any = {};
        
        if (bot_gatilho !== undefined) botData.gatilho = bot_gatilho;
        if (bot_operador !== undefined) botData.operador_gatilho = bot_operador;
        if (bot_value !== undefined) botData.value_gatilho = bot_value;
        if (bot_debounce !== undefined) botData.debounce = Number(bot_debounce);
        if (bot_splitMessage !== undefined) botData.splitMessage = Number(bot_splitMessage);
        if (bot_padrao !== undefined) botData.padrao = Boolean(bot_padrao);
        
        // Processar ignoreJids se fornecido
        if (bot_ignoreJids !== undefined) {
          let ignoreJidsString = "@g.us,";
          if (Array.isArray(bot_ignoreJids)) {
            ignoreJidsString = bot_ignoreJids.join(",") + ",";
          } else if (typeof bot_ignoreJids === "string") {
            ignoreJidsString = bot_ignoreJids;
          }
          botData.ignoreJids = ignoreJidsString;
        }

        console.log("📝 [UAZAPI] Dados do bot para atualização:", botData);

        // Atualizar bot na tabela bots
        const updateBotResponse = await fetch(
          `${supabaseUrl}/rest/v1/bots?id=eq.${currentAgent.bot_id}`,
          {
            method: "PATCH",
            headers: {
              ...headers,
              "Content-Profile": "impaai",
              "Accept-Profile": "impaai",
            },
            body: JSON.stringify(botData),
          }
        );

        if (!updateBotResponse.ok) {
          const errorText = await updateBotResponse.text();
          console.error("❌ [UAZAPI] Erro ao atualizar bot:", updateBotResponse.status, errorText);
          throw new Error(`Erro ao atualizar bot: ${updateBotResponse.status}`);
        }

        console.log("✅ [UAZAPI] Bot atualizado com sucesso");
      } catch (botError: any) {
        console.error("❌ [UAZAPI] Erro ao atualizar bot:", botError.message);
        // Não falhar a operação principal se o bot falhar
        console.warn("⚠️ [UAZAPI] Continuando sem atualizar bot");
      }
    } else {
      console.log("ℹ️ [UAZAPI] Nenhuma configuração de bot para atualizar");
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("❌ Erro ao atualizar agente:", error.message);
    return NextResponse.json(
      {
        error: "Erro ao atualizar agente",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  console.log("📡 API: DELETE /api/admin/agents chamada");

  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("id");

    if (!agentId) {
      throw new Error("ID do agente é obrigatório");
    }

    console.log("🗑️ Deletando agente:", agentId);

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Variáveis de ambiente do Supabase não configuradas");
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    };

    // Buscar agente para obter evolution_bot_id antes de deletar
    const agentResponse = await fetch(
      `${supabaseUrl}/rest/v1/ai_agents?select=*,whatsapp_connections!ai_agents_whatsapp_connection_id_fkey(instance_name)&id=eq.${agentId}`,
      { headers }
    );

    if (agentResponse.ok) {
      const agents = await agentResponse.json();
      if (agents && agents.length > 0) {
        const agent = agents[0];

        // Deletar bot da Evolution API se existir
        if (
          agent.evolution_bot_id &&
          agent.whatsapp_connections?.instance_name
        ) {
          console.log("🤖 Deletando bot da Evolution API...");
          try {
            // PROBLEMA IDENTIFICADO: Usar URL absoluta ao invés de relativa no Docker
            const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
            const evolutionApiUrl = `${baseUrl}/api/integrations/evolution/evolutionBot/delete/${agent.evolution_bot_id}/${agent.whatsapp_connections.instance_name}`;

            console.log(
              "🔗 URL da Evolution API para delete:",
              evolutionApiUrl
            );

            const deleteBotResponse = await fetch(evolutionApiUrl, {
              method: "DELETE",
            });

            console.log(
              "📥 Resposta do delete da Evolution API:",
              deleteBotResponse.status
            );

            if (deleteBotResponse.ok) {
              console.log("✅ Bot deletado da Evolution API");
            } else {
              const errorText = await deleteBotResponse.text();
              console.warn(
                "⚠️ Erro ao deletar bot da Evolution API:",
                deleteBotResponse.status,
                errorText
              );
            }
          } catch (evolutionError) {
            console.warn(
              "⚠️ Erro ao deletar bot da Evolution API:",
              evolutionError
            );
          }
        }

        // Deletar bot Uazapi e webhook se existir
        if (agent.bot_id) {
          console.log(`🗑️ [DELETE AGENT] Agente tem bot_id: ${agent.bot_id}, iniciando deleção...`);
          try {
            const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
            const deleteBotUrl = `${baseUrl}/api/bots/${agent.bot_id}`;

            console.log(`🔗 [DELETE AGENT] URL do bot para delete: ${deleteBotUrl}`);

            const deleteBotResponse = await fetch(deleteBotUrl, {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                "Cookie": request.headers.get("cookie") || "",
              },
            });

            console.log(`📥 [DELETE AGENT] Resposta do delete do bot: ${deleteBotResponse.status}`);

            if (deleteBotResponse.ok) {
              console.log("✅ [DELETE AGENT] Bot e webhook deletados com sucesso");
            } else {
              const errorText = await deleteBotResponse.text();
              console.warn(
                `⚠️ [DELETE AGENT] Erro ao deletar bot: ${deleteBotResponse.status} - ${errorText}`
              );
            }
          } catch (botError: any) {
            console.warn(
              `⚠️ [DELETE AGENT] Erro ao deletar bot: ${botError.message}`
            );
          }
        } else {
          console.log("ℹ️ [DELETE AGENT] Agente não possui bot_id, pulando deleção de bot/webhook");
        }
      }
    }

    // Deletar agente do banco
    const response = await fetch(
      `${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}`,
      {
        method: "DELETE",
        headers,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erro ao deletar agente:", response.status, errorText);
      throw new Error(`Erro ao deletar agente: ${response.status}`);
    }

    console.log("✅ Agente deletado com sucesso");

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("❌ Erro ao deletar agente:", error.message);
    return NextResponse.json(
      {
        error: "Erro ao deletar agente",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
