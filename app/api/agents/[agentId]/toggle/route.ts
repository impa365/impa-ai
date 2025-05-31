import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { updateEvolutionBot } from "@/lib/evolution-bot-api"

export async function POST(request: NextRequest, { params }: { params: { agentId: string } }) {
  try {
    const { agentId } = params
    const body = await request.json()
    const { userId, status } = body

    if (!userId) {
      return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 })
    }

    // Verificar se o agente existe e pertence ao usuário
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

    // Atualizar status do agente no banco
    const { error: updateError } = await supabase
      .from("ai_agents")
      .update({ status })
      .eq("id", agentId)
      .eq("user_id", userId)

    if (updateError) {
      console.error("Erro ao atualizar status do agente:", updateError)
      return NextResponse.json({ error: "Erro ao atualizar status do agente" }, { status: 500 })
    }

    // Atualizar bot na Evolution API se existir
    if (agent.evolution_bot_id && agent.whatsapp_connections?.instance_name) {
      // Buscar configurações atuais do bot
      const { data: botConfig } = await supabase.from("ai_agents").select("*").eq("id", agentId).single()

      if (botConfig) {
        const evolutionBotConfig = {
          enabled: status === "active",
          description: botConfig.name,
          apiUrl: "", // Será preenchido pela função
          apiKey: "",
          triggerType: botConfig.trigger_type as "all" | "keyword",
          triggerOperator: botConfig.trigger_operator as any,
          triggerValue: botConfig.trigger_value || "",
          expire: botConfig.expire_time,
          keywordFinish: botConfig.keyword_finish,
          delayMessage: botConfig.delay_message,
          unknownMessage: botConfig.unknown_message,
          listeningFromMe: botConfig.listening_from_me,
          stopBotFromMe: botConfig.stop_bot_from_me,
          keepOpen: botConfig.keep_open,
          debounceTime: botConfig.debounce_time,
          ignoreJids: botConfig.ignore_groups ? ["@g.us"] : [],
          splitMessages: botConfig.split_messages,
          timePerChar: botConfig.time_per_char,
        }

        await updateEvolutionBot(
          agent.whatsapp_connections.instance_name,
          agent.evolution_bot_id,
          agentId,
          evolutionBotConfig,
        )
      }
    }

    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error("Erro na API de toggle de agente:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
