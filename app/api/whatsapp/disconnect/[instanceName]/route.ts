import { type NextRequest, NextResponse } from "next/server";

export async function DELETE(
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

    console.log(`🔄 [DISCONNECT] Iniciando desconexão da instância: ${instanceName}`);

    // Desconectar instância na Evolution API
    console.log(`🔗 [DISCONNECT] Chamando Evolution API: ${config.apiUrl}/instance/logout/${instanceName}`);
    console.log(`🔑 [DISCONNECT] ApiKey configurada: ${!!config.apiKey}`);
    
    const logoutResponse = await fetch(
      `${config.apiUrl}/instance/logout/${instanceName}`,
      {
        method: "DELETE",
        headers: {
          apikey: config.apiKey,
        },
        signal: AbortSignal.timeout(10000), // 10 segundos timeout
      }
    );

    console.log(`📡 [DISCONNECT] Response status: ${logoutResponse.status}`);
    console.log(`📡 [DISCONNECT] Response headers:`, Object.fromEntries(logoutResponse.headers.entries()));

    if (!logoutResponse.ok) {
      const errorText = await logoutResponse.text();
      console.error(`❌ [DISCONNECT] Erro da Evolution API: ${logoutResponse.status} - ${errorText}`);
      return NextResponse.json(
        {
          success: false,
          error: `Erro ao desconectar: ${logoutResponse.status} - ${errorText}`,
        },
        { status: 500 }
      );
    }

    const logoutData = await logoutResponse.json();
    console.log(`✅ [DISCONNECT] Evolution API response:`, logoutData);

    // Atualizar status no banco de dados
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
        body: JSON.stringify({
          status: "disconnected",
          phone_number: null,
          updated_at: new Date().toISOString(),
        }),
      }
    );

    if (!updateResponse.ok) {
      console.error(
        "Erro ao atualizar status no banco, mas desconexão foi bem-sucedida"
      );
    }

    return NextResponse.json({
      success: true,
      message: "Instância desconectada com sucesso",
      data: logoutData,
    });
  } catch (error: any) {
    console.error("Erro ao desconectar instância:", error);

    if (error.name === "TimeoutError") {
      return NextResponse.json(
        { success: false, error: "Timeout ao desconectar instância" },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
