import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-config";
import { getCurrentServerUser } from "@/lib/auth-server";

// Global job processor para rodar em background
const jobProcessor = new Map<string, boolean>();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { sessionIds, sessions: sessionsData, status } = body;
    
    // Verificar autenticação
    const user = await getCurrentServerUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Validar parâmetros
    if ((!Array.isArray(sessionIds) || sessionIds.length === 0) && 
        (!Array.isArray(sessionsData) || sessionsData.length === 0)) {
      return NextResponse.json(
        { error: "sessionIds ou sessions deve ser um array não vazio" },
        { status: 400 }
      );
    }

    if (!status || !["opened", "paused", "closed", "delete"].includes(status)) {
      return NextResponse.json(
        { error: "Status deve ser 'opened', 'paused', 'closed' ou 'delete'" },
        { status: 400 }
      );
    }

    // Rate limiting - máximo 50 sessões por operação
    const totalSessions = sessionsData ? sessionsData.length : sessionIds.length;
    if (totalSessions > 50) {
      return NextResponse.json(
        { error: "Máximo de 50 sessões por operação" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    // Buscar o agente e verificar permissões
    let query = supabase
      .from("ai_agents")
      .select(`
        *,
        whatsapp_connections!whatsapp_connection_id (
          id,
          instance_id,
          instance_name,
          instance_token
        )
      `)
      .eq("id", id);

    if (user.role !== "admin") {
      query = query.eq("user_id", user.id);
    }

    const { data: agent, error: agentError } = await query.single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: "Agente não encontrado" },
        { status: 404 }
      );
    }

    if (!agent.evolution_bot_id) {
      return NextResponse.json(
        { error: "Agente não possui Evolution Bot ID configurado" },
        { status: 400 }
      );
    }

    if (!agent.whatsapp_connections || !agent.whatsapp_connections.instance_name) {
      return NextResponse.json(
        { error: "Agente não possui conexão WhatsApp configurada" },
        { status: 400 }
      );
    }

    // As sessões devem sempre vir dos dados fornecidos (não do banco)
    if (!sessionsData || !Array.isArray(sessionsData) || sessionsData.length === 0) {
      return NextResponse.json(
        { error: "Dados das sessões são obrigatórios. As sessões devem ser enviadas junto com a requisição." },
        { status: 400 }
      );
    }

    const sessions: Array<{id: string, remoteJid: string}> = sessionsData.map((session: any) => ({
      id: session.id,
      remoteJid: session.remoteJid
    }));

    // Criar job no banco
    const { data: job, error: jobError } = await supabase
      .from("background_jobs")
      .insert({
        type: 'mass_session_update',
        user_id: user.id,
        agent_id: id,
        status: 'pending',
        total_items: sessions.length,
        job_data: {
          sessionIds,
          sessions,
          status,
          agent: {
            id: agent.id,
            name: agent.name,
            evolution_bot_id: agent.evolution_bot_id,
            instance_name: agent.whatsapp_connections.instance_name
          }
        }
      })
      .select()
      .single();

    if (jobError) {
      console.error("❌ Erro ao criar job:", jobError);
      return NextResponse.json(
        { error: "Erro ao criar job de processamento" },
        { status: 500 }
      );
    }

    // Iniciar processamento em background (não-bloqueante)
    setTimeout(() => processJobInBackground(job.id), 0);

    // Retornar imediatamente com ID do job
    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: `Job criado com sucesso. Processando ${sessions.length} sessões em background.`,
      data: {
        totalSessions: sessions.length,
        status,
        estimatedTime: Math.ceil(sessions.length / 5) * 10 + " segundos"
      }
    });

  } catch (error: any) {
    console.error("❌ Erro ao criar job assíncrono:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Função para processar job em background
async function processJobInBackground(jobId: string) {
  // Evitar processamento duplicado
  if (jobProcessor.has(jobId)) {
    return;
  }
  
  jobProcessor.set(jobId, true);
  
  try {
    const supabase = getSupabaseServer();
    
    // Buscar job
    const { data: job, error: jobError } = await supabase
      .from("background_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      console.error("❌ Job não encontrado:", jobId);
      return;
    }

    // Marcar como iniciado
    await supabase
      .from("background_jobs")
      .update({
        status: 'running',
        started_at: new Date().toISOString()
      })
      .eq("id", jobId);

    const { sessions, status, agent: agentData } = job.job_data;
    
    // Buscar configurações da Evolution API
    const { data: integration, error: integrationError } = await supabase
      .from("integrations")
      .select("config")
      .eq("type", "evolution_api")
      .eq("is_active", true)
      .single();

    if (integrationError || !integration) {
      await supabase
        .from("background_jobs")
        .update({
          status: 'failed',
          error_message: 'Evolution API não configurada',
          completed_at: new Date().toISOString()
        })
        .eq("id", jobId);
      return;
    }

    const evolutionConfig = integration.config as {
      apiUrl: string;
      apiKey: string;
    };

    // Processar sessões em lotes
    const batchSize = 5;
    const results: {
      success: Array<{ sessionId: string; remoteJid: string; result: any }>;
      errors: Array<{ sessionId: string; remoteJid: string; error: string }>;
    } = {
      success: [],
      errors: []
    };

    const evolutionApiUrl = `${evolutionConfig.apiUrl}/evolutionBot/changeStatus/${agentData.instance_name}`;

    for (let i = 0; i < sessions.length; i += batchSize) {
      const batch = sessions.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (session: any) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          const evolutionResponse = await fetch(evolutionApiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: evolutionConfig.apiKey,
            },
            body: JSON.stringify({
              remoteJid: session.remoteJid,
              status
            }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);

          if (!evolutionResponse.ok) {
            const errorText = await evolutionResponse.text();
            results.errors.push({
              sessionId: session.id,
              remoteJid: session.remoteJid,
              error: `Erro ${evolutionResponse.status}: ${errorText}`
            });
            return;
          }

          const result = await evolutionResponse.json();
          results.success.push({
            sessionId: session.id,
            remoteJid: session.remoteJid,
            result
          });

        } catch (error: any) {
          let errorMessage = "Erro desconhecido";
          if (error.name === 'AbortError') {
            errorMessage = "Timeout - operação cancelada após 10 segundos";
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          results.errors.push({
            sessionId: session.id,
            remoteJid: session.remoteJid,
            error: errorMessage
          });
        }
      });

      await Promise.all(batchPromises);
      
      // Atualizar progresso
      const processedItems = i + batch.length;
      const progress = Math.round((processedItems / sessions.length) * 100);
      
      await supabase
        .from("background_jobs")
        .update({
          processed_items: processedItems,
          successful_items: results.success.length,
          failed_items: results.errors.length,
          progress
        })
        .eq("id", jobId);

      // Pausa entre lotes
      if (i + batchSize < sessions.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Finalizar job
    await supabase
      .from("background_jobs")
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        processed_items: sessions.length,
        successful_items: results.success.length,
        failed_items: results.errors.length,
        progress: 100,
        results: {
          summary: `${results.success.length} sucessos, ${results.errors.length} erros`,
          success: results.success,
          errors: results.errors
        }
      })
      .eq("id", jobId);

    console.log(`✅ Job ${jobId} concluído: ${results.success.length} sucessos, ${results.errors.length} erros`);

  } catch (error: any) {
    console.error(`❌ Erro no processamento do job ${jobId}:`, error);
    
    const supabase = getSupabaseServer();
    await supabase
      .from("background_jobs")
      .update({
        status: 'failed',
        error_message: error.message || 'Erro desconhecido',
        completed_at: new Date().toISOString()
      })
      .eq("id", jobId);
  } finally {
    jobProcessor.delete(jobId);
  }
} 