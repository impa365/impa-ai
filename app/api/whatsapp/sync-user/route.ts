import { type NextRequest, NextResponse } from "next/server";
import { getCurrentServerUser } from "@/lib/auth-server";

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

    // Usar a mesma lógica do admin, mas filtrada por usuário
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: "Configuração não encontrada" },
        { status: 500 }
      );
    }

    // Buscar conexões do usuário
    const connectionsResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?user_id=eq.${user.id}&select=*`,
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

    if (!connectionsResponse.ok) {
      console.error("❌ Erro ao buscar conexões do usuário");
      return NextResponse.json(
        { success: false, error: "Erro ao buscar conexões" },
        { status: 500 }
      );
    }

    const connections = await connectionsResponse.json();

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
      console.error("❌ Erro ao buscar configuração da Evolution API");
      return NextResponse.json(
        {
          success: false,
          error: "Configuração da Evolution API não encontrada",
        },
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

          const updateResponse = await fetch(
            `${supabaseUrl}/rest/v1/whatsapp_connections?id=eq.${connection.id}`,
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

          if (updateResponse.ok) {
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
          } else {
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
