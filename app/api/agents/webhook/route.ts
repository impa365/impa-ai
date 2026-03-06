import { type NextRequest, NextResponse } from "next/server"
import { query, queryOne, buildInsert } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bot_id, message, response, success, response_time } = body

    if (!bot_id) {
      return NextResponse.json({ error: "bot_id é obrigatório" }, { status: 400 })
    }

    // Buscar o agente pelo ID do bot na Evolution
    const agent = await queryOne<{ id: string }>(
      'SELECT id FROM ai_agents WHERE evolution_bot_id = $1',
      [bot_id]
    )

    if (!agent) {
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    // Registrar log de atividade
    const { text, values } = buildInsert('agent_activity_logs', {
      agent_id: agent.id,
      activity_type: "message",
      activity_data: {
        message,
        response,
        success: success !== false,
        response_time: response_time || null,
        timestamp: new Date().toISOString(),
      },
    })
    await query(text, values)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Erro ao processar webhook:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
