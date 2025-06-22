import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { instanceName: string } }
) {
  try {
    const { instanceName } = params;

    if (!instanceName) {
      return NextResponse.json(
        { success: false, error: "Nome da instância é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar configuração da Evolution API
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: "Configuração não encontrada" },
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
        { success: false, error: "Erro ao buscar configuração da API" },
        { status: 500 }
      );
    }

    const integrations = await integrationResponse.json();

    if (!integrations || integrations.length === 0) {
      return NextResponse.json(
        { success: false, error: "Evolution API não configurada" },
        { status: 500 }
      );
    }

    const config = integrations[0].config;

    if (!config?.apiUrl || !config?.apiKey) {
      return NextResponse.json(
        { success: false, error: "Configuração da Evolution API incompleta" },
        { status: 500 }
      );
    }

    // Buscar informações da instância
    const infoResponse = await fetch(
      `${config.apiUrl}/instance/fetchInstances?instanceName=${instanceName}`,
      {
        method: "GET",
        headers: {
          apikey: config.apiKey,
        },
        signal: AbortSignal.timeout(8000), // 8 segundos timeout
      }
    );

    if (!infoResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Erro ao buscar informações da instância" },
        { status: 500 }
      );
    }

    const instanceData = await infoResponse.json();

    // Buscar status da conexão
    const statusResponse = await fetch(
      `${config.apiUrl}/instance/connectionState/${instanceName}`,
      {
        method: "GET",
        headers: {
          apikey: config.apiKey,
        },
      }
    );

    let connectionStatus = "disconnected";
    let phoneNumber = null;
    let isOnline = false;

    if (statusResponse.ok) {
      const statusData = await statusResponse.json();

      if (statusData?.instance?.state) {
        switch (statusData.instance.state) {
          case "open":
            connectionStatus = "connected";
            isOnline = true;
            break;
          case "connecting":
            connectionStatus = "connecting";
            break;
          case "close":
          default:
            connectionStatus = "disconnected";
            break;
        }
      }

      phoneNumber =
        statusData?.instance?.wuid || statusData?.instance?.number || null;
    }

    // Formatar informações para retorno
    const info = {
      status: connectionStatus,
      phoneNumber: phoneNumber,
      profileName: instanceData?.clientName || null,
      isOnline: isOnline,
      createdAt: instanceData?.createdAt || null,
      updatedAt: instanceData?.updatedAt || null,
      disconnectedAt: instanceData?.disconnectionAt || null,
      disconnectionReason: instanceData?.disconnectionReasonCode || null,
      settings: instanceData?.Setting || null,
      stats: {
        messages: instanceData?._count?.Message || 0,
        contacts: instanceData?._count?.Contact || 0,
        chats: instanceData?._count?.Chat || 0,
      },
    };

    return NextResponse.json({
      success: true,
      info: info,
    });
  } catch (error: any) {
    console.error("Erro ao buscar informações:", error);

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
