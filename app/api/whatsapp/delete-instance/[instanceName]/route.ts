import { type NextRequest, NextResponse } from "next/server";
import { getCurrentServerUser } from "@/lib/auth-server";
import { deleteUazapiInstanceServer } from "@/lib/uazapi-server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ instanceName: string }> }
) {
  try {
    // Next.js 15: await params
    const { instanceName } = await params;
    console.log("🗑️ Iniciando deleção de instância:", instanceName);

    if (!instanceName) {
      console.error("❌ Nome da instância não fornecido");
      return NextResponse.json(
        { success: false, error: "Nome da instância é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar autenticação
    const user = await getCurrentServerUser(request);
    if (!user) {
      console.error("❌ Usuário não autenticado");
      return NextResponse.json(
        { success: false, error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    console.log("👤 Usuário autenticado:", {
      id: user.id,
      email: user.email,
      role: user.role
    });

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

    console.log("🔍 Buscando conexão com instance_name:", instanceName);

    // Buscar conexão incluindo api_type e instance_token
    const connectionCheckResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?instance_name=eq.${instanceName}&select=id,user_id,connection_name,api_type,instance_token`,
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

    console.log("📡 Resposta da busca de conexão:", {
      status: connectionCheckResponse.status,
      ok: connectionCheckResponse.ok
    });

    if (!connectionCheckResponse.ok) {
      console.error("❌ Erro ao buscar conexão:", connectionCheckResponse.statusText);
      return NextResponse.json(
        { success: false, error: "Erro ao verificar conexão" },
        { status: 500 }
      );
    }

    const connections = await connectionCheckResponse.json();
    console.log("📋 Conexões encontradas:", connections);

    if (!connections || connections.length === 0) {
      console.error("❌ Nenhuma conexão encontrada com instance_name:", instanceName);
      
      // Buscar todas as conexões do usuário para debug
      const allConnectionsResponse = await fetch(
        `${supabaseUrl}/rest/v1/whatsapp_connections?user_id=eq.${user.id}&select=id,instance_name,connection_name`,
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
      
      if (allConnectionsResponse.ok) {
        const allConnections = await allConnectionsResponse.json();
        console.log("🔍 Todas as conexões do usuário:", allConnections);
      }
      
      return NextResponse.json(
        { success: false, error: "Conexão não encontrada" },
        { status: 404 }
      );
    }

    const connection = connections[0];
    const apiType = connection.api_type || "evolution";
    const instanceToken = connection.instance_token;
    
    console.log("🔐 Verificando permissões:", {
      connection_user_id: connection.user_id,
      current_user_id: user.id,
      user_role: user.role,
      is_owner: connection.user_id === user.id,
      is_admin: user.role === "admin",
      api_type: apiType
    });

    // Verificar permissão: deve ser o dono da conexão ou admin
    if (connection.user_id !== user.id && user.role !== "admin") {
      console.error("❌ Sem permissão para deletar conexão");
      return NextResponse.json(
        { success: false, error: "Sem permissão para deletar esta conexão" },
        { status: 403 }
      );
    }

    // Deletar da API correta baseado no api_type
    if (apiType === "uazapi") {
      console.log("🔄 Deletando instância da Uazapi...");
      try {
        if (!instanceToken) {
          console.warn("⚠️ Token da instância não encontrado para Uazapi");
        } else {
          const deleteResult = await deleteUazapiInstanceServer(instanceToken);
          if (deleteResult.success) {
            console.log("✅ Instância deletada da Uazapi com sucesso");
          } else {
            console.warn("⚠️ Falha ao deletar da Uazapi:", deleteResult.error);
            // Continuar com a deleção do banco mesmo se falhar na API
          }
        }
      } catch (apiError) {
        console.warn("⚠️ Erro ao deletar da Uazapi:", apiError);
        // Continuar com a deleção do banco mesmo se falhar na API
      }
    } else {
      // Evolution API (padrão)
      console.log("🔄 Deletando instância da Evolution API...");
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
        console.warn("⚠️ Não foi possível buscar configuração da Evolution API");
      } else {
        const integrations = await integrationResponse.json();

        if (integrations && integrations.length > 0) {
          const config = integrations[0].config;

          if (config?.apiUrl && config?.apiKey) {
            try {
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
                  `⚠️ Falha ao deletar da Evolution API: ${deleteResponse.status}`
                );
                // Continuar com a deleção do banco mesmo se falhar na API
              } else {
                console.log("✅ Instância deletada da Evolution API com sucesso");
              }
            } catch (apiError) {
              console.warn("⚠️ Erro ao deletar da Evolution API:", apiError);
              // Continuar com a deleção do banco mesmo se falhar na API
            }
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
