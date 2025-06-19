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

    // Se já estiver conectado, não precisa de QR Code
    if (connection.status === "connected") {
      return NextResponse.json({
        success: true,
        status: "connected",
        qrCode: null,
        message: "Conexão já está ativa",
      })
    }

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
      return NextResponse.json(
        { success: false, error: "Configuração da Evolution API não encontrada" },
        { status: 500 },
      )
    }

    const integrations = await integrationsResponse.json()

    if (!integrations || integrations.length === 0) {
      return NextResponse.json({ success: false, error: "Evolution API não configurada" }, { status: 500 })
    }

    const evolutionConfig = integrations[0].config

    // Buscar QR Code da Evolution API
    try {
      const qrResponse = await fetch(`${evolutionConfig.apiUrl}/instance/connect/${connection.instance_name}`, {
        method: "GET",
        headers: {
          apikey: evolutionConfig.apiKey,
        },
      })

      if (!qrResponse.ok) {
        return NextResponse.json({ success: false, error: "Erro ao gerar QR Code" }, { status: 500 })
      }

      const qrData = await qrResponse.json()

      return NextResponse.json({
        success: true,
        qrCode: qrData.base64 || qrData.qrcode,
        status: connection.status,
      })
    } catch (evolutionError) {
      return NextResponse.json({ success: false, error: "Erro ao conectar com Evolution API" }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
