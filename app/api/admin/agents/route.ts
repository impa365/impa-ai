import { NextResponse } from "next/server";
import { query, queryOne, queryMany, buildInsert, buildUpdate } from "@/lib/db";

export async function GET() {
  console.log("📡 API: /api/admin/agents chamada");

  try {
    console.log("🔍 Buscando agentes...");
    // Buscar agentes com joins - incluindo model_config para provedor LLM
    const agents = await queryMany(`
      SELECT a.*,
        CASE WHEN up.id IS NOT NULL THEN json_build_object('id', up.id, 'email', up.email, 'full_name', up.full_name) ELSE NULL END as user_profiles,
        CASE WHEN wc.id IS NOT NULL THEN json_build_object('connection_name', wc.connection_name, 'status', wc.status, 'api_type', wc.api_type) ELSE NULL END as whatsapp_connections
      FROM ai_agents a
      LEFT JOIN user_profiles up ON a.user_id = up.id
      LEFT JOIN whatsapp_connections wc ON a.whatsapp_connection_id = wc.id
      ORDER BY a.created_at DESC
    `);
    console.log("✅ Agentes encontrados:", agents.length);

    console.log("🔍 Buscando usuários...");
    const users = await queryMany(
      `SELECT id, email, full_name FROM user_profiles ORDER BY full_name ASC`
    );
    console.log("✅ Usuários encontrados:", users.length);

    console.log("🔍 Buscando conexões WhatsApp...");
    const connections = await queryMany(
      `SELECT * FROM whatsapp_connections ORDER BY connection_name ASC`
    );
    console.log("✅ Conexões encontradas:", connections.length);

    console.log("🔍 Buscando configurações de provedores LLM...");
    let llmConfig = {
      available_providers: ["openai", "anthropic", "google"],
      default_model: "gpt-4o-mini"
    };

    const settings = await queryMany(
      `SELECT setting_key, setting_value FROM system_settings WHERE setting_key = ANY($1)`,
      [['available_llm_providers', 'default_model']]
    );

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

    // Primeiro, buscar a conexão WhatsApp para obter o instance_name
    console.log("🔍 Buscando dados da conexão WhatsApp...");
    const connection = await queryOne(
      `SELECT * FROM whatsapp_connections WHERE id = $1`,
      [agentData.whatsapp_connection_id]
    );

    if (!connection) {
      throw new Error("Conexão WhatsApp não encontrada");
    }
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
      ignore_jids: ignoreJidsArray,
      
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

    const { text: insertText, values: insertValues } = buildInsert("ai_agents", dbAgentData);
    const newAgent = await queryOne(insertText, insertValues);

    if (!newAgent) {
      throw new Error("Erro ao criar agente no banco");
    }

    const agentId = newAgent.id;
    console.log("✅ Agente criado no banco com ID:", agentId);

    // SEGUNDO: Buscar configuração do N8N para incluir no webhook
    console.log("🔍 Buscando configuração do N8N...");
    let n8nWebhookUrl = null;
    let n8nIntegrations: any[] | null = null;
    try {
      n8nIntegrations = await queryMany(
        `SELECT * FROM integrations WHERE type = $1 AND is_active = true`,
        ['n8n']
      );

      if (n8nIntegrations && n8nIntegrations.length > 0) {
        const n8nConfig =
          typeof n8nIntegrations[0].config === "string"
            ? JSON.parse(n8nIntegrations[0].config)
            : n8nIntegrations[0].config;
        n8nWebhookUrl = n8nConfig.flowUrl;
        console.log("✅ N8N webhook encontrado");
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
        const n8nSessions = await queryMany(
          `SELECT * FROM integrations WHERE type = $1 AND is_active = true`,
          ['n8n_session']
        );

        let n8nSessionUrl = null;
        if (n8nSessions && n8nSessions.length > 0) {
          const n8nSessionConfig =
            typeof n8nSessions[0].config === "string"
              ? JSON.parse(n8nSessions[0].config)
              : n8nSessions[0].config;
          n8nSessionUrl = n8nSessionConfig.webhookUrl || n8nSessionConfig.webhook_url;
        }

        if (!n8nSessionUrl) {
          throw new Error("N8N Session não configurado. Configure em Integrações.");
        }

        console.log("✅ [UAZAPI] N8N Session encontrado");

        // Buscar API key ativa do usuário que está criando o agente
        console.log("🔍 [UAZAPI] Buscando API key ativa do usuário:", agentData.user_id);
        let userApiKey = null;
        try {
          const apiKeyRow = await queryOne<{ api_key: string }>(
            `SELECT api_key FROM user_api_keys WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1`,
            [agentData.user_id]
          );

          if (apiKeyRow) {
            userApiKey = apiKeyRow.api_key;
            console.log("✅ [UAZAPI] API key do usuário encontrada");
          } else {
            console.warn("⚠️ [UAZAPI] Nenhuma API key ativa encontrada");
            throw new Error("Você precisa criar uma API key antes de criar agentes. Vá para 'Gerenciar API Keys' e crie uma chave de API ativa.");
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

        const { text: botInsertText, values: botInsertValues } = buildInsert("bots", botPayload);
        const createdBot = await queryOne(botInsertText, botInsertValues);

        if (!createdBot) {
          throw new Error("Falha ao criar bot no banco");
        }

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
        await query(
          `UPDATE bots SET webhook_id = $1 WHERE id = $2`,
          [webhookResult.webhookId, createdBotId]
        );
        console.log("✅ [UAZAPI] webhook_id salvo no bot");

        // ETAPA 4: Vincular bot ao agente
        console.log("🔗 [UAZAPI] Vinculando bot ao agente...");
        console.log(`📝 [UAZAPI] Atualizando agente ${agentId} com bot_id: ${createdBotId}`);
        await query(
          `UPDATE ai_agents SET bot_id = $1 WHERE id = $2`,
          [createdBotId, agentId]
        );
        console.log("✅ [UAZAPI] Bot vinculado ao agente com sucesso!");

      } catch (uazapiError: any) {
        console.error("❌ [UAZAPI] Erro:", uazapiError.message);

        // ROLLBACK
        console.log("🔄 [UAZAPI] Iniciando ROLLBACK...");

        try {
          console.log(`🗑️ [UAZAPI ROLLBACK] Deletando agente: ${agentId}`);
          await query(`DELETE FROM ai_agents WHERE id = $1`, [agentId]);
          console.log("✅ [UAZAPI ROLLBACK] Agente deletado");
        } catch (e) {
          console.error("❌ [UAZAPI ROLLBACK] Falha ao deletar agente:", e);
        }

        if (createdBotId) {
          try {
            console.log(`🗑️ [UAZAPI ROLLBACK] Deletando bot: ${createdBotId}`);

            const botForRollback = await queryOne<{ webhook_id: string }>(
              `SELECT webhook_id FROM bots WHERE id = $1`,
              [createdBotId]
            );

            if (botForRollback?.webhook_id) {
              console.log(`🗑️ [UAZAPI ROLLBACK] Deletando webhook: ${botForRollback.webhook_id}`);
              const { deleteUazapiWebhook } = await import("@/lib/uazapi-webhook-helpers");
              const { getUazapiConfigServer } = await import("@/lib/uazapi-server");
              const uazapiConfig = await getUazapiConfigServer();

              if (uazapiConfig) {
                await deleteUazapiWebhook({
                  uazapiServerUrl: uazapiConfig.serverUrl,
                  instanceToken: connection.instance_token,
                  webhookId: botForRollback.webhook_id,
                });
                console.log("✅ [UAZAPI ROLLBACK] Webhook deletado");
              }
            }

            await query(`DELETE FROM bots WHERE id = $1`, [createdBotId]);
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
          const admin = await queryOne<{ id: string }>(
            `SELECT id FROM user_profiles WHERE role = $1 LIMIT 1`,
            ['admin']
          );

          if (!admin) {
            throw new Error("Nenhum administrador encontrado no sistema");
          }
          console.log("✅ Admin identificado:", admin.id);

          // Agora buscar API key do admin
          const apiKeyRow = await queryOne<{ api_key: string }>(
            `SELECT api_key FROM user_api_keys WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1`,
            [admin.id]
          );

          if (apiKeyRow) {
            userApiKey = apiKeyRow.api_key;
            console.log("✅ API key do admin encontrada");
          } else {
            console.warn("⚠️ Nenhuma API key ativa encontrada para o admin");
            throw new Error("O administrador precisa criar uma API key antes que agentes possam ser criados. Vá para 'Gerenciar API Keys' e crie uma chave de API ativa.");
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
          try {
            await query(
              `UPDATE ai_agents SET evolution_bot_id = $1 WHERE id = $2`,
              [evolutionBotId, agentId]
            );
            console.log("✅ evolution_bot_id atualizado no banco");
          } catch (updateErr) {
            console.warn("⚠️ Erro ao atualizar evolution_bot_id, mas agente foi criado");
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

    // Buscar agente atual para obter evolution_bot_id, bot_id e connection info
    const currentAgent = await queryOne(`
      SELECT a.*,
        CASE WHEN wc.id IS NOT NULL THEN json_build_object('instance_name', wc.instance_name) ELSE NULL END as whatsapp_connections
      FROM ai_agents a
      LEFT JOIN whatsapp_connections wc ON a.whatsapp_connection_id = wc.id
      WHERE a.id = $1
    `, [id]);

    if (currentAgent) {
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
          let n8nIntegrations: any[] | null = null;
          try {
            n8nIntegrations = await queryMany(
              `SELECT * FROM integrations WHERE type = $1 AND is_active = true`,
              ['n8n']
            );

            if (n8nIntegrations && n8nIntegrations.length > 0) {
              const n8nConfig =
                typeof n8nIntegrations[0].config === "string"
                  ? JSON.parse(n8nIntegrations[0].config)
                  : n8nIntegrations[0].config;
              n8nWebhookUrl = n8nConfig.flowUrl;
            }
          } catch (n8nError) {
            console.log("⚠️ N8N não configurado para atualização");
          }

          // Buscar API key ativa do usuário para incluir no webhook
          console.log("🔍 Buscando API key ativa do usuário...");
          let userApiKey = null;
          try {
            const apiKeyRow = await queryOne<{ api_key: string }>(
              `SELECT api_key FROM user_api_keys WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1`,
              [agentData.user_id]
            );
            if (apiKeyRow) {
              userApiKey = apiKeyRow.api_key;
              console.log("✅ API key do usuário encontrada");
            } else {
              console.warn("⚠️ Nenhuma API key ativa encontrada para o usuário");
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
      // Usar valores booleanos nativos para PostgreSQL direto
      transcribe_audio: Boolean(agentData.transcribe_audio),
      understand_images: Boolean(agentData.understand_images),
      voice_response_enabled: Boolean(agentData.voice_response_enabled),
      calendar_integration: Boolean(agentData.calendar_integration),
      chatnode_integration: Boolean(agentData.chatnode_integration),
      orimon_integration: Boolean(agentData.orimon_integration),
      is_default: Boolean(agentData.is_default),
      listening_from_me: Boolean(agentData.listening_from_me),
      stop_bot_from_me: Boolean(agentData.stop_bot_from_me),
      keep_open: Boolean(agentData.keep_open),
      split_messages: Boolean(agentData.split_messages),
      // Passar array nativo para PostgreSQL
      ignore_jids: ignoreJidsArray,
    };

    // Atualizar agente no banco
    const { text: updateText, values: updateValues } = buildUpdate("ai_agents", dbAgentData, { id });
    await queryOne(updateText, updateValues);

    console.log("✅ Agente atualizado com sucesso");

    // ============================================
    // ATUALIZAR CONFIGURAÇÕES DO BOT (UazAPI)
    // ============================================
    if (currentAgent && currentAgent.bot_id && (bot_gatilho || bot_operador || bot_value || bot_debounce || bot_splitMessage || bot_ignoreJids || bot_padrao !== undefined)) {
      console.log("🤖 [UAZAPI] Atualizando configurações do bot:", currentAgent.bot_id);
      
      try {
        // Preparar dados do bot
        const botData: Record<string, any> = {};
        
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

        if (Object.keys(botData).length > 0) {
          // Atualizar bot na tabela bots
          const { text: botUpdateText, values: botUpdateValues } = buildUpdate("bots", botData, { id: currentAgent.bot_id });
          await queryOne(botUpdateText, botUpdateValues);
          console.log("✅ [UAZAPI] Bot atualizado com sucesso");
        }
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

    // Buscar agente para obter evolution_bot_id antes de deletar
    const agent = await queryOne(`
      SELECT a.*,
        CASE WHEN wc.id IS NOT NULL THEN json_build_object('instance_name', wc.instance_name) ELSE NULL END as whatsapp_connections
      FROM ai_agents a
      LEFT JOIN whatsapp_connections wc ON a.whatsapp_connection_id = wc.id
      WHERE a.id = $1
    `, [agentId]);

    if (agent) {
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

    // Deletar agente do banco
    await query(`DELETE FROM ai_agents WHERE id = $1`, [agentId]);

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
