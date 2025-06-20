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

    // Verificar status na Evolution API
    const statusResponse = await fetch(`${config.apiUrl}/instance/connectionState/${instanceName}`, {
      method: "GET",
      headers: {
        apikey: config.apiKey,
      },
    })

    if (!statusResponse.ok) {
      return NextResponse.json({ success: false, error: "Erro ao verificar status" }, { status: 500 })
    }

    const statusData = await statusResponse.json()

    let status = "disconnected"
    if (statusData?.instance?.state) {
      switch (statusData.instance.state) {
        case "open":
          status = "connected"
          break
        case "connecting":
          status = "connecting"
          break
        default:
          status = "disconnected"
      }
    }

    // Atualizar status no banco
    await fetch(`${supabaseUrl}/rest/v1/whatsapp_connections?instance_name=eq.${instanceName}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Accept-Profile": "impaai",
        "Content-Profile": "impaai",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        status: status,
        updated_at: new Date().toISOString(),
      }),
    })

    return NextResponse.json({
      success: true,
      status: status,
      phoneNumber: statusData?.instance?.wuid || null,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
