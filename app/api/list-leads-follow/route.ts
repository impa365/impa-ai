import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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

    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: "impaai" },
    });

    // Construir query
    let query = supabase
      .from("lead_follow24hs")
      .select(
        `
        *,
        followup_message_history(
          day_number,
          sent_at,
          status
        )
      `
      )
      .eq("user_id", targetUserId)
      .eq("instance_name", instanceName);

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

      query = query.eq("start_date", filterDate.toISOString().split("T")[0]);
    }

    if (isActive !== null) {
      query = query.eq("is_active", isActive === "true");
    }

    // Paginação
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Ordenar por data de criação (mais recentes primeiro)
    query = query.order("created_at", { ascending: false });

    const { data: leads, error: queryError } = await query;

    if (queryError) {
      console.error("Error fetching leads:", queryError);
      return NextResponse.json(
        { error: "Failed to fetch leads" },
        { status: 500 }
      );
    }

    // Contar total para paginação
    let countQuery = supabase
      .from("lead_follow24hs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", targetUserId)
      .eq("instance_name", instanceName);

    if (dia) {
      const [day, month, year] = dia.split("/");
      const filterDate = new Date(`${year}-${month}-${day}`);
      countQuery = countQuery.eq(
        "start_date",
        filterDate.toISOString().split("T")[0]
      );
    }

    if (isActive !== null) {
      countQuery = countQuery.eq("is_active", isActive === "true");
    }

    const { count } = await countQuery;

    // Formatar dados de resposta
    const formattedLeads = leads?.map((lead) => ({
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
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
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
