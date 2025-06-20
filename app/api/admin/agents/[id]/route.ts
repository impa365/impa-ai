import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const agentId = params.id
    const body = await request.json()

    // Verificar variáveis de ambiente em runtime
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 })
    }

    // 1. Atualizar no banco primeiro
    const response = await fetch(`${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Accept-Profile": "impaai",
        "Content-Profile": "impaai",
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: `Erro ao atualizar agente: ${errorData.message || response.statusText}` },
        { status: response.status },
      )
    }

    const updatedAgent = await response.json()
    const agent = updatedAgent[0] || updatedAgent

    // 2. Se tem evolution_bot_id, sincronizar com Evolution API
    if (agent.evolution_bot_id && agent.whatsapp_connection_id) {
      try {
        console.log("🔄 Sincronizando agente atualizado com Evolution API...")

        // Buscar dados da conexão WhatsApp
        const connectionResponse = await fetch(
          `${supabaseUrl}/rest/v1/whatsapp_connections?id=eq.${agent.whatsapp_connection_id}`,
          {
            headers: {
              "Accept-Profile": "impaai",
              "Content-Profile": "impaai",
              Authorization: `Bearer ${supabaseKey}`,
            },
          },
        )

        if (!connectionResponse.ok) {
          console.error("❌ Erro ao buscar conexão WhatsApp")
          return NextResponse.json(agent) // Retorna sem sincronizar
        }

        const connections = await connectionResponse.json()
        const connection = connections[0]

        if (!connection) {
          console.error("❌ Conexão WhatsApp não encontrada")
          return NextResponse.json(agent)
        }

        // Buscar configurações da Evolution API
        const evolutionResponse = await fetch(
          `${supabaseUrl}/rest/v1/integrations?type=eq.evolution_api&is_active=eq.true`,
          {
            headers: {
              "Accept-Profile": "impaai",
              "Content-Profile": "impaai",
              Authorization: `Bearer ${supabaseKey}`,
            },
          },
        )

        if (!evolutionResponse.ok) {
          console.error("❌ Erro ao buscar configuração Evolution API")
          return NextResponse.json(agent)
        }

        const evolutionIntegrations = await evolutionResponse.json()
        const evolutionConfig = evolutionIntegrations[0]

        if (!evolutionConfig) {
          console.error("❌ Evolution API não configurada")
          return NextResponse.json(agent)
        }

        const { apiUrl, apiKey } = evolutionConfig.config

        // Buscar configuração N8N para webhook
        const n8nResponse = await fetch(`${supabaseUrl}/rest/v1/integrations?type=eq.n8n&is_active=eq.true`, {
          headers: {
            "Accept-Profile": "impaai",
            "Content-Profile": "impaai",
            Authorization: `Bearer ${supabaseKey}`,
          },
        })

        let webhookUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/agents/webhook?agentId=${agentId}`
        let webhookApiKey = undefined

        if (n8nResponse.ok) {
          const n8nIntegrations = await n8nResponse.json()
          const n8nConfig = n8nIntegrations[0]

          if (n8nConfig?.config?.flowUrl) {
            webhookUrl = `${n8nConfig.config.flowUrl}?agentId=${agentId}`
            if (n8nConfig.config.apiKey) {
              webhookApiKey = n8nConfig.config.apiKey
            }
          }
        }

        // Processar ignore_jids se for string
        let ignoreJids = agent.ignore_jids || ["@g.us"]
        if (typeof ignoreJids === "string") {
          try {
            ignoreJids = JSON.parse(ignoreJids)
          } catch (e) {
            ignoreJids = ["@g.us"]
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
          unknownMessage: agent.unknown_message || "Desculpe, não entendi sua mensagem.",
          listeningFromMe: Boolean(agent.listening_from_me),
          stopBotFromMe: Boolean(agent.stop_bot_from_me),
          keepOpen: Boolean(agent.keep_open),
          debounceTime: (agent.debounce_time || 10) * 1000, // converter segundos para ms
          ignoreJids: ignoreJids,
          splitMessages: Boolean(agent.split_messages),
          timePerChar: agent.time_per_char || 100,
          description: agent.name,
        }

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
          },
        )

        if (evolutionUpdateResponse.ok) {
          console.log("✅ Bot atualizado com sucesso na Evolution API")
        } else {
          const errorText = await evolutionUpdateResponse.text()
          console.error("❌ Erro ao atualizar bot na Evolution API:", errorText)
        }
      } catch (evolutionError) {
        console.error("❌ Erro na sincronização com Evolution API:", evolutionError)
        // Não falha a operação, apenas loga o erro
      }
    }

    return NextResponse.json(agent)
  } catch (error) {
    console.error("❌ Erro geral ao atualizar agente:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const agentId = params.id

    // Verificar variáveis de ambiente em runtime
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 })
    }

    // Fazer requisição direta para a API REST do Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Accept-Profile": "impaai",
        "Content-Profile": "impaai",
        Authorization: `Bearer ${supabaseKey}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: `Erro ao deletar agente: ${errorData.message || response.statusText}` },
        { status: response.status },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
