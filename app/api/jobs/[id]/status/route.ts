import { NextRequest, NextResponse } from "next/server";
import { queryOne, queryMany } from "@/lib/db";
import { getCurrentServerUser } from "@/lib/auth-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verificar autenticação
    const user = await getCurrentServerUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Buscar job
    const jobSql = `SELECT * FROM background_jobs WHERE id = $1`
      + (user.role !== "admin" ? ` AND user_id = $2` : "")
      + ` LIMIT 1`;
    const jobParams = user.role !== "admin" ? [id, user.id] : [id];

    const job = await queryOne<any>(jobSql, jobParams);

    if (!job) {
      return NextResponse.json(
        { error: "Job não encontrado" },
        { status: 404 }
      );
    }

    // Calcular estatísticas do job
    const stats: any = {
      id: job.id,
      type: job.type,
      status: job.status,
      progress: job.progress,
      total_items: job.total_items,
      processed_items: job.processed_items,
      successful_items: job.successful_items,
      failed_items: job.failed_items,
      error_message: job.error_message,
      created_at: job.created_at,
      started_at: job.started_at,
      completed_at: job.completed_at,
      updated_at: job.updated_at
    };

    // Adicionar estimativa de tempo restante se estiver rodando
    if (job.status === 'running' && job.processed_items > 0) {
      const timeElapsed = new Date().getTime() - new Date(job.started_at).getTime();
      const timePerItem = timeElapsed / job.processed_items;
      const remainingItems = job.total_items - job.processed_items;
      const estimatedTimeRemaining = Math.round((remainingItems * timePerItem) / 1000);
      
      stats.estimated_time_remaining = `${estimatedTimeRemaining} segundos`;
    }

    // Incluir resultados detalhados se concluído
    const response: any = {
      success: true,
      job: stats
    };

    if (job.status === 'completed' && job.results) {
      response.results = job.results;
    }

    return NextResponse.json(response);

  } catch (error: any) {
    console.error("❌ Erro ao buscar status do job:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Endpoint para listar jobs do usuário
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentServerUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { limit = 10, offset = 0, status, type } = body;

    // Build dynamic query
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (user.role !== "admin") {
      conditions.push(`user_id = $${paramIdx++}`);
      params.push(user.id);
    }
    if (status) {
      conditions.push(`status = $${paramIdx++}`);
      params.push(status);
    }
    if (type) {
      conditions.push(`type = $${paramIdx++}`);
      params.push(type);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    params.push(limit);
    const limitParam = paramIdx++;
    params.push(offset);
    const offsetParam = paramIdx++;

    const jobsSql = `SELECT id, type, status, progress, total_items, processed_items, successful_items, failed_items, created_at, started_at, completed_at, error_message
      FROM background_jobs ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}`;

    const jobs = await queryMany<any>(jobsSql, params);

    return NextResponse.json({
      success: true,
      jobs: jobs || [],
      pagination: {
        limit,
        offset,
        total: jobs?.length || 0
      }
    });

  } catch (error: any) {
    console.error("❌ Erro ao listar jobs:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 