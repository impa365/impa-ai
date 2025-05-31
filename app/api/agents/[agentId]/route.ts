import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { updateEvolutionBot } from "@/lib/evolution-bot-api"

// GET - Buscar agente específico
export async function GET(request: NextRequest, { params }: { params: { agentId: string } }) {
  try {
    const { agentId } = params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 })
    }

    const { data: agent, error } = await supabase
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
      .eq("id", agentId)
      .eq("user_id", userId)
      .single()

    if (error || !agent) {
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ agent })
  } catch (error) {
    console.error("Erro na API de busca de agente:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PUT - Atualizar agente
export async function PUT(request: NextRequest, { params }: { params: { agentId: string } }) {
  try {
    const { agentId } = params
    const body = await request.json()
    const { userId, ...updateData } = body

    if (!userId) {
      return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 })
    }

    // Buscar agente atual
    const { data: currentAgent, error: fetchError } = await supabase
      .from("ai_agents")
      .select(`
        *,
        whatsapp_connections!inner(instance_name)
      `)
      .eq("id", agentId)
      .eq("user_id", userId)
      .single()

    if (fetchError || !currentAgent) {
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    // Se for agente padrão, remover o padrão atual da conexão
    if (updateData.isDefault && !currentAgent.is_default) {
      await supabase
        .from("ai_agents")
        .update({ is_default: false })
        .eq("whatsapp_connection_id", currentAgent.whatsapp_connection_id)
        .eq("is_default", true)
        .neq("id", agentId)
    }

    // Atualizar agente no banco
    const { data: updatedAgent, error: updateError } = await supabase
      .from("ai_agents")
      .update({
        name: updateData.name,
        description: updateData.description,
        prompt: updateData.prompt,
        tone: updateData.tone,
        main_function: updateData.mainFunction,
        temperature: updateData.temperature,
        transcribe_audio: updateData.transcribeAudio,
        understand_images: updateData.understandImages,
        voice_response: updateData.voiceResponse,
        voice_provider: updateData.voiceProvider,
        voice_api_key: updateData.voiceApiKey,
        calendar_integration: updateData.calendarIntegration,
        calendar_api_key: updateData.calendarApiKey,
        trigger_type: updateData.triggerType,
        trigger_operator: updateData.triggerOperator,
        trigger_value: updateData.triggerValue,
        keyword_finish: updateData.keywordFinish,
        unknown_message: updateData.unknownMessage,
        delay_message: updateData.delayMessage,
        listening_from_me: updateData.listeningFromMe,
        stop_bot_from_me: updateData.stopBotFromMe,
        keep_open: updateData.keepOpen,
        debounce_time: updateData.debounceTime,
        ignore_groups: updateData.ignoreGroups,
        split_messages: updateData.splitMessages,
        time_per_char: updateData.timePerChar,
        expire_time: updateData.expireTime,
        is_default: updateData.isDefault,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agentId)
      .eq("user_id", userId)
      .select()
      .single()

    if (updateError) {
      console.error("Erro ao atualizar agente:", updateError)
      return NextResponse.json({ error: "Erro ao atualizar agente" }, { status: 500 })
    }

    // Atualizar bot na Evolution API se existir
    if (currentAgent.evolution_bot_id && currentAgent.whatsapp_connections?.instance_name) {
      const evolutionBotConfig = {
        enabled: currentAgent.status === "active",
        description: updateData.name,
        apiUrl: "", // Será preenchido pela função
        apiKey: "",
        triggerType: updateData.triggerType as "all" | "keyword",
        triggerOperator: updateData.triggerOperator as any,
        triggerValue: updateData.triggerValue || "",
        expire: updateData.expireTime,
        keywordFinish: updateData.keywordFinish,
        delayMessage: updateData.delayMessage,
        unknownMessage: updateData.unknownMessage,
        listeningFromMe: updateData.listeningFromMe,
        stopBotFromMe: updateData.stopBotFromMe,
        keepOpen: updateData.keepOpen,
        debounceTime: updateData.debounceTime,
        ignoreJids: updateData.ignoreGroups ? ["@g.us"] : [],
        splitMessages: updateData.splitMessages,
        timePerChar: updateData.timePerChar,
      }

      await updateEvolutionBot(
        currentAgent.whatsapp_connections.instance_name,
        currentAgent.evolution_bot_id,
        agentId,
        evolutionBotConfig,
      )
    }

    return NextResponse.json({ success: true, agent: updatedAgent })
  } catch (error) {
    console.error("Erro na API de atualização de agente:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
