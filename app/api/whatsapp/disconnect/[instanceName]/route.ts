import { type NextRequest, NextResponse } from "next/server";
import { disconnectUazapiInstanceServer } from "@/lib/uazapi-server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ instanceName: string }> }
) {
  try {
    // Next.js 15: await params
    const { instanceName } = await params;

    if (!instanceName) {
      return NextResponse.json(
        { success: false, error: "Nome da instância é obrigatório" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: "Configuração não encontrada" },
        { status: 500 }
      );
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    };

    // Buscar dados da conexão incluindo api_type e instance_token
    console.log(`🔍 [DISCONNECT] Buscando dados da conexão: ${instanceName}`);
    const connectionResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?instance_name=eq.${instanceName}&select=id,instance_name,api_type,instance_token`,
      { headers }
    );

    if (!connectionResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Erro ao buscar conexão" },
        { status: 500 }
      );
    }

    const connections = await connectionResponse.json();
    if (!connections || connections.length === 0) {
      return NextResponse.json(
        { success: false, error: "Conexão não encontrada" },
        { status: 404 }
      );
    }

    const connection = connections[0];
    const apiType = connection.api_type || "evolution";
    const instanceToken = connection.instance_token;

    console.log(`🔄 [DISCONNECT] Iniciando desconexão da instância: ${instanceName} (${apiType})`);

    // === UAZAPI ===
    if (apiType === "uazapi") {
      console.log(`🔵 [DISCONNECT-UAZAPI] Desconectando via Uazapi...`);
      
      if (!instanceToken) {
        return NextResponse.json(
          { success: false, error: "Token da instância não encontrado" },
          { status: 500 }
        );
      }

      const disconnectResult = await disconnectUazapiInstanceServer(instanceToken);

      if (!disconnectResult.success) {
        console.error(`❌ [DISCONNECT-UAZAPI] Erro:`, disconnectResult.error);
        return NextResponse.json(
          {
            success: false,
            error: `Erro ao desconectar via Uazapi: ${disconnectResult.error}`,
          },
          { status: 500 }
        );
      }

      console.log(`✅ [DISCONNECT-UAZAPI] Desconexão bem-sucedida`);

      // Atualizar status no banco
      await fetch(
        `${supabaseUrl}/rest/v1/whatsapp_connections?instance_name=eq.${instanceName}`,
        {
          method: "PATCH",
          headers: {
            ...headers,
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            status: "disconnected",
            phone_number: null,
            updated_at: new Date().toISOString(),
          }),
        }
      );

      return NextResponse.json({
        success: true,
        message: "Instância Uazapi desconectada com sucesso",
      });
    }

    // === EVOLUTION API ===
    console.log(`🟢 [DISCONNECT-EVOLUTION] Desconectando via Evolution API...`);
    
    const integrationResponse = await fetch(
      `${supabaseUrl}/rest/v1/integrations?type=eq.evolution_api&is_active=eq.true&select=config`,
      { headers }
    );

    if (!integrationResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Erro ao buscar configuração da Evolution API" },
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

    console.log(`🔗 [DISCONNECT-EVOLUTION] Chamando: ${config.apiUrl}/instance/logout/${instanceName}`);
    
    const logoutResponse = await fetch(
      `${config.apiUrl}/instance/logout/${instanceName}`,
      {
        method: "DELETE",
        headers: {
          apikey: config.apiKey,
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    console.log(`📡 [DISCONNECT-EVOLUTION] Response status: ${logoutResponse.status}`);

    if (!logoutResponse.ok) {
      const errorText = await logoutResponse.text();
      console.error(`❌ [DISCONNECT-EVOLUTION] Erro: ${logoutResponse.status} - ${errorText}`);
      return NextResponse.json(
        {
          success: false,
          error: `Erro ao desconectar: ${logoutResponse.status} - ${errorText}`,
        },
        { status: 500 }
      );
    }

    const logoutData = await logoutResponse.json();
    console.log(`✅ [DISCONNECT-EVOLUTION] Desconexão bem-sucedida:`, logoutData);

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
