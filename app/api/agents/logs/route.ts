import { type NextRequest, NextResponse } from "next/server";
import { query, queryOne, queryMany, buildInsert } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agent_id, activity_type, activity_data } = body;

    if (!agent_id || !activity_type) {
      return NextResponse.json(
        { error: "Parâmetros inválidos" },
        { status: 400 }
      );
    }

    // Verificar se o agente existe
    const agent = await queryOne<{ id: string }>(
      'SELECT id FROM ai_agents WHERE id = $1',
      [agent_id]
    );

    if (!agent) {
      return NextResponse.json(
        { error: "Agente não encontrado" },
        { status: 404 }
      );
    }

    // Registrar log
    const { text, values } = buildInsert('agent_activity_logs', {
      agent_id,
      activity_type,
      activity_data: activity_data || {},
    });
    await query(text, values);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao registrar log:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const agent_id = searchParams.get("agent_id");
    const limit = Number.parseInt(searchParams.get("limit") || "50");
    const offset = Number.parseInt(searchParams.get("offset") || "0");

    if (!agent_id) {
      return NextResponse.json(
        { error: "agent_id é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar logs do agente
    const logs = await queryMany(
      'SELECT * FROM agent_activity_logs WHERE agent_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [agent_id, limit, offset]
    );

    // Contar total de registros
    const countResult = await queryOne<{ total: string }>(
      'SELECT COUNT(*) as total FROM agent_activity_logs WHERE agent_id = $1',
      [agent_id]
    );

    return NextResponse.json({
      logs,
      total: countResult ? parseInt(countResult.total) : 0,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("Erro ao buscar logs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
