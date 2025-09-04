import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-config";
import { getCurrentServerUser } from "@/lib/auth-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { sessionIds, status } = body;
    
    // Verificar autenticação
    const user = await getCurrentServerUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Validar parâmetros
    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
      return NextResponse.json(
        { error: "sessionIds deve ser um array não vazio" },
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
    if (sessionIds.length > 50) {
      return NextResponse.json(
        { error: "Máximo de 50 sessões por operação" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    // Buscar o agente e sua conexão WhatsApp
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

    // Se não for admin, filtrar apenas agentes do usuário
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

    // Buscar configurações da Evolution API
    const { data: integration, error: integrationError } = await supabase
      .from("integrations")
      .select("config")
      .eq("type", "evolution_api")
      .eq("is_active", true)
      .single();

    if (integrationError || !integration) {
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

    // Buscar as sessões no banco para obter os remoteJids
    const { data: sessions, error: sessionsError } = await supabase
      .from("evolution_sessions")
      .select("id, remoteJid")
      .in("id", sessionIds)
      .eq("botId", agent.evolution_bot_id);

    if (sessionsError) {
      console.error("❌ Erro ao buscar sessões:", sessionsError);
      return NextResponse.json(
        { error: "Erro ao buscar sessões" },
        { status: 500 }
      );
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma sessão encontrada" },
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