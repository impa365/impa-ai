import { type NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ instanceName: string }> }
) {
  try {
    // 🔧 CORREÇÃO: Await params antes de usar suas propriedades
    const resolvedParams = await params;
    const { instanceName } = resolvedParams;

    console.log(`ℹ️ [INFO] Buscando informações para instância: ${instanceName}`);

    if (!instanceName) {
      console.error("❌ [INFO] Nome da instância é obrigatório");
      return NextResponse.json(
        { success: false, error: "Nome da instância é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar conexão da instância no banco
    const instanceConnection = await queryOne(
      `SELECT * FROM whatsapp_connections WHERE instance_name = $1 LIMIT 1`,
      [instanceName]
    );

    console.log(`🔍 [INFO] Conexão encontrada:`, {
      hasConnection: !!instanceConnection,
      connectionFields: instanceConnection ? Object.keys(instanceConnection) : [],
      hasToken: !!instanceConnection?.instance_token
    });

    if (!instanceConnection) {
      console.error(`❌ [INFO] Nenhuma conexão encontrada para instância: ${instanceName}`);
      return NextResponse.json(
        { success: false, error: "Instância não encontrada no banco de dados" },
        { status: 404 }
      );
    }

    if (!instanceConnection?.instance_token) {
      console.error(`❌ [INFO] Token não encontrado para instância: ${instanceName}. Campos disponíveis:`, Object.keys(instanceConnection));
      return NextResponse.json(
        { success: false, error: "Token da instância não encontrado" },
        { status: 500 }
      );
    }

    // Buscar configuração da Evolution API
    const evolutionConfig = await queryOne<{ config: any }>(
      `SELECT config FROM integrations WHERE type = $1 AND is_active = true LIMIT 1`,
      ["evolution_api"]
    );

    if (!evolutionConfig?.config?.apiUrl) {
      return NextResponse.json(
        { success: false, error: "Evolution API não configurada" },
        { status: 500 }
      );
    }

    // Buscar informações da instância na Evolution API
    const evolutionResponse = await fetch(
      `${evolutionConfig.config.apiUrl}/instance/fetchInstances`,
      {
        method: "GET",
        headers: {
          apikey: instanceConnection.instance_token,
        },
        signal: AbortSignal.timeout(10000), // 10 segundos timeout
      }
    );

    if (!evolutionResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Erro ao buscar informações da instância na Evolution API" },
        { status: 500 }
      );
    }

    const evolutionData = await evolutionResponse.json();

    // Encontrar a instância específica no array retornado
    const instanceData = Array.isArray(evolutionData) 
      ? evolutionData.find(inst => inst.name === instanceName)
      : evolutionData;

    if (!instanceData) {
      return NextResponse.json(
        { success: false, error: "Instância não encontrada na Evolution API" },
        { status: 404 }
      );
    }

    // Formatar resposta
    const info = {
      id: instanceData.id,
      name: instanceData.name,
      connectionStatus: instanceData.connectionStatus,
      ownerJid: instanceData.ownerJid,
      profileName: instanceData.profileName,
      profilePicUrl: instanceData.profilePicUrl,
      integration: instanceData.integration,
      number: instanceData.number,
      businessId: instanceData.businessId,
      token: instanceData.token ? instanceData.token.substring(0, 20) + '...' : undefined,
      clientName: instanceData.clientName,
      disconnectionReasonCode: instanceData.disconnectionReasonCode,
      disconnectionAt: instanceData.disconnectionAt,
      createdAt: instanceData.createdAt,
      updatedAt: instanceData.updatedAt,
      settings: instanceData.Setting,
      stats: instanceData._count,
    };

    return NextResponse.json({
      success: true,
      info: info,
    });

  } catch (error: any) {
    console.error("Erro ao buscar informações da instância:", error);

    if (error.name === "TimeoutError") {
      return NextResponse.json(
        { success: false, error: "Timeout ao buscar informações" },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}