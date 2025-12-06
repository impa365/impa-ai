import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { logAccessDenied } from "@/lib/security-audit"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  console.log("📡 API: GET /api/user/agents/[id] chamada")

  try {
    const { id: agentId } = await params
    
    // 🔒 SEGURANÇA: Autenticar usuário via JWT
    let currentUser
    try {
      currentUser = await requireAuth(request)
    } catch (authError) {
      console.error("❌ Não autorizado:", (authError as Error).message)
      logAccessDenied(undefined, undefined, `/api/user/agents/${agentId}`, request, 'Token JWT inválido ou ausente')
      return NextResponse.json(
        { error: "Não autorizado - Usuário não autenticado" },
        { status: 401 }
      )
    }

    console.log("✅ Usuário autenticado:", currentUser.email)

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

    // Buscar agente com conexão WhatsApp - FILTRAR POR USER_ID
    const agentResponse = await fetch(
      `${supabaseUrl}/rest/v1/ai_agents?select=*,whatsapp_connections(id,connection_name,phone_number,instance_name,api_type)&id=eq.${agentId}&user_id=eq.${currentUser.id}`,
      { headers },
    )

    if (!agentResponse.ok) {
      throw new Error("Erro ao buscar agente")
    }

    const agents = await agentResponse.json()
    if (!agents || agents.length === 0) {
      return NextResponse.json({ error: "Agente não encontrado ou não pertence ao usuário" }, { status: 404 })
    }

    const agent = agents[0]

    // Resolver llm_api_key se for referência salva
    if (agent.llm_api_key && agent.llm_api_key.startsWith("__SAVED_KEY__")) {
      const keyId = agent.llm_api_key.replace("__SAVED_KEY__", "");
      console.log("🔑 Resolvendo chave salva:", keyId);
      
      const savedKeyResponse = await fetch(
        `${supabaseUrl}/rest/v1/llm_api_keys?select=api_key&id=eq.${keyId}&is_active=eq.true`,
        { headers }
      );
      
      if (savedKeyResponse.ok) {
        const savedKeys = await savedKeyResponse.json();
        if (savedKeys && savedKeys[0]) {
          agent.llm_api_key = savedKeys[0].api_key;
          console.log("✅ Chave salva resolvida:", `${agent.llm_api_key?.slice(0, 7)}...`);
        } else {
          console.warn("⚠️ Chave salva não encontrada:", keyId);
        }
      }
    }

    return NextResponse.json({
      success: true,
      agent: agent,
    })
  } catch (error: any) {
    console.error("❌ Erro na API user/agents/[id]:", error.message)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  console.log("📡 API: PUT /api/user/agents/[id] chamada")

  try {
    const { id: agentId } = await params
    
    // 🔒 SEGURANÇA: Autenticar usuário via JWT
    let currentUser
    try {
      currentUser = await requireAuth(request)
    } catch (authError) {
      console.error("❌ Não autorizado:", (authError as Error).message)
      logAccessDenied(undefined, undefined, `/api/user/agents/${agentId} (PUT)`, request, 'Token JWT inválido ou ausente')
      return NextResponse.json(
        { error: "Não autorizado - Usuário não autenticado" },
        { status: 401 }
      )
    }

    const agentData = await request.json()

    console.log("🔄 Atualizando agente:", agentId, "para usuário:", currentUser.id)

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

    // Verificar se o agente pertence ao usuário
    console.log("🔍 Verificando propriedade do agente...")
    const agentResponse = await fetch(
      `${supabaseUrl}/rest/v1/ai_agents?select=*&id=eq.${agentId}&user_id=eq.${currentUser.id}`,
      { headers }
    )

    if (!agentResponse.ok) {
      throw new Error("Erro ao verificar agente")
    }

    const agents = await agentResponse.json()
    if (!agents || agents.length === 0) {
      return NextResponse.json({ error: "Agente não encontrado ou não pertence ao usuário" }, { status: 404 })
    }

    console.log("✅ Agente verificado:", agents[0].name)

    // Preparar dados para atualização - garantir segurança
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

    const secureUpdateData = {
      name: agentData.name,
      identity_description: agentData.identity_description,
      training_prompt: agentData.training_prompt,
      voice_tone: agentData.voice_tone,
      main_function: agentData.main_function,
      temperature: agentData.temperature,
      description: agentData.description,
      status: agentData.status,
      is_default: String(Boolean(agentData.is_default)),
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
      debounce_time: agentData.debounce_time || 1000,
      listening_from_me: String(Boolean(agentData.listening_from_me)),
      stop_bot_from_me: String(Boolean(agentData.stop_bot_from_me)),
      keep_open: String(Boolean(agentData.keep_open)),
      split_messages: String(Boolean(agentData.split_messages)),
      unknown_message: agentData.unknown_message,
      delay_message: agentData.delay_message || 1000,
      expire_time: agentData.expire_time || 600000,
      ignore_jids: `{${ignoreJidsArray.map((jid: string) => `"${jid}"`).join(",")}}`,
      // Funcionalidades opcionais
      transcribe_audio: String(Boolean(agentData.transcribe_audio)),
      understand_images: String(Boolean(agentData.understand_images)),
      voice_response_enabled: String(Boolean(agentData.voice_response_enabled)),
      voice_provider: agentData.voice_provider,
      voice_api_key: agentData.voice_api_key,
      voice_id: agentData.voice_id,
      calendar_integration: String(Boolean(agentData.calendar_integration)),
      calendar_provider: calendarProvider,
      calendar_api_version: calendarVersion,
      calendar_api_url: calendarUrl,
      calendar_api_key: agentData.calendar_api_key,
      calendar_meeting_id: agentData.calendar_meeting_id,
      chatnode_integration: String(Boolean(agentData.chatnode_integration)),
      chatnode_api_key: agentData.chatnode_api_key,
      chatnode_bot_id: agentData.chatnode_bot_id,
      orimon_integration: String(Boolean(agentData.orimon_integration)),
      orimon_api_key: agentData.orimon_api_key,
      orimon_bot_id: agentData.orimon_bot_id,
    }

    // Atualizar agente no banco de dados
    console.log("💾 Atualizando agente no banco de dados...")
    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}&user_id=eq.${currentUser.id}`,
      {
        method: "PATCH",
        headers: {
          ...headers,
          Prefer: "return=representation",
        },
        body: JSON.stringify(secureUpdateData),
      }
    )

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      console.error("❌ Erro ao atualizar agente no banco:", updateResponse.status, errorText)
      throw new Error(`Erro ao atualizar agente no banco: ${updateResponse.status}`)
    }

    const [updatedAgent] = await updateResponse.json()
    console.log("✅ Agente atualizado com sucesso no banco:", updatedAgent.id)

    // Buscar agente atual para obter evolution_bot_id, bot_id e connection info
    console.log("🔍 Buscando agente atual para sincronização...")
    const currentAgentResponse = await fetch(
      `${supabaseUrl}/rest/v1/ai_agents?select=*,whatsapp_connections!ai_agents_whatsapp_connection_id_fkey(instance_name,api_type,id)&id=eq.${agentId}&user_id=eq.${currentUser.id}`,
      { headers }
    )

    if (currentAgentResponse.ok) {
      const currentAgents = await currentAgentResponse.json()
      if (currentAgents && currentAgents.length > 0) {
        const currentAgent = currentAgents[0]
        const apiType = currentAgent.whatsapp_connections?.api_type || "evolution"

        // Atualizar bot Uazapi se existir
        if (apiType === "uazapi" && currentAgent.bot_id) {
          console.log("🤖 [UAZAPI] Atualizando bot Uazapi...")
          try {
            const { updateUazapiBotInDatabase } = await import("@/lib/uazapi-bot-helpers")

            // Preparar dados do bot para atualização
            const botUpdateData: any = {}

            // Atualizar campos básicos do bot
            if (agentData.name) botUpdateData.nome = agentData.name

            // Campos específicos de bot Uazapi (se enviados)
            if (agentData.bot_gatilho) botUpdateData.gatilho = agentData.bot_gatilho
            if (agentData.bot_operador) botUpdateData.operador_gatilho = agentData.bot_operador
            if (agentData.bot_value !== undefined) botUpdateData.value_gatilho = agentData.bot_value
            if (agentData.bot_debounce !== undefined) botUpdateData.debounce = Number(agentData.bot_debounce)
            if (agentData.bot_splitMessage !== undefined) botUpdateData.splitMessage = Number(agentData.bot_splitMessage)
            if (agentData.bot_ignoreJids) {
              // Converter array para string
              if (Array.isArray(agentData.bot_ignoreJids)) {
                botUpdateData.ignoreJids = agentData.bot_ignoreJids.join(",") + ","
              } else {
                botUpdateData.ignoreJids = agentData.bot_ignoreJids
              }
            }
            if (agentData.bot_padrao !== undefined) botUpdateData.padrao = Boolean(agentData.bot_padrao)

            console.log("📝 [UAZAPI] Dados de atualização do bot:", botUpdateData)

            // Atualizar bot no banco
            const updateResult = await updateUazapiBotInDatabase({
              botId: currentAgent.bot_id,
              botData: botUpdateData,
              supabaseUrl,
              supabaseKey,
            })

            if (updateResult.success) {
              console.log("✅ [UAZAPI] Bot atualizado com sucesso")
            } else {
              console.warn("⚠️ [UAZAPI] Erro ao atualizar bot:", updateResult.error)
            }

            // TODO: Se a URL do webhook mudou, atualizar webhook na Uazapi
            // Isso seria feito apenas se agentData.bot_url_api for enviado
            // Por enquanto, apenas atualizamos os dados no banco
          } catch (uazapiError) {
            console.warn("⚠️ [UAZAPI] Erro ao atualizar bot Uazapi:", uazapiError)
          }
        }

        // Atualizar bot na Evolution API se existir (EXATAMENTE igual ao admin)
        if (currentAgent.evolution_bot_id && currentAgent.whatsapp_connections?.instance_name) {
          console.log("🤖 Atualizando bot na Evolution API...")
          try {
            const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
            const evolutionApiUrl = `${baseUrl}/api/integrations/evolution/evolutionBot/update/${currentAgent.evolution_bot_id}/${currentAgent.whatsapp_connections.instance_name}`

            console.log("🔗 URL da Evolution API para update:", evolutionApiUrl)

            // Buscar configuração do N8N para incluir no webhook (igual ao admin)
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
                }
              }
            } catch (n8nError) {
              console.log("⚠️ N8N não configurado para atualização")
            }

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
                }
              }
            } catch (apiKeyError) {
              console.warn("⚠️ Erro ao buscar API key do admin:", apiKeyError)
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

            // Preparar dados para Evolution API (EXATAMENTE igual ao admin)
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
              unknownMessage: agentData.unknown_message || "Desculpe, não entendi sua mensagem.",
              listeningFromMe: Boolean(agentData.listening_from_me),
              stopBotFromMe: Boolean(agentData.stop_bot_from_me),
              keepOpen: Boolean(agentData.keep_open),
              debounceTime: agentData.debounce_time || 10,
              ignoreJids: Array.isArray(agentData.ignore_jids) ? agentData.ignore_jids : ["@g.us"],
              splitMessages: Boolean(agentData.split_messages),
              timePerChar: agentData.time_per_char || 100,
            }

            console.log("📤 Enviando dados de update para Evolution API:", evolutionBotData)

            // Usar mesmo formato de headers que o admin (sem instance_token)
            const updateBotResponse = await fetch(evolutionApiUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
              body: JSON.stringify(evolutionBotData),
            })

            console.log("📥 Resposta do update da Evolution API:", updateBotResponse.status)

            if (updateBotResponse.ok) {
              console.log("✅ Bot atualizado na Evolution API")
            } else {
              const errorText = await updateBotResponse.text()
              console.warn("⚠️ Erro ao atualizar bot na Evolution API:", updateBotResponse.status, errorText)
            }
          } catch (evolutionError) {
            console.warn("⚠️ Erro ao atualizar bot na Evolution API:", evolutionError)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      agent: updatedAgent,
      message: "Agente atualizado com sucesso",
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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  console.log("📡 API: DELETE /api/user/agents/[id] chamada")

  try {
    const { id: agentId } = await params
    
    // 🔒 SEGURANÇA: Autenticar usuário via JWT
    let currentUser
    try {
      currentUser = await requireAuth(request)
    } catch (authError) {
      console.error("❌ Não autorizado:", (authError as Error).message)
      logAccessDenied(undefined, undefined, `/api/user/agents/${agentId} (DELETE)`, request, 'Token JWT inválido ou ausente')
      return NextResponse.json(
        { error: "Não autorizado - Usuário não autenticado" },
        { status: 401 }
      )
    }

    console.log("🗑️ Deletando agente:", agentId, "para usuário:", currentUser.id)

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

    // Buscar agente e verificar se pertence ao usuário
    console.log("🔍 Verificando propriedade do agente...")
    const agentResponse = await fetch(
      `${supabaseUrl}/rest/v1/ai_agents?select=*,whatsapp_connections!ai_agents_whatsapp_connection_id_fkey(instance_name,instance_token)&id=eq.${agentId}&user_id=eq.${currentUser.id}`,
      { headers }
    )

    if (!agentResponse.ok) {
      throw new Error("Erro ao buscar agente")
    }

    const agents = await agentResponse.json()
    if (!agents || agents.length === 0) {
      return NextResponse.json({ error: "Agente não encontrado ou não pertence ao usuário" }, { status: 404 })
    }

    const agent = agents[0]
    console.log("✅ Agente encontrado e verificado:", agent.name)

    // Deletar bot da Evolution API se existir
    if (agent.evolution_bot_id && agent.whatsapp_connections?.instance_name) {
      console.log("🤖 Deletando bot da Evolution API...")
      try {
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
        const evolutionApiUrl = `${baseUrl}/api/integrations/evolution/evolutionBot/delete/${agent.evolution_bot_id}/${agent.whatsapp_connections.instance_name}`

        console.log("🔗 URL da Evolution API para delete:", evolutionApiUrl)

        const deleteBotResponse = await fetch(evolutionApiUrl, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            apikey: agent.whatsapp_connections.instance_token,
          },
        })

        console.log("📥 Resposta do delete da Evolution API:", deleteBotResponse.status)

        if (deleteBotResponse.ok) {
          console.log("✅ Bot deletado da Evolution API")
        } else {
          const errorText = await deleteBotResponse.text()
          console.warn(
            "⚠️ Erro ao deletar bot da Evolution API:",
            deleteBotResponse.status,
            errorText
          )
        }
      } catch (evolutionError) {
        console.warn("⚠️ Erro ao deletar bot da Evolution API:", evolutionError)
        // Continuar com a deleção do banco mesmo se Evolution API falhar
      }
    }

    // Deletar bot Uazapi e webhook se existir
    if (agent.bot_id) {
      console.log(`🗑️ [DELETE AGENT USER] Agente tem bot_id: ${agent.bot_id}, iniciando deleção...`)
      try {
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
        const deleteBotUrl = `${baseUrl}/api/bots/${agent.bot_id}`

        console.log(`🔗 [DELETE AGENT USER] URL do bot para delete: ${deleteBotUrl}`)

        const deleteBotResponse = await fetch(deleteBotUrl, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Cookie": request.headers.get("cookie") || "",
          },
        })

        console.log(`📥 [DELETE AGENT USER] Resposta do delete do bot: ${deleteBotResponse.status}`)

        if (deleteBotResponse.ok) {
          console.log("✅ [DELETE AGENT USER] Bot e webhook deletados com sucesso")
        } else {
          const errorText = await deleteBotResponse.text()
          console.warn(
            `⚠️ [DELETE AGENT USER] Erro ao deletar bot: ${deleteBotResponse.status} - ${errorText}`
          )
        }
      } catch (botError: any) {
        console.warn(
          `⚠️ [DELETE AGENT USER] Erro ao deletar bot: ${botError.message}`
        )
      }
    } else {
      console.log("ℹ️ [DELETE AGENT USER] Agente não possui bot_id, pulando deleção de bot/webhook")
    }

    // Deletar agente do banco
    console.log("💾 Deletando agente do banco de dados...")
    const deleteResponse = await fetch(
      `${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}&user_id=eq.${currentUser.id}`,
      {
        method: "DELETE",
        headers,
      }
    )

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text()
      console.error("❌ Erro ao deletar agente do banco:", deleteResponse.status, errorText)
      throw new Error(`Erro ao deletar agente do banco: ${deleteResponse.status}`)
    }

    console.log("✅ Agente deletado com sucesso do banco")

    return NextResponse.json({
      success: true,
      message: "Agente deletado com sucesso",
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
