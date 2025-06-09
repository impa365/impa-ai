import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bot_id, message, response, success, response_time } = body

    if (!bot_id) {
      return NextResponse.json({ error: "bot_id é obrigatório" }, { status: 400 })
    }

    // Buscar o agente pelo ID do bot na Evolution
    const { data: agent, error: agentError } = await supabase
      .from("ai_agents")
      .select("id")
      .eq("evolution_bot_id", bot_id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    // Registrar log de atividade
    const { error } = await supabase.from("agent_activity_logs").insert([
      {
        agent_id: agent.id,
        activity_type: "message",
        activity_data: {
          message,
          response,
          success: success !== false, // Default para true se não especificado
          response_time: response_time || null,
          timestamp: new Date().toISOString(),
        },
      },
    ])

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Erro ao processar webhook:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
