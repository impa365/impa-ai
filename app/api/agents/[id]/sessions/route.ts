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

    // Se não for admin, filtrar apenas agentes do usuário
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

    // Fazer requisição para a Evolution API
    const evolutionApiUrl = `${evolutionConfig.apiUrl}/evolutionBot/fetchSessions/${agent.evolution_bot_id}/${agent.whatsapp_connections.instance_name}`;
    
    const evolutionResponse = await fetch(evolutionApiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        apikey: evolutionConfig.apiKey,
      },
    });

    if (!evolutionResponse.ok) {
      const errorText = await evolutionResponse.text();
      console.error("❌ Erro na Evolution API:", evolutionResponse.status, errorText);
      
      let errorMessage = `Erro na Evolution API: ${evolutionResponse.status}`;
      
      if (evolutionResponse.status === 404) {
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.response?.message?.includes("instance does not exist")) {
            errorMessage = `A instância WhatsApp "${agent.whatsapp_connections.instance_name}" não existe na Evolution API. Verifique se a instância está criada e ativa.`;
          }
        } catch (e) {
          errorMessage = "Instância WhatsApp não encontrada na Evolution API";
        }
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: evolutionResponse.status }
      );
    }

    const sessions = await evolutionResponse.json();

    return NextResponse.json({
      success: true,
      data: sessions,
      agent: {
        id: agent.id,
        name: agent.name,
        evolution_bot_id: agent.evolution_bot_id
      }
    });

  } catch (error: any) {
    console.error("❌ Erro ao buscar sessões:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 