import { type NextRequest, NextResponse } from "next/server";

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

    // Buscar configuração do Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: "Configuração do servidor incompleta" },
        { status: 500 }
      );
    }

    // Buscar conexão da instância no Supabase
    const connectionResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?instance_name=eq.${instanceName}`,
      {
        headers: {
          "Content-Type": "application/json",
          "Accept-Profile": "impaai",
          "Content-Profile": "impaai",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!connectionResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Erro ao buscar conexão da instância" },
        { status: 500 }
      );
    }

    const connections = await connectionResponse.json();
    const instanceConnection = connections[0];

    if (!instanceConnection?.instance_token) {
      return NextResponse.json(
        { success: false, error: "Token da instância não encontrado" },
        { status: 500 }
      );
    }

    // Buscar configuração da Evolution API
    const integrationResponse = await fetch(
      `${supabaseUrl}/rest/v1/integrations?type=eq.evolution_api&is_active=eq.true&select=config`,
      {
        headers: {
          "Content-Type": "application/json",
          "Accept-Profile": "impaai",
          "Content-Profile": "impaai",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!integrationResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Erro ao buscar configuração da Evolution API" },
        { status: 500 }
      );
    }

    const integrations = await integrationResponse.json();
    const evolutionConfig = integrations[0];

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