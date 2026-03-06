import { NextRequest, NextResponse } from "next/server";
import { queryOne, queryMany } from "@/lib/db";
import { getCurrentServerUser } from "@/lib/auth-server";

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

    // Validar parâmetros - aceitar tanto sessionIds quanto sessionsData
    if ((!Array.isArray(sessionIds) || sessionIds.length === 0) && 
        (!Array.isArray(sessionsData) || sessionsData.length === 0)) {
      return NextResponse.json(
        { error: "sessionIds ou sessions deve ser um array não vazio" },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: "status é obrigatório" },
        { status: 400 }
      );
    }

    if (!["opened", "paused", "closed", "delete"].includes(status)) {
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

    // Buscar o agente e sua conexão WhatsApp
    let sql = `
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
    `;
    const sqlParams: any[] = [id];

    if (user.role !== "admin") {
      sql += ` AND a.user_id = $2`;
      sqlParams.push(user.id);
    }

    sql += ` LIMIT 1`;

    const agent = await queryOne<any>(sql, sqlParams);

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

    // Buscar configurações da Evolution API
    const integration = await queryOne<{ config: any }>(
      `SELECT config FROM integrations WHERE type = $1 AND is_active = true LIMIT 1`,
      ["evolution_api"]
    );

    if (!integration) {
      return NextResponse.json(
        { error: "Evolution API não configurada" },
        { status: 400 }
      );
    }

    const evolutionConfig = integration.config as {
      apiUrl: string;
      apiKey: string;
    };

    if (!evolutionConfig.apiUrl || !evolutionConfig.apiKey) {
      return NextResponse.json(
        { error: "Configurações da Evolution API incompletas" },
        { status: 400 }
      );
    }

    // Determinar as sessões a processar
    let sessions: Array<{id: string, remoteJid: string}>;
    
    if (sessionsData) {
      // Se recebemos os dados das sessões diretamente, usar eles
      sessions = sessionsData.map((session: any) => ({
        id: session.id,
        remoteJid: session.remoteJid
      }));
    } else {
      // Fallback: buscar as sessões no banco para obter os remoteJids
      const dbSessions = await queryMany<{ id: string; remoteJid: string }>(
        `SELECT id, "remoteJid" FROM evolution_sessions WHERE id = ANY($1) AND "botId" = $2`,
        [sessionIds, agent.evolution_bot_id]
      );

      if (!dbSessions || dbSessions.length === 0) {
        return NextResponse.json(
          { error: "Nenhuma sessão encontrada" },
          { status: 404 }
        );
      }
      
      sessions = dbSessions;
    }

    if (sessions.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma sessão válida encontrada" },
        { status: 404 }
      );
    }

    // Processar atualizações em lotes para evitar sobrecarga
    const batchSize = 5; // Processar 5 por vez para não sobrecarregar a API
    const results: {
      success: Array<{ sessionId: string; remoteJid: string; result: any }>;
      errors: Array<{ sessionId: string; remoteJid: string; error: string }>;
    } = {
      success: [],
      errors: []
    };

    const evolutionApiUrl = `${evolutionConfig.apiUrl}/evolutionBot/changeStatus/${agent.whatsapp_connections.instance_name}`;

    // Processar em lotes
    for (let i = 0; i < sessions.length; i += batchSize) {
      const batch = sessions.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (session) => {
        try {
          // Timeout de 10 segundos por requisição
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
            console.error(`❌ Erro na Evolution API para sessão ${session.remoteJid}:`, evolutionResponse.status, errorText);
            
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
          console.error(`❌ Erro ao processar sessão ${session.remoteJid}:`, error);
          
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

      // Aguardar o lote atual antes de processar o próximo
      await Promise.all(batchPromises);
      
      // Pequena pausa entre lotes para não sobrecarregar a API
      if (i + batchSize < sessions.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Log detalhado da operação
    const operationSummary = {
      agentId: id,
      agentName: agent.name || "N/A",
      instanceName: agent.whatsapp_connections.instance_name,
      totalSessions: sessions.length,
      successful: results.success.length,
      failed: results.errors.length,
      status,
      userId: user.id,
      userRole: user.role,
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ Operação em massa concluída:`, operationSummary);
    
    // Log detalhado dos erros se houver
    if (results.errors.length > 0) {
      console.log(`❌ Detalhes dos erros:`, results.errors);
    }

    return NextResponse.json({
      success: true,
      message: `Operação concluída: ${results.success.length} sucessos, ${results.errors.length} erros`,
      data: {
        totalProcessed: sessions.length,
        successful: results.success.length,
        failed: results.errors.length,
        status,
        results: {
          success: results.success,
          errors: results.errors
        }
      }
    });

  } catch (error: any) {
    console.error("❌ Erro ao processar operação em massa:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 