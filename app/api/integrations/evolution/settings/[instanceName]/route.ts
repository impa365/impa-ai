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
      return NextResponse.json({ success: false, error: "Configuração do banco não encontrada" }, { status: 500 })
    }

    const { data: integrationData } = await fetch(
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
    ).then((res) => res.json())

    if (!integrationData || integrationData.length === 0) {
      return NextResponse.json({ success: false, error: "Evolution API não configurada" }, { status: 404 })
    }

    const config = integrationData[0].config
    if (!config?.apiUrl || !config?.apiKey) {
      return NextResponse.json({ success: false, error: "Configuração da Evolution API incompleta" }, { status: 404 })
    }

    // Tentar buscar configurações da Evolution API com timeout
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 segundos

      const apiUrl = `${config.apiUrl}/instance/fetchSettings/${instanceName}`
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          apikey: config.apiKey,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`API retornou status ${response.status}`)
      }

      const data = await response.json()

      return NextResponse.json({
        success: true,
        settings: data,
        source: "evolution_api",
      })
    } catch (fetchError: any) {
      // Se falhar na Evolution API, retornar configurações padrão
      const defaultSettings = {
        groupsIgnore: false,
        readMessages: true,
        alwaysOnline: false,
        readStatus: true,
        rejectCall: false,
        msgCall: "Não posso atender no momento, envie uma mensagem.",
        syncFullHistory: false,
      }

      return NextResponse.json({
        success: true,
        settings: defaultSettings,
        source: "default",
        warning: "Evolution API indisponível. Usando configurações padrão.",
      })
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { instanceName: string } }) {
  try {
    const { instanceName } = params
    const settings = await request.json()

    if (!instanceName) {
      return NextResponse.json({ success: false, error: "Nome da instância é obrigatório" }, { status: 400 })
    }

    // Buscar configuração da Evolution API
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: "Configuração do banco não encontrada" }, { status: 500 })
    }

    const { data: integrationData } = await fetch(
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
    ).then((res) => res.json())

    if (!integrationData || integrationData.length === 0) {
      return NextResponse.json({ success: false, error: "Evolution API não configurada" }, { status: 404 })
    }

    const config = integrationData[0].config
    if (!config?.apiUrl || !config?.apiKey) {
      return NextResponse.json({ success: false, error: "Configuração da Evolution API incompleta" }, { status: 404 })
    }

    // Tentar salvar na Evolution API
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos para salvar

      const apiUrl = `${config.apiUrl}/instance/setSettings/${instanceName}`
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          apikey: config.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`API retornou status ${response.status}`)
      }

      return NextResponse.json({
        success: true,
        message: "Configurações salvas com sucesso na Evolution API",
        source: "evolution_api",
      })
    } catch (fetchError: any) {
      return NextResponse.json(
        {
          success: false,
          error: `Erro ao salvar na Evolution API: ${fetchError.message}`,
          details: "Verifique se a Evolution API está funcionando corretamente",
        },
        { status: 503 },
      )
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
