import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  console.log("📡 API: /api/admin/agents chamada")

  try {
    // Verificar variáveis de ambiente em runtime
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Variáveis de ambiente não encontradas:", {
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey,
      })
      return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 })
    }

    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Buscar agentes com relacionamentos
    const { data: agents, error: agentsError } = await supabase
      .from("ai_agents")
      .select(`
        *,
        user_profiles!ai_agents_user_id_fkey (
          id,
          full_name,
          email
        ),
        whatsapp_connections!ai_agents_whatsapp_connection_id_fkey (
          id,
          connection_name,
          instance_name,
          status
        )
      `)
      .order("created_at", { ascending: false })

    if (agentsError) {
      console.error("❌ Erro ao buscar agentes:", agentsError)
      return NextResponse.json({ error: "Erro ao buscar agentes" }, { status: 500 })
    }

    console.log("✅ Agentes encontrados:", agents.length)

    // Buscar usuários
    const { data: users, error: usersError } = await supabase
      .from("user_profiles")
      .select("id, full_name, email")
      .order("full_name", { ascending: true })

    if (usersError) {
      console.error("❌ Erro ao buscar usuários:", usersError)
      return NextResponse.json({ error: "Erro ao buscar usuários" }, { status: 500 })
    }

    console.log("✅ Usuários encontrados:", users.length)

    // Buscar conexões WhatsApp
    const { data: connections, error: connectionsError } = await supabase
      .from("whatsapp_connections")
      .select(`
        id,
        connection_name,
        instance_name,
        status,
        user_id,
        phone_number,
        user_profiles!whatsapp_connections_user_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .order("created_at", { ascending: false })

    if (connectionsError) {
      console.error("❌ Erro ao buscar conexões:", connectionsError)
      return NextResponse.json({ error: "Erro ao buscar conexões" }, { status: 500 })
    }

    console.log("✅ Conexões encontradas:", connections.length)

    console.log("✅ Dados processados com sucesso")
    return NextResponse.json({
      success: true,
      agents: agents || [],
      users: users || [],
      connections: connections || [],
    })
  } catch (error) {
    console.error("❌ Erro geral:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.log("📡 API: POST /api/admin/agents chamada")

  try {
    const agentData = await request.json()
    console.log("📝 Dados do agente recebidos:", {
      name: agentData.name,
      user_id: agentData.user_id,
    })

    // Verificar variáveis de ambiente em runtime
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Variáveis de ambiente não encontradas:", {
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey,
      })
      throw new Error("Configuração do servidor incompleta")
    }

    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Criar agente
    const { data: agent, error } = await supabase.from("ai_agents").insert([agentData]).select().single()

    if (error) {
      console.error("❌ Erro ao criar agente:", error)
      return NextResponse.json({ error: "Erro ao criar agente" }, { status: 500 })
    }

    console.log("✅ Agente criado com sucesso:", agent.id)

    // Primeiro, buscar a conexão WhatsApp para obter o instance_name
    console.log("🔍 Buscando dados da conexão WhatsApp...")
    const { data: connections, error: connectionError } = await supabase
      .from("whatsapp_connections")
      .select("*")
      .eq("id", agentData.whatsapp_connection_id)
      .single()

    if (connectionError) {
      console.error("❌ Erro ao buscar conexão WhatsApp:", connectionError)
      throw new Error("Erro ao buscar conexão WhatsApp")
    }

    const connection = connections
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

    const { data: newAgent, error: createAgentError } = await supabase
      .from("ai_agents")
      .insert([dbAgentData])
      .select()
      .single()

    if (createAgentError) {
      console.error("❌ Erro ao criar agente no banco:", createAgentError)
      throw new Error(`Erro ao criar agente no banco: ${createAgentError.message}`)
    }

    const agentId = newAgent.id
    console.log("✅ Agente criado no banco com ID:", agentId)

    // SEGUNDO: Buscar configuração do N8N para incluir no webhook
    console.log("🔍 Buscando configuração do N8N...")
    let n8nWebhookUrl = null
    let n8nIntegrations = null
    try {
      const { data: integrations, error: n8nError } = await supabase
        .from("integrations")
        .select("*")
        .eq("type", "n8n")
        .eq("is_active", true)
        .single()

      if (n8nError) {
        console.error("❌ Erro ao buscar configuração do N8N:", n8nError)
        throw new Error("Erro ao buscar configuração do N8N")
      }

      n8nIntegrations = integrations
      if (n8nIntegrations && n8nIntegrations.config) {
        const n8nConfig =
          typeof n8nIntegrations.config === "string" ? JSON.parse(n8nIntegrations.config) : n8nIntegrations.config
        n8nWebhookUrl = n8nConfig.flowUrl
        console.log("✅ N8N webhook encontrado")
      }
    } catch (n8nError) {
      console.log("⚠️ N8N não configurado, continuando sem webhook N8N")
    }

    // TERCEIRO: Criar bot na Evolution API usando o ID real do agente
    let evolutionBotId = null
    if (connection.instance_name) {
      console.log("🤖 Criando bot na Evolution API com agentId:", agentId)
      try {
        // PROBLEMA IDENTIFICADO: Usar URL absoluta ao invés de relativa no Docker
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
        const evolutionApiUrl = `${baseUrl}/api/integrations/evolution/evolutionBot/create/${connection.instance_name}`

        console.log("🔗 URL da Evolution API:", evolutionApiUrl)

        // Preparar dados para Evolution API no formato correto
        const evolutionBotData = {
          enabled: true,
          description: agentData.name,
          // CORRIGIDO: Usar o ID real do agente
          apiUrl: n8nWebhookUrl
            ? `${n8nWebhookUrl}?agentId=${agentId}`
            : `${baseUrl}/api/agents/webhook?agentId=${agentId}`,
          apiKey: n8nWebhookUrl && n8nIntegrations?.api_key ? n8nIntegrations.api_key : undefined,
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

        console.log("📤 Enviando dados para Evolution API:", evolutionBotData)

        const { data: botResult, error: createBotError } = await supabase
          .from("evolution_bots")
          .insert([evolutionBotData])
          .select()
          .single()

        if (createBotError) {
          console.error("❌ Erro ao criar bot na Evolution API:", createBotError)
          throw new Error(`Erro ao criar bot na Evolution API: ${createBotError.message}`)
        }

        evolutionBotId = botResult.id
        console.log("✅ Bot criado na Evolution API:", evolutionBotId)

        // QUARTO: Atualizar agente no banco com o evolution_bot_id
        console.log("🔄 Atualizando agente com evolution_bot_id...")
        const { error: updateError } = await supabase
          .from("ai_agents")
          .update({ evolution_bot_id: evolutionBotId })
          .eq("id", agentId)

        if (updateError) {
          console.warn("⚠️ Erro ao atualizar evolution_bot_id, mas agente foi criado", updateError)
        } else {
          console.log("✅ evolution_bot_id atualizado no banco")
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
  } catch (error) {
    console.error("❌ Erro ao criar agente:", error)
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

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Buscar agente atual para obter evolution_bot_id e connection info
    const { data: currentAgents, error: currentAgentError } = await supabase
      .from("ai_agents")
      .select(`
        *,
        whatsapp_connections!ai_agents_whatsapp_connection_id_fkey (
          instance_name
        )
      `)
      .eq("id", id)
      .single()

    if (currentAgentError) {
      console.error("❌ Erro ao buscar agente atual:", currentAgentError)
      return NextResponse.json({ error: "Erro ao buscar agente atual" }, { status: 500 })
    }

    const currentAgent = currentAgents

    // Atualizar bot na Evolution API se existir
    if (currentAgent.evolution_bot_id && currentAgent.whatsapp_connections?.instance_name) {
      console.log("🤖 Atualizando bot na Evolution API...")
      try {
        // PROBLEMA IDENTIFICADO: Usar URL absoluta ao invés de relativa no Docker
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
        const evolutionApiUrl = `${baseUrl}/api/integrations/evolution/evolutionBot/update/${currentAgent.evolution_bot_id}/${currentAgent.whatsapp_connections.instance_name}`

        console.log("🔗 URL da Evolution API para update:", evolutionApiUrl)

        // Buscar configuração do N8N para incluir no webhook
        let n8nWebhookUrl = null
        let n8nIntegrations = null
        try {
          const { data: integrations, error: n8nError } = await supabase
            .from("integrations")
            .select("*")
            .eq("type", "n8n")
            .eq("is_active", true)
            .single()

          if (n8nError) {
            console.error("❌ Erro ao buscar configuração do N8N:", n8nError)
            throw new Error("Erro ao buscar configuração do N8N")
          }

          n8nIntegrations = integrations
          if (n8nIntegrations && n8nIntegrations.config) {
            const n8nConfig =
              typeof n8nIntegrations.config === "string" ? JSON.parse(n8nIntegrations.config) : n8nIntegrations.config
            n8nWebhookUrl = n8nConfig.flowUrl
          }
        } catch (n8nError) {
          console.log("⚠️ N8N não configurado para atualização")
        }

        const evolutionBotData = {
          enabled: true,
          description: agentData.name,
          // CORRIGIDO: Usar o ID real do agente
          apiUrl: n8nWebhookUrl ? `${n8nWebhookUrl}?agentId=${id}` : `${baseUrl}/api/agents/webhook?agentId=${id}`,
          apiKey: n8nWebhookUrl && n8nIntegrations?.api_key ? n8nIntegrations.api_key : undefined,
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

        const { error: updateBotError } = await supabase
          .from("evolution_bots")
          .update(evolutionBotData)
          .eq("id", currentAgent.evolution_bot_id)

        if (updateBotError) {
          console.error("❌ Erro ao atualizar bot na Evolution API:", updateBotError)
          return NextResponse.json({ error: "Erro ao atualizar bot na Evolution API" }, { status: 500 })
        }

        console.log("✅ Bot atualizado na Evolution API")
      } catch (evolutionError) {
        console.warn("⚠️ Erro ao atualizar bot na Evolution API:", evolutionError)
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
    const { error: updateAgentError } = await supabase.from("ai_agents").update(dbAgentData).eq("id", id)

    if (updateAgentError) {
      console.error("❌ Erro ao atualizar agente:", updateAgentError)
      return NextResponse.json({ error: "Erro ao atualizar agente" }, { status: 500 })
    }

    console.log("✅ Agente atualizado com sucesso")

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("❌ Erro ao atualizar agente:", error)
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

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Buscar agente para obter evolution_bot_id antes de deletar
    const { data: agents, error: agentError } = await supabase
      .from("ai_agents")
      .select(`
        *,
        whatsapp_connections!ai_agents_whatsapp_connection_id_fkey (
          instance_name
        )
      `)
      .eq("id", agentId)
      .single()

    if (agentError) {
      console.error("❌ Erro ao buscar agente:", agentError)
      return NextResponse.json({ error: "Erro ao buscar agente" }, { status: 500 })
    }

    const agent = agents

    // Deletar bot da Evolution API se existir
    if (agent.evolution_bot_id && agent.whatsapp_connections?.instance_name) {
      console.log("🤖 Deletando bot da Evolution API...")
      try {
        // PROBLEMA IDENTIFICADO: Usar URL absoluta ao invés de relativa no Docker
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
        const evolutionApiUrl = `${baseUrl}/api/integrations/evolution/evolutionBot/delete/${agent.evolution_bot_id}/${agent.whatsapp_connections.instance_name}`

        console.log("🔗 URL da Evolution API para delete:", evolutionApiUrl)

        const { error: deleteBotError } = await supabase
          .from("evolution_bots")
          .delete()
          .eq("id", agent.evolution_bot_id)

        if (deleteBotError) {
          console.error("❌ Erro ao deletar bot da Evolution API:", deleteBotError)
          return NextResponse.json({ error: "Erro ao deletar bot da Evolution API" }, { status: 500 })
        }

        console.log("✅ Bot deletado da Evolution API")
      } catch (evolutionError) {
        console.warn("⚠️ Erro ao deletar bot da Evolution API:", evolutionError)
      }
    }

    // Deletar agente do banco
    const { error: deleteAgentError } = await supabase.from("ai_agents").delete().eq("id", agentId)

    if (deleteAgentError) {
      console.error("❌ Erro ao deletar agente:", deleteAgentError)
      return NextResponse.json({ error: "Erro ao deletar agente" }, { status: 500 })
    }

    console.log("✅ Agente deletado com sucesso")

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("❌ Erro ao deletar agente:", error)
    return NextResponse.json(
      {
        error: "Erro ao deletar agente",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
