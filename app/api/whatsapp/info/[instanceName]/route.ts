import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { instanceName: string } }) {
  try {
    const { instanceName } = params

    if (!instanceName) {
      return NextResponse.json({ success: false, error: "Nome da instância é obrigatório" }, { status: 400 })
    }

    // Buscar configuração da Evolution API
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: "Configuração não encontrada" }, { status: 500 })
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

    // Buscar informações da instância
    const infoResponse = await fetch(`${config.apiUrl}/instance/fetchInstances?instanceName=${instanceName}`, {
      method: "GET",
      headers: {
        apikey: config.apiKey,
      },
    })

    if (!infoResponse.ok) {
      return NextResponse.json({ success: false, error: "Erro ao buscar informações" }, { status: 500 })
    }

    const infoData = await infoResponse.json()

    // Buscar status da conexão
    const statusResponse = await fetch(`${config.apiUrl}/instance/connectionState/${instanceName}`, {
      method: "GET",
      headers: {
        apikey: config.apiKey,
      },
    })

    const connectionInfo = {
      status: "disconnected",
      phoneNumber: null,
      profileName: null,
      lastSeen: null,
      isOnline: false,
      platform: null,
    }

    if (statusResponse.ok) {
      const statusData = await statusResponse.json()

      if (statusData?.instance) {
        connectionInfo.status =
          statusData.instance.state === "open"
            ? "connected"
            : statusData.instance.state === "connecting"
              ? "connecting"
              : "disconnected"
        connectionInfo.phoneNumber = statusData.instance.wuid || null
        connectionInfo.profileName = statusData.instance.profileName || null
        connectionInfo.isOnline = statusData.instance.state === "open"
        connectionInfo.platform = statusData.instance.platform || null
      }
    }

    // Buscar informações adicionais se conectado
    if (connectionInfo.status === "connected") {
      try {
        const profileResponse = await fetch(`${config.apiUrl}/chat/whatsappProfile/${instanceName}`, {
          method: "GET",
          headers: {
            apikey: config.apiKey,
          },
        })

        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          if (profileData) {
            connectionInfo.profileName = profileData.name || connectionInfo.profileName
            connectionInfo.lastSeen = profileData.lastSeen || null
          }
        }
      } catch (error) {
        // Silently handle profile fetch errors
      }
    }

    return NextResponse.json({
      success: true,
      info: connectionInfo,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
