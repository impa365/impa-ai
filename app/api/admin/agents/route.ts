import { NextResponse } from "next/server"

export async function GET() {
  console.log("📡 API: /api/admin/agents chamada")

  try {
    // Usar as variáveis que já existem no projeto
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Variáveis de ambiente não encontradas:", {
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey,
      })
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

    console.log("✅ Dados processados com sucesso")
    return NextResponse.json({
      success: true,
      agents: agents || [],
      users: users || [],
      connections: connections || [],
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

    // Primeiro, buscar a conexão WhatsApp para obter o instance_name
    console.log("🔍 Buscando dados da conexão WhatsApp...")
    const connectionResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?select=*&id=eq.${agentData.whatsapp_connection_id}`,
      { headers },
    )

    if (!connectionResponse.ok) {
      throw new Error("Erro ao buscar conexão WhatsApp")
    }

    const connections = await connectionResponse.json()
    if (!connections || connections.length === 0) {
      throw new Error("Conexão WhatsApp não encontrada")
    }

    const connection = connections[0]
    console.log("✅ Conexão encontrada:", connection.connection_name)

    // PRIMEIRO: Criar agente no banco para obter o ID real
    console.log("💾 Criando agente no banco de dados primeiro...")

    // Preparar dados para inserção no banco - CORRIGIR formatação do ignore_jids
    const ignoreJidsArray = Array.isArray(agentData.ignore_jids) ? agentData.ignore_jids : ["@g.us"]

    const dbAgentData = {
      ...agentData,
      evolution_bot_id: null, // Será preenchido depois
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
    }

    const createAgentResponse = await fetch(`${supabaseUrl}/rest/v1/ai_agents`, {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "return=representation",
      },
      body: JSON.stringify(dbAgentData),
    })

    if (!createAgentResponse.ok) {
      const errorText = await createAgentResponse.text()
      console.error("❌ Erro ao criar agente no banco:", createAgentResponse.status, errorText)
      throw new Error(`Erro ao criar agente no banco: ${createAgentResponse.status}`)
    }

    const newAgentArray = await createAgentResponse.json()
    const newAgent = newAgentArray[0]
    const agentId = newAgent.id

    console.log("✅ Agente criado no banco com ID:", agentId)

    // SEGUNDO: Buscar configuração do N8N para incluir no webhook
    console.log("🔍 Buscando configuração do N8N...")
    let n8nWebhookUrl = null
    let n8nIntegrations = null
    try {
      const n8nResponse = await fetch(`${supabaseUrl}/rest/v1/integrations?select=*&type=eq.n8n&is_active=eq.true`, {
        headers,
      })

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

    // TERCEIRO: Criar bot na Evolution API usando o ID real do agente
    let evolutionBotId = null
    if (connection.instance_name) {
      console.log("🤖 Criando bot na Evolution API com agentId:", agentId)
      try {
        // Preparar dados para Evolution API no formato correto
        const evolutionBotData = {
          enabled: true,
          description: agentData.name,
          // CORRIGIDO: Usar o ID real do agente
          apiUrl: n8nWebhookUrl
            ? `${n8nWebhookUrl}?agentId=${agentId}`
            : `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/agents/webhook?agentId=${agentId}`,
          apiKey: n8nWebhookUrl && n8nIntegrations?.[0]?.api_key ? n8nIntegrations[0].api_key : undefined,
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

        const baseUrl = process.env.NEXTAUTH_URL || `http://localhost:${process.env.PORT || 3000}`
        const createBotResponse = await fetch(
          `${baseUrl}/api/integrations/evolution/evolutionBot/create/${connection.instance_name}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(evolutionBotData),
          },
        )

        if (createBotResponse.ok) {
          const botResult = await createBotResponse.json()
          evolutionBotId = botResult.id
          console.log("✅ Bot criado na Evolution API:", evolutionBotId)

          // QUARTO: Atualizar agente no banco com o evolution_bot_id
          console.log("🔄 Atualizando agente com evolution_bot_id...")
          const updateResponse = await fetch(`${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({ evolution_bot_id: evolutionBotId }),
          })

          if (!updateResponse.ok) {
            console.warn("⚠️ Erro ao atualizar evolution_bot_id, mas agente foi criado")
          } else {
            console.log("✅ evolution_bot_id atualizado no banco")
          }
        } else {
          const errorText = await createBotResponse.text()
          console.warn("⚠️ Falha ao criar bot na Evolution API:", errorText)
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

    // Buscar agente atual para obter evolution_bot_id e connection info
    const currentAgentResponse = await fetch(
      `${supabaseUrl}/rest/v1/ai_agents?select=*,whatsapp_connections!ai_agents_whatsapp_connection_id_fkey(instance_name)&id=eq.${id}`,
      { headers },
    )

    if (currentAgentResponse.ok) {
      const currentAgents = await currentAgentResponse.json()
      if (currentAgents && currentAgents.length > 0) {
        const currentAgent = currentAgents[0]

        // Atualizar bot na Evolution API se existir
        if (currentAgent.evolution_bot_id && currentAgent.whatsapp_connections?.instance_name) {
          console.log("🤖 Atualizando bot na Evolution API...")
          try {
            // Buscar configuração do N8N para incluir no webhook
            let n8nWebhookUrl = null
            let n8nIntegrations = null
            try {
              const n8nResponse = await fetch(
                `${supabaseUrl}/rest/v1/integrations?select=*&type=eq.n8n&is_active=eq.true`,
                { headers },
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

            const evolutionBotData = {
              enabled: true,
              description: agentData.name,
              // CORRIGIDO: Usar o ID real do agente
              apiUrl: n8nWebhookUrl
                ? `${n8nWebhookUrl}?agentId=${id}`
                : `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/agents/webhook?agentId=${id}`,
              apiKey: n8nWebhookUrl && n8nIntegrations?.[0]?.api_key ? n8nIntegrations[0].api_key : undefined,
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

            const baseUrl = process.env.NEXTAUTH_URL || `http://localhost:${process.env.PORT || 3000}`
            await fetch(
              `${baseUrl}/api/integrations/evolution/evolutionBot/update/${currentAgent.evolution_bot_id}/${currentAgent.whatsapp_connections.instance_name}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(evolutionBotData),
              },
            )
            console.log("✅ Bot atualizado na Evolution API")
          } catch (evolutionError) {
            console.warn("⚠️ Erro ao atualizar bot na Evolution API:", evolutionError)
          }
        }
      }
    }

    // Preparar dados para atualização no banco - CORRIGIR formatação do ignore_jids
    const ignoreJidsArray = Array.isArray(agentData.ignore_jids) ? agentData.ignore_jids : ["@g.us"]

    const dbAgentData = {
      ...agentData,
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
    }

    // Atualizar agente no banco
    const response = await fetch(`${supabaseUrl}/rest/v1/ai_agents?id=eq.${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(dbAgentData),
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

    // Buscar agente para obter evolution_bot_id antes de deletar
    const agentResponse = await fetch(
      `${supabaseUrl}/rest/v1/ai_agents?select=*,whatsapp_connections!ai_agents_whatsapp_connection_id_fkey(instance_name)&id=eq.${agentId}`,
      { headers },
    )

    if (agentResponse.ok) {
      const agents = await agentResponse.json()
      if (agents && agents.length > 0) {
        const agent = agents[0]

        // Deletar bot da Evolution API se existir
        if (agent.evolution_bot_id && agent.whatsapp_connections?.instance_name) {
          console.log("🤖 Deletando bot da Evolution API...")
          try {
            const baseUrl = process.env.NEXTAUTH_URL || `http://localhost:${process.env.PORT || 3000}`
            await fetch(
              `${baseUrl}/api/integrations/evolution/evolutionBot/delete/${agent.evolution_bot_id}/${agent.whatsapp_connections.instance_name}`,
              {
                method: "DELETE",
              },
            )
            console.log("✅ Bot deletado da Evolution API")
          } catch (evolutionError) {
            console.warn("⚠️ Erro ao deletar bot da Evolution API:", evolutionError)
          }
        }
      }
    }

    // Deletar agente do banco
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
