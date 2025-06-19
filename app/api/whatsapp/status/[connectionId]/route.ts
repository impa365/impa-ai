import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { connectionId: string } }) {
  try {
    const { connectionId } = params

    if (!connectionId) {
      return NextResponse.json({ success: false, error: "ID da conexão é obrigatório" }, { status: 400 })
    }

    // Verificar variáveis de ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: "Configuração do banco não encontrada" }, { status: 500 })
    }

    // Buscar informações da conexão
    const response = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?id=eq.${connectionId}&select=instance_name,status`,
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

    if (!response.ok) {
      return NextResponse.json({ success: false, error: "Erro ao buscar conexão" }, { status: 500 })
    }

    const connections = await response.json()

    if (!connections || connections.length === 0) {
      return NextResponse.json({ success: false, error: "Conexão não encontrada" }, { status: 404 })
    }

    const connection = connections[0]

    // Buscar configurações da Evolution API
    const integrationsResponse = await fetch(
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

    if (!integrationsResponse.ok) {
      return NextResponse.json({
        success: true,
        status: connection.status || "disconnected",
      })
    }

    const integrations = await integrationsResponse.json()

    if (!integrations || integrations.length === 0) {
      return NextResponse.json({
        success: true,
        status: connection.status || "disconnected",
      })
    }

    const evolutionConfig = integrations[0].config

    // Verificar status na Evolution API
    try {
      const statusResponse = await fetch(
        `${evolutionConfig.apiUrl}/instance/connectionState/${connection.instance_name}`,
        {
          method: "GET",
          headers: {
            apikey: evolutionConfig.apiKey,
          },
        },
      )

      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        let mappedStatus = "disconnected"

        if (statusData.instance?.state === "open") {
          mappedStatus = "connected"
        } else if (statusData.instance?.state === "connecting") {
          mappedStatus = "connecting"
        }

        // Atualizar status no banco se diferente
        if (mappedStatus !== connection.status) {
          await fetch(`${supabaseUrl}/rest/v1/whatsapp_connections?id=eq.${connectionId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "Accept-Profile": "impaai",
              "Content-Profile": "impaai",
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              status: mappedStatus,
              updated_at: new Date().toISOString(),
            }),
          })
        }

        return NextResponse.json({
          success: true,
          status: mappedStatus,
        })
      }
    } catch (evolutionError) {
      // Se não conseguir verificar na Evolution API, retorna status do banco
    }

    return NextResponse.json({
      success: true,
      status: connection.status || "disconnected",
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
