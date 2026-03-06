import { type NextRequest, NextResponse } from "next/server";
import { getCurrentServerUser } from "@/lib/auth-server";
import { query, queryMany } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Iniciando sincronização das conexões do usuário...");

    // Verificar autenticação
    const user = await getCurrentServerUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    console.log(`👤 Sincronizando conexões do usuário: ${user.email}`);

    // Buscar conexões do usuário
    const connections = await queryMany(
      'SELECT * FROM whatsapp_connections WHERE user_id = $1',
      [user.id]
    );

    if (!connections || connections.length === 0) {
      console.log("ℹ️ Nenhuma conexão encontrada para o usuário");
      return NextResponse.json({
        success: true,
        syncedCount: 0,
        message: "Nenhuma conexão para sincronizar",
      });
    }

    console.log(
      `📊 Encontradas ${connections.length} conexões para sincronizar`
    );

    // Buscar configuração da Evolution API
    const integrations = await queryMany(
      'SELECT config FROM integrations WHERE type = $1 AND is_active = true',
      ['evolution_api']
    );

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

    let syncedCount = 0;
    const results = [];

    // Sincronizar cada conexão
    for (const connection of connections) {
      try {
        console.log(
          `🔄 Sincronizando: ${connection.connection_name} (${connection.instance_name})`
        );

        // Verificar status na Evolution API com timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos

        let newStatus = connection.status;
        let phoneNumber = connection.phone_number;

        try {
          const statusResponse = await fetch(
            `${config.apiUrl}/instance/connectionState/${connection.instance_name}`,
            {
              method: "GET",
              headers: {
                apikey: config.apiKey,
              },
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();

            // Mapear status da Evolution API
            if (statusData?.instance?.state) {
              switch (statusData.instance.state) {
                case "open":
                  newStatus = "connected";
                  phoneNumber =
                    statusData.instance?.wuid ||
                    statusData.instance?.number ||
                    phoneNumber;
                  break;
                case "connecting":
                  newStatus = "connecting";
                  break;
                case "close":
                default:
                  newStatus = "disconnected";
                  break;
              }
            }
          } else {
            console.warn(
              `⚠️ Erro ao verificar status da instância ${connection.instance_name}: ${statusResponse.status}`
            );
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === "AbortError") {
            console.warn(
              `⏱️ Timeout ao verificar status da instância ${connection.instance_name}`
            );
          } else {
            console.warn(
              `⚠️ Erro de rede ao verificar instância ${connection.instance_name}:`,
              fetchError.message
            );
          }
        }

        // Atualizar no banco se houve mudança
        if (
          newStatus !== connection.status ||
          phoneNumber !== connection.phone_number
        ) {
          const updateData: any = {
            status: newStatus,
            updated_at: new Date().toISOString(),
          };

          if (phoneNumber && phoneNumber !== connection.phone_number) {
            updateData.phone_number = phoneNumber;
          }

          try {
            await query(
              'UPDATE whatsapp_connections SET status = $1, updated_at = $2' +
                (updateData.phone_number ? ', phone_number = $3 WHERE id = $4' : ' WHERE id = $3'),
              updateData.phone_number
                ? [updateData.status, updateData.updated_at, updateData.phone_number, connection.id]
                : [updateData.status, updateData.updated_at, connection.id]
            );
            console.log(
              `✅ Conexão ${connection.connection_name} atualizada: ${connection.status} → ${newStatus}`
            );
            syncedCount++;
            results.push({
              connectionName: connection.connection_name,
              success: true,
              oldStatus: connection.status,
              newStatus: newStatus,
            });
          } catch (updateError) {
            console.error(
              `❌ Erro ao atualizar conexão ${connection.connection_name}`
            );
            results.push({
              connectionName: connection.connection_name,
              success: false,
              error: "Erro ao atualizar no banco",
            });
          }
        } else {
          console.log(
            `ℹ️ Conexão ${connection.connection_name} já está atualizada`
          );
          syncedCount++;
          results.push({
            connectionName: connection.connection_name,
            success: true,
            status: "unchanged",
          });
        }
      } catch (error: any) {
        console.error(
          `💥 Erro ao sincronizar conexão ${connection.connection_name}:`,
          error
        );
        results.push({
          connectionName: connection.connection_name,
          success: false,
          error: error.message || "Erro interno",
        });
      }
    }

    console.log(
      `✅ Sincronização do usuário concluída: ${syncedCount}/${connections.length} conexões`
    );

    return NextResponse.json({
      success: true,
      syncedCount,
      totalConnections: connections.length,
      results,
      message: `${syncedCount} conexões sincronizadas com sucesso`,
    });
  } catch (error: any) {
    console.error("💥 Erro na sincronização do usuário:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
