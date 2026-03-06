import { type NextRequest, NextResponse } from "next/server";
import { queryOne, queryMany } from "@/lib/db";
import { validateApiKey } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    // Validar API key
    const authResult = await validateApiKey(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const user = authResult.user;
    const { searchParams } = new URL(request.url);

    // Parâmetros obrigatórios
    const instanceName = searchParams.get("instance_name");
    const userIdParam = searchParams.get("user_id");

    // Parâmetros opcionais
    const dia = searchParams.get("dia");
    const isActive = searchParams.get("is_active");
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "50");

    if (!instanceName) {
      return NextResponse.json(
        { error: "instance_name parameter is required" },
        { status: 400 }
      );
    }

    // Determinar user_id (admin pode especificar, usuário comum usa o próprio)
    let targetUserId = user.id;
    if (user.role === "admin" && userIdParam) {
      targetUserId = userIdParam;
    }

    // Construir query dinâmica com parâmetros
    const conditions: string[] = ['l.user_id = $1', 'l.instance_name = $2'];
    const params: any[] = [targetUserId, instanceName];
    let paramIndex = 3;

    // Filtros opcionais
    if (dia) {
      // Validar formato da data
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(dia)) {
        return NextResponse.json(
          { error: "dia must be in format DD/MM/YYYY" },
          { status: 400 }
        );
      }

      // Converter data para formato ISO
      const [day, month, year] = dia.split("/");
      const filterDate = new Date(`${year}-${month}-${day}`);

      if (isNaN(filterDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format" },
          { status: 400 }
        );
      }

      conditions.push(`l.start_date = $${paramIndex}`);
      params.push(filterDate.toISOString().split("T")[0]);
      paramIndex++;
    }

    if (isActive !== null) {
      conditions.push(`l.is_active = $${paramIndex}`);
      params.push(isActive === "true");
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    const offset = (page - 1) * limit;

    // Query principal com subquery para message history
    const leads = await queryMany(
      `SELECT l.*,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'day_number', h.day_number,
            'sent_at', h.sent_at,
            'status', h.status
          ))
          FROM followup_message_history h
          WHERE h.lead_follow_id = l.id),
          '[]'::json
        ) AS followup_message_history
      FROM lead_follow24hs l
      WHERE ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    // Contar total para paginação
    const countResult = await queryOne(
      `SELECT COUNT(*)::int AS count FROM lead_follow24hs l WHERE ${whereClause}`,
      params
    );
    const count = countResult?.count || 0;

    // Formatar dados de resposta
    const formattedLeads = leads?.map((lead: any) => ({
      ...lead,
      start_date_formatted: new Date(lead.start_date).toLocaleDateString(
        "pt-BR"
      ),
      days_since_start: Math.floor(
        (new Date().getTime() - new Date(lead.start_date).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
      message_history: lead.followup_message_history || [],
    }));

    return NextResponse.json({
      success: true,
      data: formattedLeads,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error in list-leads-follow:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
