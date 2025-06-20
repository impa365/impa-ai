import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: "Configuração não encontrada" }, { status: 500 })
    }

    // Buscar apenas conexões que não foram atualizadas nos últimos 2 minutos
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()

    const connectionsResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?select=id,instance_name,status,updated_at&updated_at=lt.${twoMinutesAgo}`,
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
      return NextResponse.json({ success: true, message: "Nenhuma conexão precisa ser sincronizada", synced: 0 })
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

    // Sincronizar apenas as primeiras 5 conexões para não sobrecarregar
    const connectionsToSync = connections.slice(0, 5)
    let syncedCount = 0

    for (const connection of connectionsToSync) {
      try {
        // Verificar status na Evolution API
        const statusResponse = await fetch(`${config.apiUrl}/instance/connectionState/${connection.instance_name}`, {
          method: "GET",
          headers: {
            apikey: config.apiKey,
          },
          signal: AbortSignal.timeout(3000), // 3 segundos timeout por conexão
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
        }
      } catch (error) {
        // Silently handle individual connection errors
        continue
      }
    }

    return NextResponse.json({
      success: true,
      message: `Auto-sync: ${syncedCount} conexões atualizadas`,
      synced: syncedCount,
      checked: connectionsToSync.length,
    })
  } catch (error: any) {
    console.error("Erro na sincronização automática:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
