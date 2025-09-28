import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-config";
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

    const supabase = getSupabaseServer();

    // Buscar job
    let query = supabase
      .from("background_jobs")
      .select("*")
      .eq("id", id);

    // Se não for admin, filtrar apenas jobs do usuário
    if (user.role !== "admin") {
      query = query.eq("user_id", user.id);
    }

    const { data: job, error: jobError } = await query.single();

    if (jobError || !job) {
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

    const supabase = getSupabaseServer();

    let query = supabase
      .from("background_jobs")
      .select("id, type, status, progress, total_items, processed_items, successful_items, failed_items, created_at, started_at, completed_at, error_message")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Se não for admin, filtrar apenas jobs do usuário
    if (user.role !== "admin") {
      query = query.eq("user_id", user.id);
    }

    // Filtros opcionais
    if (status) {
      query = query.eq("status", status);
    }
    
    if (type) {
      query = query.eq("type", type);
    }

    const { data: jobs, error: jobsError } = await query;

    if (jobsError) {
      throw new Error("Erro ao buscar jobs");
    }

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