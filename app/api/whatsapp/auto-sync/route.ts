import { type NextRequest, NextResponse } from "next/server"
import { getUazapiInstanceStatusServer } from "@/lib/uazapi-server"

export async function POST(request: NextRequest) {
  try {
    // Verificar se é uma sincronização forçada (manual)
    const body = await request.json().catch(() => ({}))
    const forceSync = body?.force === true

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: "Configuração não encontrada" }, { status: 500 })
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    // Se for sincronização forçada, buscar TODAS as conexões
    // Senão, buscar apenas conexões que não foram atualizadas nos últimos 2 minutos
    let connectionUrl = `${supabaseUrl}/rest/v1/whatsapp_connections?select=id,instance_name,instance_token,api_type,status,updated_at`
    
    if (!forceSync) {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
      connectionUrl += `&updated_at=lt.${twoMinutesAgo}`
    }

    console.log(forceSync ? "🔄 Sincronização FORÇADA (manual)" : "🔄 Sincronização automática (2+ min)")

    const connectionsResponse = await fetch(connectionUrl, { headers })

    if (!connectionsResponse.ok) {
      return NextResponse.json({ success: false, error: "Erro ao buscar conexões" }, { status: 500 })
    }

    const connections = await connectionsResponse.json()

    if (!connections || connections.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhuma conexão precisa ser sincronizada",
        synced: 0,
      })
    }

    // Buscar configuração da Evolution API (apenas se houver conexões Evolution)
    const hasEvolutionConnections = connections.some((c: any) => !c.api_type || c.api_type === "evolution")
    let evolutionConfig: any = null

    if (hasEvolutionConnections) {
      const integrationResponse = await fetch(
        `${supabaseUrl}/rest/v1/integrations?type=eq.evolution_api&is_active=eq.true&select=config`,
        { headers }
      )

      if (integrationResponse.ok) {
        const integrations = await integrationResponse.json()
        if (integrations && integrations.length > 0) {
          evolutionConfig = integrations[0].config
        }
      }
    }

    // Sincronizar apenas as primeiras 5 conexões para não sobrecarregar
    const connectionsToSync = connections.slice(0, 5)
    let syncedCount = 0
    let syncDetails: any[] = []

    for (const connection of connectionsToSync) {
      try {
        const apiType = connection.api_type || "evolution"
        let realStatus = "disconnected"
        let phoneNumber = null

        // ==================== ROTEAR PARA A API CORRETA ====================

        if (apiType === "uazapi") {
          // ========== UAZAPI ==========
          console.log("🔄 Auto-sync Uazapi:", connection.instance_name)

          const result = await getUazapiInstanceStatusServer(connection.instance_token)

          if (result.success && result.data) {
            // O campo instance.status já vem com os valores corretos: "disconnected", "connecting", "connected"
            realStatus = result.data?.instance?.status || "disconnected"
            
            // Extrair número de telefone do owner ou jid
            phoneNumber = result.data?.instance?.owner || result.data?.status?.jid?.user || null

            console.log(`✅ Uazapi ${connection.instance_name}: ${realStatus} ${phoneNumber ? `(${phoneNumber})` : '(sem número)'}`)
            console.log(`📊 Dados completos:`, JSON.stringify({
              instanceStatus: result.data?.instance?.status,
              statusConnected: result.data?.status?.connected,
              statusLoggedIn: result.data?.status?.loggedIn,
              owner: result.data?.instance?.owner,
              jid: result.data?.status?.jid
            }))
          } else {
            console.log(`⚠️ Uazapi ${connection.instance_name}: erro ao verificar status - ${result.error}`)
          }
        } else {
          // ========== EVOLUTION API ==========
          if (!evolutionConfig?.apiUrl || !evolutionConfig?.apiKey) {
            console.log(`⚠️ Evolution ${connection.instance_name}: API não configurada`)
            continue
          }

          console.log("🔄 Auto-sync Evolution:", connection.instance_name)

          // Verificar status na Evolution API com timeout
          const statusResponse = await fetch(
            `${evolutionConfig.apiUrl}/instance/connectionState/${connection.instance_name}`,
            {
              method: "GET",
              headers: {
                apikey: evolutionConfig.apiKey,
              },
              signal: AbortSignal.timeout(3000), // 3 segundos timeout
            }
          )

          if (statusResponse.ok) {
            const statusData = await statusResponse.json()

            if (statusData?.instance?.state) {
              switch (statusData.instance.state) {
                case "open":
                  realStatus = "connected"
                  break
                case "connecting":
                  realStatus = "connecting"
                  break
                case "close":
                default:
                  realStatus = "disconnected"
                  break
              }
            }

            phoneNumber = statusData?.instance?.wuid || statusData?.instance?.number || null
            console.log(`✅ Evolution ${connection.instance_name}: ${realStatus}`)
          }
        }

        // Atualizar apenas se o status mudou
        if (realStatus !== connection.status) {
          const updateData: any = {
            status: realStatus,
            updated_at: new Date().toISOString(),
          }

          if (phoneNumber) {
            updateData.phone_number = phoneNumber
          }

          await fetch(`${supabaseUrl}/rest/v1/whatsapp_connections?id=eq.${connection.id}`, {
            method: "PATCH",
            headers: {
              ...headers,
              Prefer: "return=minimal",
            },
            body: JSON.stringify(updateData),
          })

          syncedCount++
          syncDetails.push({
            instance: connection.instance_name,
            apiType,
            oldStatus: connection.status,
            newStatus: realStatus,
          })

          console.log(
            `📝 Atualizado ${connection.instance_name} (${apiType}): ${connection.status} → ${realStatus}`
          )
        } else {
          console.log(`ℹ️ ${connection.instance_name} (${apiType}): sem mudanças (${realStatus})`)
        }
      } catch (error: any) {
        console.error(`❌ Erro ao sincronizar ${connection.instance_name}:`, error.message)
        // Silently handle individual connection errors
        continue
      }
    }

    console.log(`🔄 Auto-sync completo: ${syncedCount}/${connectionsToSync.length} atualizadas`)

    return NextResponse.json({
      success: true,
      message: `Auto-sync: ${syncedCount} conexões atualizadas`,
      synced: syncedCount,
      checked: connectionsToSync.length,
      details: syncDetails,
    })
  } catch (error: any) {
    console.error("❌ Erro na sincronização automática:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
