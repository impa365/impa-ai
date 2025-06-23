import { type NextRequest, NextResponse } from "next/server";
import { getCurrentServerUser } from "@/lib/auth-server";

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

    // Verificar autenticação
    const user = await getCurrentServerUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // Configuração do Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: "Configuração não encontrada" },
        { status: 500 }
      );
    }

    // Verificar se a conexão pertence ao usuário (ou se é admin)
    const connectionCheckResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?instance_name=eq.${instanceName}&select=id,user_id,connection_name`,
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

    if (!connectionCheckResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Erro ao verificar conexão" },
        { status: 500 }
      );
    }

    const connections = await connectionCheckResponse.json();

    if (!connections || connections.length === 0) {
      return NextResponse.json(
        { success: false, error: "Conexão não encontrada" },
        { status: 404 }
      );
    }

    const connection = connections[0];

    // Verificar permissão: deve ser o dono da conexão ou admin
    if (connection.user_id !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Sem permissão para deletar esta conexão" },
        { status: 403 }
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
      console.warn("Não foi possível buscar configuração da Evolution API");
    } else {
      const integrations = await integrationResponse.json();

      if (integrations && integrations.length > 0) {
        const config = integrations[0].config;

        if (config?.apiUrl && config?.apiKey) {
          try {
            // Tentar deletar da Evolution API
            const deleteResponse = await fetch(
              `${config.apiUrl}/instance/delete/${instanceName}`,
              {
                method: "DELETE",
                headers: {
                  apikey: config.apiKey,
                },
                signal: AbortSignal.timeout(10000), // 10 segundos timeout
              }
            );

            if (!deleteResponse.ok) {
              console.warn(
                `Falha ao deletar da Evolution API: ${deleteResponse.status}`
              );
              // Continuar com a deleção do banco mesmo se falhar na API
            } else {
              console.log("Instância deletada da Evolution API com sucesso");
            }
          } catch (apiError) {
            console.warn("Erro ao deletar da Evolution API:", apiError);
            // Continuar com a deleção do banco mesmo se falhar na API
          }
        }
      }
    }

    // Deletar do banco de dados (sempre executar, mesmo se falhar na API)
    const deleteFromDBResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?instance_name=eq.${instanceName}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Accept-Profile": "impaai",
          "Content-Profile": "impaai",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!deleteFromDBResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Erro ao deletar conexão do banco de dados" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Conexão deletada com sucesso",
      connectionName: connection.connection_name,
    });
  } catch (error) {
    console.error("Erro ao deletar conexão:", error);

    if ((error as Error).name === "TimeoutError") {
      return NextResponse.json(
        { success: false, error: "Timeout ao deletar da Evolution API" },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
