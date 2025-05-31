import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { updateEvolutionBot } from "@/lib/evolution-bot-api"

// POST - Ativar/Desativar agente
export async function POST(request: NextRequest, { params }: { params: { agentId: string } }) {
  try {
    const { agentId } = params
    const { userId, enabled } = await request.json()

    if (!userId || typeof enabled !== "boolean") {
      return NextResponse.json({ error: "userId e enabled são obrigatórios" }, { status: 400 })
    }

    // Buscar agente atual
    const { data: agent, error: fetchError } = await supabase
      .from("ai_agents")
      .select(`
        *,
        whatsapp_connections!inner(instance_name, status)
      `)
      .eq("id", agentId)
      .eq("user_id", userId)
      .single()

    if (fetchError || !agent) {
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    // Verificar se a conexão WhatsApp está conectada
    if (enabled && agent.whatsapp_connections?.status !== "connected") {
      return NextResponse.json({ error: "Conexão WhatsApp deve estar conectada para ativar o agente" }, { status: 400 })
    }

    const newStatus = enabled ? "active" : "inactive"

    // Atualizar status no banco
    const { error: updateError } = await supabase
      .from("ai_agents")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agentId)
      .eq("user_id", userId)

    if (updateError) {
      console.error("Erro ao atualizar status do agente:", updateError)
      return NextResponse.json({ error: "Erro ao atualizar status do agente" }, { status: 500 })
    }

    // Atualizar bot na Evolution API se existir
    if (agent.evolution_bot_id && agent.whatsapp_connections?.instance_name) {
      const evolutionBotConfig = {
        enabled,
        description: agent.name,
        apiUrl: "", // Será preenchido pela função
        apiKey: "",
        triggerType: agent.trigger_type as "all" | "keyword",
        triggerOperator: agent.trigger_operator as any,
        triggerValue: agent.trigger_value || "",
        expire: agent.expire_time,
        keywordFinish: agent.keyword_finish,
        delayMessage: agent.delay_message,
        unknownMessage: agent.unknown_message,
        listeningFromMe: agent.listening_from_me,
        stopBotFromMe: agent.stop_bot_from_me,
        keepOpen: agent.keep_open,
        debounceTime: agent.debounce_time,
        ignoreJids: agent.ignore_groups ? ["@g.us"] : [],
        splitMessages: agent.split_messages,
        timePerChar: agent.time_per_char,
      }

      const evolutionResult = await updateEvolutionBot(
        agent.whatsapp_connections.instance_name,
        agent.evolution_bot_id,
        agentId,
        evolutionBotConfig,
      )

      if (!evolutionResult.success) {
        // Reverter status no banco se falhou na Evolution API
        await supabase
          .from("ai_agents")
          .update({ status: enabled ? "inactive" : "active" })
          .eq("id", agentId)

        return NextResponse.json({ error: evolutionResult.error }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, status: newStatus })
  } catch (error) {
    console.error("Erro na API de toggle de agente:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
