import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { createEvolutionBot, deleteEvolutionBot } from "@/lib/evolution-bot-api"

// GET - Listar agentes do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 })
    }

    const { data: agents, error } = await supabase
      .from("ai_agents")
      .select(`
        *,
        whatsapp_connections!inner(
          id,
          connection_name,
          instance_name,
          status
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar agentes:", error)
      return NextResponse.json({ error: "Erro ao buscar agentes" }, { status: 500 })
    }

    return NextResponse.json({ agents })
  } catch (error) {
    console.error("Erro na API de agentes:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// POST - Criar novo agente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      whatsappConnectionId,
      name,
      description,
      prompt,
      tone,
      mainFunction,
      temperature,
      transcribeAudio,
      understandImages,
      voiceResponse,
      voiceProvider,
      voiceApiKey,
      calendarIntegration,
      calendarApiKey,
      triggerType,
      triggerOperator,
      triggerValue,
      keywordFinish,
      unknownMessage,
      delayMessage,
      listeningFromMe,
      stopBotFromMe,
      keepOpen,
      debounceTime,
      ignoreGroups,
      splitMessages,
      timePerChar,
      expireTime,
      isDefault,
    } = body

    // Validações básicas
    if (!userId || !whatsappConnectionId || !name || !prompt) {
      return NextResponse.json({ error: "Campos obrigatórios não preenchidos" }, { status: 400 })
    }

    // Verificar se a conexão WhatsApp existe e pertence ao usuário
    const { data: connection, error: connectionError } = await supabase
      .from("whatsapp_connections")
      .select("*")
      .eq("id", whatsappConnectionId)
      .eq("user_id", userId)
      .single()

    if (connectionError || !connection) {
      return NextResponse.json({ error: "Conexão WhatsApp não encontrada" }, { status: 404 })
    }

    // Verificar limites do usuário
    const { data: userSettings } = await supabase
      .from("user_agent_settings")
      .select("max_agents")
      .eq("user_id", userId)
      .single()

    const { data: globalSettings } = await supabase
      .from("global_agent_settings")
      .select("setting_value")
      .eq("setting_key", "default_max_agents")
      .single()

    const maxAgents = userSettings?.max_agents || Number.parseInt(globalSettings?.setting_value || "3")

    const { count: currentAgents } = await supabase
      .from("ai_agents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    if ((currentAgents || 0) >= maxAgents) {
      return NextResponse.json({ error: `Limite de ${maxAgents} agentes atingido` }, { status: 400 })
    }

    // Se for agente padrão, remover o padrão atual da conexão
    if (isDefault) {
      await supabase
        .from("ai_agents")
        .update({ is_default: false })
        .eq("whatsapp_connection_id", whatsappConnectionId)
        .eq("is_default", true)
    }

    // Criar agente no banco de dados primeiro
    const { data: newAgent, error: agentError } = await supabase
      .from("ai_agents")
      .insert([
        {
          user_id: userId,
          whatsapp_connection_id: whatsappConnectionId,
          name,
          description,
          prompt,
          tone,
          main_function: mainFunction,
          temperature,
          transcribe_audio: transcribeAudio,
          understand_images: understandImages,
          voice_response: voiceResponse,
          voice_provider: voiceProvider,
          voice_api_key: voiceApiKey,
          calendar_integration: calendarIntegration,
          calendar_api_key: calendarApiKey,
          trigger_type: triggerType,
          trigger_operator: triggerOperator,
          trigger_value: triggerValue,
          keyword_finish: keywordFinish,
          unknown_message: unknownMessage,
          delay_message: delayMessage,
          listening_from_me: listeningFromMe,
          stop_bot_from_me: stopBotFromMe,
          keep_open: keepOpen,
          debounce_time: debounceTime,
          ignore_groups: ignoreGroups,
          split_messages: splitMessages,
          time_per_char: timePerChar,
          expire_time: expireTime,
          is_default: isDefault,
          status: "inactive",
        },
      ])
      .select()
      .single()

    if (agentError || !newAgent) {
      console.error("Erro ao criar agente:", agentError)
      return NextResponse.json({ error: "Erro ao criar agente" }, { status: 500 })
    }

    // Criar bot na Evolution API
    const evolutionBotConfig = {
      enabled: false, // Iniciar desabilitado
      description: name,
      apiUrl: "", // Será preenchido pela função
      apiKey: "",
      triggerType: triggerType as "all" | "keyword",
      triggerOperator: triggerOperator as any,
      triggerValue: triggerValue || "",
      expire: expireTime,
      keywordFinish,
      delayMessage,
      unknownMessage,
      listeningFromMe,
      stopBotFromMe,
      keepOpen,
      debounceTime,
      ignoreJids: ignoreGroups ? ["@g.us"] : [],
      splitMessages,
      timePerChar,
    }

    const evolutionResult = await createEvolutionBot(connection.instance_name, newAgent.id, evolutionBotConfig)

    if (evolutionResult.success && evolutionResult.data) {
      // Atualizar agente com o ID do bot Evolution
      await supabase.from("ai_agents").update({ evolution_bot_id: evolutionResult.data.id }).eq("id", newAgent.id)

      return NextResponse.json({
        success: true,
        agent: { ...newAgent, evolution_bot_id: evolutionResult.data.id },
      })
    } else {
      // Se falhou na Evolution API, deletar o agente do banco
      await supabase.from("ai_agents").delete().eq("id", newAgent.id)

      return NextResponse.json(
        { error: evolutionResult.error || "Erro ao criar bot na Evolution API" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Erro na API de criação de agentes:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// DELETE - Deletar agente
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get("agentId")
    const userId = searchParams.get("userId")

    if (!agentId || !userId) {
      return NextResponse.json({ error: "agentId e userId são obrigatórios" }, { status: 400 })
    }

    // Buscar agente com conexão
    const { data: agent, error: agentError } = await supabase
      .from("ai_agents")
      .select(`
        *,
        whatsapp_connections!inner(instance_name)
      `)
      .eq("id", agentId)
      .eq("user_id", userId)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    // Deletar bot da Evolution API se existir
    if (agent.evolution_bot_id && agent.whatsapp_connections?.instance_name) {
      await deleteEvolutionBot(agent.whatsapp_connections.instance_name, agent.evolution_bot_id)
    }

    // Deletar agente do banco
    const { error: deleteError } = await supabase.from("ai_agents").delete().eq("id", agentId).eq("user_id", userId)

    if (deleteError) {
      console.error("Erro ao deletar agente:", deleteError)
      return NextResponse.json({ error: "Erro ao deletar agente" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro na API de deleção de agentes:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
