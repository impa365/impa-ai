import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: "Configuração não encontrada" }, { status: 500 })
    }

    // Buscar todas as conexões WhatsApp
    const connectionsResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?select=id,instance_name,status`,
      {
        headers: {
          "Content-Type": "application/json",
          "Accept-Profile": "impaai",
          "Content-Profile": "impaai",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      },
    )

    if (!connectionsResponse.ok) {
      return NextResponse.json({ success: false, error: "Erro ao buscar conexões" }, { status: 500 })
    }

    const connections = await connectionsResponse.json()

    if (!connections || connections.length === 0) {
      return NextResponse.json({ success: true, message: "Nenhuma conexão para sincronizar", synced: 0 })
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
      },
    )

    if (!integrationResponse.ok) {
      return NextResponse.json({ success: false, error: "Erro ao buscar configuração da API" }, { status: 500 })
    }

    const integrations = await integrationResponse.json()

    if (!integrations || integrations.length === 0) {
      return NextResponse.json({ success: false, error: "Evolution API não configurada" }, { status: 500 })
    }

    const config = integrations[0].config

    if (!config?.apiUrl || !config?.apiKey) {
      return NextResponse.json({ success: false, error: "Configuração da Evolution API incompleta" }, { status: 500 })
    }

    // Sincronizar cada conexão
    const syncResults = []
    let syncedCount = 0
    let errorCount = 0

    for (const connection of connections) {
      try {
        // Verificar status na Evolution API
        const statusResponse = await fetch(`${config.apiUrl}/instance/connectionState/${connection.instance_name}`, {
          method: "GET",
          headers: {
            apikey: config.apiKey,
          },
          signal: AbortSignal.timeout(5000), // 5 segundos timeout por conexão
        })

        let realStatus = "disconnected"
        let phoneNumber = null

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
              "Content-Type": "application/json",
              "Accept-Profile": "impaai",
              "Content-Profile": "impaai",
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              Prefer: "return=minimal",
            },
            body: JSON.stringify(updateData),
          })

          syncedCount++
          syncResults.push({
            instanceName: connection.instance_name,
            oldStatus: connection.status,
            newStatus: realStatus,
            updated: true,
          })
        } else {
          syncResults.push({
            instanceName: connection.instance_name,
            status: realStatus,
            updated: false,
            message: "Status já está correto",
          })
        }
      } catch (error) {
        errorCount++
        syncResults.push({
          instanceName: connection.instance_name,
          error: "Erro na sincronização",
          updated: false,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sincronização concluída: ${syncedCount} atualizadas, ${errorCount} erros`,
      synced: syncedCount,
      errors: errorCount,
      total: connections.length,
      results: syncResults,
    })
  } catch (error: any) {
    console.error("Erro na sincronização geral:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
