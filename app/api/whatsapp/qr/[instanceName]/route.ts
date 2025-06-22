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

    // Buscar QR Code da Evolution API
    const qrResponse = await fetch(
      `${config.apiUrl}/instance/connect/${instanceName}`,
      {
        method: "GET",
        headers: {
          apikey: config.apiKey,
        },
      }
    );

    if (!qrResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Erro ao gerar QR Code" },
        { status: 500 }
      );
    }

    const qrData = await qrResponse.json();

    return NextResponse.json({
      success: true,
      qrCode: qrData.base64 || qrData.qrcode || null,
      status: qrData.instance?.state || "disconnected",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
