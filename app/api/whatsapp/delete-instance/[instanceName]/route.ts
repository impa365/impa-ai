import { type NextRequest, NextResponse } from "next/server";
import { getCurrentServerUser } from "@/lib/auth-server";
import { deleteUazapiInstanceServer } from "@/lib/uazapi-server";
import { logResourceDeleted, logAccessDenied } from "@/lib/security-audit";
import { query, queryOne, queryMany } from "@/lib/db";

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
      logAccessDenied(undefined, undefined, `/api/whatsapp/delete-instance/${instanceName}`, request, 'Token JWT inválido ou ausente')
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

    console.log("🔍 Buscando conexão com instance_name:", instanceName);

    // Buscar conexão incluindo api_type e instance_token
    const connections = await queryMany(
      'SELECT id, user_id, connection_name, api_type, instance_token FROM whatsapp_connections WHERE instance_name = $1',
      [instanceName]
    );

    console.log("📋 Conexões encontradas:", connections);

    if (!connections || connections.length === 0) {
      console.error("❌ Nenhuma conexão encontrada com instance_name:", instanceName);
      
      // Buscar todas as conexões do usuário para debug
      const allConnections = await queryMany(
        'SELECT id, instance_name, connection_name FROM whatsapp_connections WHERE user_id = $1',
        [user.id]
      );
      console.log("🔍 Todas as conexões do usuário:", allConnections);
      
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
      const integrations = await queryMany(
        'SELECT config FROM integrations WHERE type = $1 AND is_active = true',
        ['evolution_api']
      );

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

    // Deletar do banco de dados (sempre executar, mesmo se falhar na API)
    await query('DELETE FROM whatsapp_connections WHERE instance_name = $1', [instanceName]);

    // Log de auditoria - deleção bem-sucedida
    logResourceDeleted(user.id, user.email, 'connection', connection.id, request)

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
