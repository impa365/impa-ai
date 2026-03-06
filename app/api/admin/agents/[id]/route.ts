import { type NextRequest, NextResponse } from "next/server";
import { query, queryOne, queryMany, buildUpdate } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    console.log("📡 [GET AGENT] Iniciando busca do agente:", agentId);

    console.log("🔍 [GET AGENT] Buscando agente no banco...");

    const agent = await queryOne(
      `SELECT * FROM ai_agents WHERE id = $1`,
      [agentId],
    );

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

      const connection = await queryOne(
        `SELECT * FROM whatsapp_connections WHERE id = $1`,
        [agent.whatsapp_connection_id],
      );

      if (connection) {
        agent.connection = connection;
        console.log("✅ [GET AGENT] Conexão encontrada:", connection.connection_name);
      }
    }

    // Se tem bot_id, buscar dados do bot Uazapi
    if (agent.bot_id) {
      console.log("🤖 [GET AGENT] Buscando dados do bot Uazapi...");

      const bot = await queryOne(
        `SELECT * FROM bots WHERE id = $1`,
        [agent.bot_id],
      );

      if (bot) {
        agent.bot = bot;
        console.log("✅ [GET AGENT] Bot encontrado:", bot.nome);
      }
    }

    // Resolver llm_api_key se for referência salva
    if (agent.llm_api_key && agent.llm_api_key.startsWith("__SAVED_KEY__")) {
      const keyId = agent.llm_api_key.replace("__SAVED_KEY__", "");
      console.log("🔑 [GET AGENT] Resolvendo chave salva:", keyId);

      const savedKey = await queryOne<{ api_key: string }>(
        `SELECT api_key FROM llm_api_keys WHERE id = $1 AND is_active = true`,
        [keyId],
      );

      if (savedKey) {
        agent.llm_api_key = savedKey.api_key;
        console.log("✅ [GET AGENT] Chave salva resolvida:", `${agent.llm_api_key?.slice(0, 7)}...`);
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

    if (Object.keys(filteredFields).length === 0) {
      return NextResponse.json(
        { error: "Nenhum campo para atualizar" },
        { status: 400 }
      );
    }

    const { text: updateText, values: updateValues } = buildUpdate("ai_agents", filteredFields, { id: agentId });
    const agent = await queryOne(updateText, updateValues);

    if (!agent) {
      return NextResponse.json(
        { error: "Agente não encontrado" },
        { status: 404 }
      );
    }

    // 2. Sincronizar com API externa (Evolution ou Uazapi)
    if (agent.whatsapp_connection_id) {
      try {
        console.log("🔄 Sincronizando agente atualizado...");

        // Buscar dados da conexão WhatsApp
        const connection = await queryOne(
          `SELECT * FROM whatsapp_connections WHERE id = $1`,
          [agent.whatsapp_connection_id],
        );

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
          const evolutionConfig = await queryOne(
            `SELECT * FROM integrations WHERE type = $1 AND is_active = true`,
            ['evolution_api'],
          );

          if (!evolutionConfig) {
            console.error("❌ Evolution API não configurada");
            return NextResponse.json(agent);
          }

          const { apiUrl, apiKey } = evolutionConfig.config;

          // Buscar configuração N8N para webhook
          const n8nIntegrations = await queryMany(
            `SELECT * FROM integrations WHERE type = $1 AND is_active = true`,
            ['n8n'],
          );

          const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
          let webhookUrl = `${baseUrl}/api/agents/webhook?agentId=${agentId}`;
          let webhookApiKey = undefined;

          if (n8nIntegrations.length > 0) {
            const n8nConfig = n8nIntegrations[0];

            const configData = typeof n8nConfig.config === "string"
              ? JSON.parse(n8nConfig.config)
              : n8nConfig.config;

            if (configData?.flowUrl) {
              webhookUrl = `${configData.flowUrl}?agentId=${agentId}`;
              if (configData.apiKey) {
                webhookApiKey = configData.apiKey;
              }
            }
          }

          // Buscar API key ativa do ADMIN para incluir no webhook
          console.log("🔍 Buscando API key ativa do ADMIN...");
          let userApiKey = null;
          try {
            const admin = await queryOne<{ id: string }>(
              `SELECT id FROM user_profiles WHERE role = $1 LIMIT 1`,
              ['admin'],
            );

            if (!admin) {
              throw new Error("Nenhum administrador encontrado no sistema");
            }
            console.log("✅ Admin identificado:", admin.id);

            const apiKeyRow = await queryOne<{ api_key: string }>(
              `SELECT api_key FROM user_api_keys WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1`,
              [admin.id],
            );

            if (apiKeyRow) {
              userApiKey = apiKeyRow.api_key;
              console.log("✅ API key do admin encontrada");
            } else {
              console.warn("⚠️ Nenhuma API key ativa encontrada para o admin");
            }
          } catch (apiKeyError) {
            console.warn("⚠️ Erro ao buscar API key do admin:", apiKeyError);
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

    // Buscar agente antes de deletar
    const agent = await queryOne(
      `SELECT * FROM ai_agents WHERE id = $1`,
      [agentId],
    );

    // Se tem evolution_bot_id, deletar na Evolution API
    if (agent && agent.evolution_bot_id && agent.whatsapp_connection_id) {
      try {
        // Buscar dados da conexão WhatsApp
        const connection = await queryOne(
          `SELECT * FROM whatsapp_connections WHERE id = $1`,
          [agent.whatsapp_connection_id],
        );

        if (!connection) {
          console.error("❌ Conexão WhatsApp não encontrada para deletar Evolution Bot");
        } else {
          // Buscar configurações da Evolution API
          const evolutionConfig = await queryOne(
            `SELECT * FROM integrations WHERE type = $1 AND is_active = true`,
            ['evolution_api'],
          );

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
    const { rowCount } = await query(
      `DELETE FROM ai_agents WHERE id = $1`,
      [agentId],
    );

    if (rowCount === 0) {
      return NextResponse.json(
        { error: "Agente não encontrado" },
        { status: 404 }
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
