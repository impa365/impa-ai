import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    console.log("📡 [GET AGENT] Iniciando busca do agente:", agentId);

    // Verificar variáveis de ambiente em runtime
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ [GET AGENT] Variáveis de ambiente não configuradas");
      return NextResponse.json(
        { error: "Configuração do servidor incompleta" },
        { status: 500 }
      );
    }

    console.log("🔍 [GET AGENT] Buscando agente no banco...");

    // Buscar agente com dados relacionados
    const response = await fetch(
      `${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}`,
      {
        headers: {
          "Content-Type": "application/json",
          "Accept-Profile": "impaai",
          "Content-Profile": "impaai",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [GET AGENT] Erro ao buscar agente no banco:", response.status, errorText);
      return NextResponse.json(
        { error: `Erro ao buscar agente: ${response.status}` },
        { status: response.status }
      );
    }

    const agentData = await response.json();
    const agent = agentData[0];

    if (!agent) {
      console.error("❌ [GET AGENT] Agente não encontrado:", agentId);
      return NextResponse.json(
        { error: "Agente não encontrado" },
        { status: 404 }
      );
    }

    console.log("✅ [GET AGENT] Agente encontrado:", agent.name);
    console.log("🔍 [GET AGENT] bot_id:", agent.bot_id || "NULL");
    console.log("🔍 [GET AGENT] whatsapp_connection_id:", agent.whatsapp_connection_id || "NULL");

    // Se tem whatsapp_connection_id, buscar dados da conexão
    if (agent.whatsapp_connection_id) {
      console.log("🔍 [GET AGENT] Buscando dados da conexão WhatsApp...");
      
      const connectionResponse = await fetch(
        `${supabaseUrl}/rest/v1/whatsapp_connections?id=eq.${agent.whatsapp_connection_id}`,
        {
          headers: {
            "Content-Type": "application/json",
            "Accept-Profile": "impaai",
            "Content-Profile": "impaai",
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );

      if (connectionResponse.ok) {
        const connections = await connectionResponse.json();
        const connection = connections[0];
        
        if (connection) {
          agent.connection = connection;
          console.log("✅ [GET AGENT] Conexão encontrada:", connection.connection_name);
        }
      }
    }

    // Se tem bot_id, buscar dados do bot Uazapi
    if (agent.bot_id) {
      console.log("🤖 [GET AGENT] Buscando dados do bot Uazapi...");
      
      const botResponse = await fetch(
        `${supabaseUrl}/rest/v1/bots?id=eq.${agent.bot_id}`,
        {
          headers: {
            "Content-Type": "application/json",
            "Accept-Profile": "impaai",
            "Content-Profile": "impaai",
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );

      if (botResponse.ok) {
        const bots = await botResponse.json();
        const bot = bots[0];
        
        if (bot) {
          agent.bot = bot;
          console.log("✅ [GET AGENT] Bot encontrado:", bot.nome);
        }
      }
    }

    // Resolver llm_api_key se for referência salva
    if (agent.llm_api_key && agent.llm_api_key.startsWith("__SAVED_KEY__")) {
      const keyId = agent.llm_api_key.replace("__SAVED_KEY__", "");
      console.log("🔑 [GET AGENT] Resolvendo chave salva:", keyId);
      
      const savedKeyResponse = await fetch(
        `${supabaseUrl}/rest/v1/llm_api_keys?select=api_key&id=eq.${keyId}&is_active=eq.true`,
        {
          headers: {
            "Content-Type": "application/json",
            "Accept-Profile": "impaai",
            "Content-Profile": "impaai",
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );
      
      if (savedKeyResponse.ok) {
        const savedKeys = await savedKeyResponse.json();
        if (savedKeys && savedKeys[0]) {
          agent.llm_api_key = savedKeys[0].api_key;
          console.log("✅ [GET AGENT] Chave salva resolvida:", `${agent.llm_api_key?.slice(0, 7)}...`);
        }
      }
    }

    console.log("✅ [GET AGENT] Retornando dados do agente");

    return NextResponse.json({ agent });
  } catch (error: any) {
    console.error("❌ [GET AGENT] Erro geral ao buscar agente:", error);
    console.error("❌ [GET AGENT] Stack trace:", error.stack);
    return NextResponse.json(
      { 
        error: "Erro interno do servidor",
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const body = await request.json();

    // Verificar variáveis de ambiente em runtime
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Configuração do servidor incompleta" },
        { status: 500 }
      );
    }

    // 1. Atualizar no banco primeiro - filtrar apenas campos da tabela ai_agents
    const calendarProvider = body.calendar_provider || "calcom";
    const calendarVersion =
      calendarProvider === "calcom"
        ? body.calendar_api_version || "v1"
        : body.calendar_api_version || null;
    const calendarUrl =
      calendarProvider === "calcom"
        ? body.calendar_api_url ||
          (calendarVersion === "v2" ? "https://api.cal.com/v2" : "https://api.cal.com/v1")
        : body.calendar_api_url || null;

    const aiAgentFields = {
      name: body.name,
      identity_description: body.identity_description,
      training_prompt: body.training_prompt,
      voice_tone: body.voice_tone,
      main_function: body.main_function,
      temperature: body.temperature,
      transcribe_audio: body.transcribe_audio,
      understand_images: body.understand_images,
      voice_response_enabled: body.voice_response_enabled,
      voice_provider: body.voice_provider,
      voice_api_key: body.voice_api_key,
      voice_id: body.voice_id,
      calendar_integration: body.calendar_integration,
      calendar_provider: calendarProvider,
      calendar_api_version: calendarVersion,
      calendar_api_url: calendarUrl,
      calendar_api_key: body.calendar_api_key,
      calendar_meeting_id: body.calendar_meeting_id,
      chatnode_integration: body.chatnode_integration,
      chatnode_api_key: body.chatnode_api_key,
      chatnode_bot_id: body.chatnode_bot_id,
      orimon_integration: body.orimon_integration,
      orimon_api_key: body.orimon_api_key,
      orimon_bot_id: body.orimon_bot_id,
      description: body.description,
      status: body.status,
      is_default: body.is_default,
      user_id: body.user_id,
      whatsapp_connection_id: body.whatsapp_connection_id,
      model: body.model,
      model_config: body.model_config,
      // Campos Evolution API
      trigger_type: body.trigger_type,
      trigger_operator: body.trigger_operator,
      trigger_value: body.trigger_value,
      keyword_finish: body.keyword_finish,
      debounce_time: body.debounce_time,
      listening_from_me: body.listening_from_me,
      stop_bot_from_me: body.stop_bot_from_me,
      keep_open: body.keep_open,
      split_messages: body.split_messages,
      unknown_message: body.unknown_message,
      delay_message: body.delay_message,
      expire_time: body.expire_time,
      ignore_jids: body.ignore_jids,
    };

    // Remover campos undefined/null
    const filteredFields = Object.fromEntries(
      Object.entries(aiAgentFields).filter(([_, value]) => value !== undefined && value !== null)
    );

    const response = await fetch(
      `${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Accept-Profile": "impaai",
          "Content-Profile": "impaai",
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify(filteredFields),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: `Erro ao atualizar agente: ${
            errorData.message || response.statusText
          }`,
        },
        { status: response.status }
      );
    }

    const updatedAgent = await response.json();
    const agent = updatedAgent[0] || updatedAgent;

    // 2. Sincronizar com API externa (Evolution ou Uazapi)
    if (agent.whatsapp_connection_id) {
      try {
        console.log("🔄 Sincronizando agente atualizado...");

        // Buscar dados da conexão WhatsApp
        const connectionResponse = await fetch(
          `${supabaseUrl}/rest/v1/whatsapp_connections?id=eq.${agent.whatsapp_connection_id}`,
          {
            headers: {
              "Accept-Profile": "impaai",
              "Content-Profile": "impaai",
              Authorization: `Bearer ${supabaseKey}`,
            },
          }
        );

        if (!connectionResponse.ok) {
          console.error("❌ Erro ao buscar conexão WhatsApp");
          return NextResponse.json(agent); // Retorna sem sincronizar
        }

        const connections = await connectionResponse.json();
        const connection = connections[0];

        if (!connection) {
          console.error("❌ Conexão WhatsApp não encontrada");
          return NextResponse.json(agent);
        }

        const apiType = connection.api_type || "evolution"

        // 2a. Se for Uazapi e tem bot_id, atualizar bot Uazapi
        if (apiType === "uazapi" && agent.bot_id) {
          console.log("🤖 [UAZAPI] Atualizando bot Uazapi...")
          try {
            const { updateUazapiBotInDatabase } = await import("@/lib/uazapi-bot-helpers")

            // Preparar dados do bot para atualização
            const botUpdateData: any = {}

            // Atualizar campos básicos do bot
            if (body.name) botUpdateData.nome = body.name

            // Campos específicos de bot Uazapi (se enviados)
            if (body.bot_gatilho) botUpdateData.gatilho = body.bot_gatilho
            if (body.bot_operador) botUpdateData.operador_gatilho = body.bot_operador
            if (body.bot_value !== undefined) botUpdateData.value_gatilho = body.bot_value
            if (body.bot_debounce !== undefined) botUpdateData.debounce = Number(body.bot_debounce)
            if (body.bot_splitMessage !== undefined) botUpdateData.splitMessage = Number(body.bot_splitMessage)
            if (body.bot_ignoreJids) {
              // Converter array para string
              if (Array.isArray(body.bot_ignoreJids)) {
                botUpdateData.ignoreJids = body.bot_ignoreJids.join(",") + ","
              } else {
                botUpdateData.ignoreJids = body.bot_ignoreJids
              }
            }
            if (body.bot_padrao !== undefined) botUpdateData.padrao = Boolean(body.bot_padrao)

            console.log("📝 [UAZAPI] Dados de atualização do bot:", botUpdateData)

            // Atualizar bot no banco
            const updateResult = await updateUazapiBotInDatabase({
              botId: agent.bot_id,
              botData: botUpdateData,
              supabaseUrl,
              supabaseKey,
            })

            if (updateResult.success) {
              console.log("✅ [UAZAPI] Bot atualizado com sucesso")
            } else {
              console.warn("⚠️ [UAZAPI] Erro ao atualizar bot:", updateResult.error)
            }
          } catch (uazapiError) {
            console.warn("⚠️ [UAZAPI] Erro ao atualizar bot Uazapi:", uazapiError)
          }
        }

        // 2b. Se for Evolution e tem evolution_bot_id, atualizar Evolution API
        if (apiType === "evolution" && agent.evolution_bot_id) {
          console.log("🤖 Atualizando bot na Evolution API...")

        // Buscar configurações da Evolution API
        const evolutionResponse = await fetch(
          `${supabaseUrl}/rest/v1/integrations?type=eq.evolution_api&is_active=eq.true`,
          {
            headers: {
              "Accept-Profile": "impaai",
              "Content-Profile": "impaai",
              Authorization: `Bearer ${supabaseKey}`,
            },
          }
        );

        if (!evolutionResponse.ok) {
          console.error("❌ Erro ao buscar configuração Evolution API");
          return NextResponse.json(agent);
        }

        const evolutionIntegrations = await evolutionResponse.json();
        const evolutionConfig = evolutionIntegrations[0];

        if (!evolutionConfig) {
          console.error("❌ Evolution API não configurada");
          return NextResponse.json(agent);
        }

        const { apiUrl, apiKey } = evolutionConfig.config;

        // Buscar configuração N8N para webhook
        const n8nResponse = await fetch(
          `${supabaseUrl}/rest/v1/integrations?type=eq.n8n&is_active=eq.true`,
          {
            headers: {
              "Accept-Profile": "impaai",
              "Content-Profile": "impaai",
              Authorization: `Bearer ${supabaseKey}`,
            },
          }
        );

        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        let webhookUrl = `${baseUrl}/api/agents/webhook?agentId=${agentId}`;
        let webhookApiKey = undefined;

        if (n8nResponse.ok) {
          const n8nIntegrations = await n8nResponse.json();
          const n8nConfig = n8nIntegrations[0];

          if (n8nConfig?.config?.flowUrl) {
            webhookUrl = `${n8nConfig.config.flowUrl}?agentId=${agentId}`;
            if (n8nConfig.config.apiKey) {
              webhookApiKey = n8nConfig.config.apiKey;
            }
          }
        }

        // Buscar API key ativa do usuário para incluir no webhook
        console.log("🔍 Buscando API key ativa do usuário...");
        let userApiKey = null;
        try {
          const apiKeyResponse = await fetch(
            `${supabaseUrl}/rest/v1/user_api_keys?select=api_key&user_id=eq.${agent.user_id}&is_active=eq.true&order=created_at.desc&limit=1`,
            {
              headers: {
                "Accept-Profile": "impaai",
                "Content-Profile": "impaai",
                Authorization: `Bearer ${supabaseKey}`,
              },
            }
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

        // Adicionar panelUrl e apiKey à URL do webhook se disponíveis
        if (userApiKey) {
          const separator = webhookUrl.includes('?') ? '&' : '?';
          if (!webhookUrl.includes('agentId=')) {
            webhookUrl += `${separator}agentId=${agentId}`;
          }
          webhookUrl += `&panelUrl=${encodeURIComponent(baseUrl)}&apiKey=${encodeURIComponent(userApiKey)}`;
        }

        console.log("📌 Webhook URL construída:", webhookUrl);

        // Processar ignore_jids se for string
        let ignoreJids = agent.ignore_jids || ["@g.us"];
        if (typeof ignoreJids === "string") {
          try {
            ignoreJids = JSON.parse(ignoreJids);
          } catch (e) {
            ignoreJids = ["@g.us"];
          }
        }

        // Preparar dados para Evolution API
        const evolutionBotData = {
          enabled: agent.status === "active",
          apiUrl: webhookUrl,
          apiKey: webhookApiKey,
          triggerType: agent.trigger_type || "keyword",
          triggerOperator: agent.trigger_operator || "equals",
          triggerValue: agent.trigger_value || "",
          expire: agent.expire_time || 0,
          keywordFinish: agent.keyword_finish || "#sair",
          delayMessage: agent.delay_message || 1000,
          unknownMessage:
            agent.unknown_message || "Desculpe, não entendi sua mensagem.",
          listeningFromMe: Boolean(agent.listening_from_me),
          stopBotFromMe: Boolean(agent.stop_bot_from_me),
          keepOpen: Boolean(agent.keep_open),
          debounceTime: (agent.debounce_time || 10) * 1000, // converter segundos para ms
          ignoreJids: ignoreJids,
          splitMessages: Boolean(agent.split_messages),
          timePerChar: agent.time_per_char || 100,
          description: agent.name,
        };

        // Atualizar bot na Evolution API
        const evolutionUpdateResponse = await fetch(
          `${apiUrl}/evolutionBot/update/${agent.evolution_bot_id}/${connection.instance_name}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              apikey: apiKey,
            },
            body: JSON.stringify(evolutionBotData),
          }
        );

        if (evolutionUpdateResponse.ok) {
          console.log("✅ Bot atualizado com sucesso na Evolution API");
        } else {
          const errorText = await evolutionUpdateResponse.text();
          console.error(
            "❌ Erro ao atualizar bot na Evolution API:",
            errorText
          );
        }
      }
    } catch (syncError) {
      console.error("❌ Erro ao sincronizar com API externa:", syncError);
        // Não falha a operação, apenas loga o erro
      }
    }

    return NextResponse.json(agent);
  } catch (error) {
    console.error("❌ Erro geral ao atualizar agente:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;

    // Verificar variáveis de ambiente em runtime
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Configuração do servidor incompleta" },
        { status: 500 }
      );
    }

    // Buscar agente antes de deletar
    const agentResponse = await fetch(
      `${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}`,
      {
        headers: {
          "Accept-Profile": "impaai",
          "Content-Profile": "impaai",
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );
    const agentData = await agentResponse.json();
    const agent = agentData[0];

    // Se tem evolution_bot_id, deletar na Evolution API
    if (agent && agent.evolution_bot_id && agent.whatsapp_connection_id) {
      try {
        // Buscar dados da conexão WhatsApp
        const connectionResponse = await fetch(
          `${supabaseUrl}/rest/v1/whatsapp_connections?id=eq.${agent.whatsapp_connection_id}`,
          {
            headers: {
              "Accept-Profile": "impaai",
              "Content-Profile": "impaai",
              Authorization: `Bearer ${supabaseKey}`,
            },
          }
        );
        const connections = await connectionResponse.json();
        const connection = connections[0];

        if (!connection) {
          console.error("❌ Conexão WhatsApp não encontrada para deletar Evolution Bot");
        } else {
          // Buscar configurações da Evolution API
          const evolutionResponse = await fetch(
            `${supabaseUrl}/rest/v1/integrations?type=eq.evolution_api&is_active=eq.true`,
            {
              headers: {
                "Accept-Profile": "impaai",
                "Content-Profile": "impaai",
                Authorization: `Bearer ${supabaseKey}`,
              },
            }
          );
          const evolutionIntegrations = await evolutionResponse.json();
          const evolutionConfig = evolutionIntegrations[0];

          if (!evolutionConfig) {
            console.error("❌ Evolution API não configurada para deletar Evolution Bot");
          } else {
            const { apiUrl, apiKey } = evolutionConfig.config;
            // Deletar bot na Evolution API
            const evolutionDeleteResponse = await fetch(
              `${apiUrl}/evolutionBot/delete/${agent.evolution_bot_id}/${connection.instance_name}`,
              {
                method: "DELETE",
                headers: {
                  apikey: apiKey,
                },
              }
            );
            if (evolutionDeleteResponse.ok) {
              console.log("✅ Bot deletado com sucesso na Evolution API");
            } else {
              const errorText = await evolutionDeleteResponse.text();
              console.error("❌ Erro ao deletar bot na Evolution API:", errorText);
            }
          }
        }
      } catch (evolutionError) {
        console.error("❌ Erro ao tentar deletar bot na Evolution API:", evolutionError);
      }
    }

    // Agora sim, deletar agente no banco
    const response = await fetch(
      `${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Accept-Profile": "impaai",
          "Content-Profile": "impaai",
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: `Erro ao deletar agente: ${
            errorData.message || response.statusText
          }`,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
