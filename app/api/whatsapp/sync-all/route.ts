import { type NextRequest, NextResponse } from "next/server";
import { getUazapiInstanceStatusServer } from "@/lib/uazapi-server";
import { query, queryMany } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Sincronização FORÇADA de TODAS as conexões (Evolution + Uazapi)");

    // Buscar todas as conexões WhatsApp (incluindo api_type e instance_token)
    const connections = await queryMany(
      'SELECT id, instance_name, instance_token, api_type, status FROM whatsapp_connections'
    );

    if (!connections || connections.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhuma conexão para sincronizar",
        synced: 0,
      });
    }

    // Buscar configuração da Evolution API (se houver conexões Evolution)
    const hasEvolutionConnections = connections.some((c: any) => !c.api_type || c.api_type === "evolution");
    let evolutionConfig: any = null;

    if (hasEvolutionConnections) {
      const integrations = await queryMany(
        'SELECT config FROM integrations WHERE type = $1 AND is_active = true',
        ['evolution_api']
      );
      if (integrations && integrations.length > 0) {
        evolutionConfig = integrations[0].config;
      }
    }

    // Sincronizar cada conexão
    const syncResults = [];
    let syncedCount = 0;
    let errorCount = 0;

    for (const connection of connections) {
      try {
        const apiType = connection.api_type || "evolution";
        let realStatus = "disconnected";
        let phoneNumber = null;

        console.log(`🔄 Sincronizando ${connection.instance_name} (${apiType})`);

        // ==================== ROTEAR PARA A API CORRETA ====================

        if (apiType === "uazapi") {
          // ========== UAZAPI ==========
          const result = await getUazapiInstanceStatusServer(connection.instance_token);

          if (result.success && result.data) {
            // O campo instance.status já vem com os valores corretos: "disconnected", "connecting", "connected"
            realStatus = result.data?.instance?.status || "disconnected";
            
            // Extrair número de telefone do owner ou jid
            phoneNumber = result.data?.instance?.owner || result.data?.status?.jid?.user || null;

            console.log(`✅ Uazapi ${connection.instance_name}: ${realStatus} ${phoneNumber ? `(${phoneNumber})` : '(sem número)'}`);
          } else {
            console.error(`⚠️ Uazapi ${connection.instance_name}: erro - ${result.error}`);
            errorCount++;
            syncResults.push({
              instanceName: connection.instance_name,
              apiType: "uazapi",
              error: result.error || "Erro na sincronização",
              updated: false,
            });
            continue;
          }
        } else {
          // ========== EVOLUTION API ==========
          if (!evolutionConfig?.apiUrl || !evolutionConfig?.apiKey) {
            console.warn(`⚠️ Evolution ${connection.instance_name}: API não configurada`);
            errorCount++;
            syncResults.push({
              instanceName: connection.instance_name,
              apiType: "evolution",
              error: "Evolution API não configurada",
              updated: false,
            });
            continue;
          }

          const statusResponse = await fetch(
            `${evolutionConfig.apiUrl}/instance/connectionState/${connection.instance_name}`,
            {
              method: "GET",
              headers: {
                apikey: evolutionConfig.apiKey,
              },
              signal: AbortSignal.timeout(5000), // 5 segundos timeout por conexão
            }
          );

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();

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

            phoneNumber =
              statusData?.instance?.wuid || statusData?.instance?.number || null;

            console.log(`✅ Evolution ${connection.instance_name}: ${realStatus}`);
          } else {
            console.error(`⚠️ Evolution ${connection.instance_name}: erro HTTP ${statusResponse.status}`);
          }
        }

        // Atualizar apenas se o status mudou ou phoneNumber foi obtido
        if (realStatus !== connection.status || phoneNumber) {
          const updateData: any = {
            status: realStatus,
            updated_at: new Date().toISOString(),
          };

          if (phoneNumber) {
            updateData.phone_number = phoneNumber;
          }

          await query(
            'UPDATE whatsapp_connections SET status = $1, updated_at = $2' +
              (phoneNumber ? ', phone_number = $3 WHERE id = $4' : ' WHERE id = $3'),
            phoneNumber
              ? [updateData.status, updateData.updated_at, phoneNumber, connection.id]
              : [updateData.status, updateData.updated_at, connection.id]
          );

          syncedCount++;
          syncResults.push({
            instanceName: connection.instance_name,
            apiType,
            oldStatus: connection.status,
            newStatus: realStatus,
            phoneNumber,
            updated: true,
          });

          console.log(`📝 ${connection.instance_name} (${apiType}): ${connection.status} → ${realStatus}`);
        } else {
          syncResults.push({
            instanceName: connection.instance_name,
            apiType,
            status: realStatus,
            updated: false,
            message: "Status já está correto",
          });
        }
      } catch (error: any) {
        console.error(`💥 Erro ao sincronizar ${connection.instance_name}:`, error);
        errorCount++;
        syncResults.push({
          instanceName: connection.instance_name,
          error: error.message || "Erro na sincronização",
          updated: false,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sincronização concluída: ${syncedCount} atualizadas, ${errorCount} erros`,
      synced: syncedCount,
      errors: errorCount,
      total: connections.length,
      results: syncResults,
    });
  } catch (error: any) {
    console.error("Erro na sincronização geral:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
