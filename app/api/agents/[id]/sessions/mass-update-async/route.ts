import { NextRequest, NextResponse } from "next/server";
import { queryOne, query as dbQuery } from "@/lib/db";
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

    const agentSql = `
      SELECT a.*,
        json_build_object(
          'id', wc.id,
          'instance_id', wc.instance_id,
          'instance_name', wc.instance_name,
          'instance_token', wc.instance_token
        ) AS whatsapp_connections
      FROM ai_agents a
      LEFT JOIN whatsapp_connections wc ON wc.id = a.whatsapp_connection_id
      WHERE a.id = $1
    ` + (user.role !== "admin" ? ` AND a.user_id = $2` : "") + ` LIMIT 1`;
    const agentParams = user.role !== "admin" ? [id, user.id] : [id];

    const agent = await queryOne<any>(agentSql, agentParams);

    if (!agent) {
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
    const job = await queryOne<any>(
      `INSERT INTO background_jobs (type, user_id, agent_id, status, total_items, job_data)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        'mass_session_update',
        user.id,
        id,
        'pending',
        sessions.length,
        JSON.stringify({
          sessionIds,
          sessions,
          status,
          agent: {
            id: agent.id,
            name: agent.name,
            evolution_bot_id: agent.evolution_bot_id,
            instance_name: agent.whatsapp_connections.instance_name
          }
        })
      ]
    );

    if (!job) {
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
    // Buscar job
    const job = await queryOne<any>(
      `SELECT * FROM background_jobs WHERE id = $1`,
      [jobId]
    );

    if (!job) {
      console.error("❌ Job não encontrado:", jobId);
      return;
    }

    // Marcar como iniciado
    await dbQuery(
      `UPDATE background_jobs SET status = $1, started_at = $2 WHERE id = $3`,
      ['running', new Date().toISOString(), jobId]
    );

    const jobData = typeof job.job_data === 'string' ? JSON.parse(job.job_data) : job.job_data;
    const { sessions, status, agent: agentData } = jobData;
    
    // Buscar configurações da Evolution API
    const integration = await queryOne<{ config: any }>(
      `SELECT config FROM integrations WHERE type = $1 AND is_active = true LIMIT 1`,
      ["evolution_api"]
    );

    if (!integration) {
      await dbQuery(
        `UPDATE background_jobs SET status = $1, error_message = $2, completed_at = $3 WHERE id = $4`,
        ['failed', 'Evolution API não configurada', new Date().toISOString(), jobId]
      );
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
      
      await dbQuery(
        `UPDATE background_jobs SET processed_items = $1, successful_items = $2, failed_items = $3, progress = $4 WHERE id = $5`,
        [processedItems, results.success.length, results.errors.length, progress, jobId]
      );

      // Pausa entre lotes
      if (i + batchSize < sessions.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Finalizar job
    await dbQuery(
      `UPDATE background_jobs
       SET status = $1, completed_at = $2, processed_items = $3,
           successful_items = $4, failed_items = $5, progress = $6, results = $7
       WHERE id = $8`,
      [
        'completed',
        new Date().toISOString(),
        sessions.length,
        results.success.length,
        results.errors.length,
        100,
        JSON.stringify({
          summary: `${results.success.length} sucessos, ${results.errors.length} erros`,
          success: results.success,
          errors: results.errors
        }),
        jobId
      ]
    );

    console.log(`✅ Job ${jobId} concluído: ${results.success.length} sucessos, ${results.errors.length} erros`);

  } catch (error: any) {
    console.error(`❌ Erro no processamento do job ${jobId}:`, error);
    
    await dbQuery(
      `UPDATE background_jobs SET status = $1, error_message = $2, completed_at = $3 WHERE id = $4`,
      ['failed', error.message || 'Erro desconhecido', new Date().toISOString(), jobId]
    );
  } finally {
    jobProcessor.delete(jobId);
  }
} 