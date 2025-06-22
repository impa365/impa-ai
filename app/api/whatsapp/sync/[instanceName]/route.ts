import { type NextRequest, NextResponse } from "next/server";

export async function POST(
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

    // Verificar status real na Evolution API
    const statusResponse = await fetch(
      `${config.apiUrl}/instance/connectionState/${instanceName}`,
      {
        method: "GET",
        headers: {
          apikey: config.apiKey,
        },
        signal: AbortSignal.timeout(8000), // 8 segundos timeout
      }
    );

    let realStatus = "disconnected";
    let phoneNumber = null;

    if (statusResponse.ok) {
      const statusData = await statusResponse.json();

      // Mapear status da Evolution API para nosso formato
      if (statusData?.instance?.state) {
        switch (statusData.instance.state) {
          case "open":
            realStatus = "connected";
            break;
          case "connecting":
            realStatus = "connecting";
            break;
          case "close":
          default:
            realStatus = "disconnected";
            break;
        }
      }

      // Capturar número do telefone se disponível
      phoneNumber =
        statusData?.instance?.wuid || statusData?.instance?.number || null;
    }

    // Atualizar status no banco de dados
    const updateData: any = {
      status: realStatus,
      updated_at: new Date().toISOString(),
    };

    // Adicionar número do telefone se disponível
    if (phoneNumber) {
      updateData.phone_number = phoneNumber;
    }

    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?instance_name=eq.${instanceName}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Accept-Profile": "impaai",
          "Content-Profile": "impaai",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!updateResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Erro ao atualizar status no banco" },
        { status: 500 }
      );
    }

    const updatedConnection = await updateResponse.json();

    return NextResponse.json({
      success: true,
      status: realStatus,
      phoneNumber: phoneNumber,
      updated: true,
      connection: updatedConnection[0] || null,
      message: `Status sincronizado: ${realStatus}`,
    });
  } catch (error: any) {
    console.error("Erro na sincronização:", error);

    if (error.name === "TimeoutError") {
      return NextResponse.json(
        {
          success: false,
          error: "Timeout ao verificar status na Evolution API",
        },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
