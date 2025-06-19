import { type NextRequest, NextResponse } from "next/server"

// Função para buscar configuração da Evolution API (segura)
async function getEvolutionConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Configuração do banco não encontrada")
  }

  const response = await fetch(
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

  if (!response.ok) {
    throw new Error("Erro ao buscar configuração da Evolution API")
  }

  const integrations = await response.json()

  if (!integrations || integrations.length === 0) {
    throw new Error("Configuração da Evolution API não encontrada ou inativa")
  }

  const config = integrations[0].config as { apiUrl?: string; apiKey?: string }

  if (!config || typeof config !== "object") {
    throw new Error("Configuração da Evolution API está em formato inválido")
  }

  if (!config.apiUrl || config.apiUrl.trim() === "") {
    throw new Error("URL da Evolution API não está configurada")
  }

  return config
}

export async function GET(request: NextRequest, { params }: { params: { instanceName: string } }) {
  try {
    const { instanceName } = params

    if (!instanceName) {
      return NextResponse.json({ success: false, error: "Nome da instância é obrigatório" }, { status: 400 })
    }

    const config = await getEvolutionConfig()
    const url = `${config.apiUrl}/instance/fetchSettings/${instanceName}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        apikey: config.apiKey || "",
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "Erro ao buscar configurações da Evolution API" },
        { status: response.status },
      )
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      settings: result,
      source: "evolution_api",
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { instanceName: string } }) {
  try {
    const { instanceName } = params
    const settings = await request.json()

    if (!instanceName) {
      return NextResponse.json({ success: false, error: "Nome da instância é obrigatório" }, { status: 400 })
    }

    const config = await getEvolutionConfig()
    const url = `${config.apiUrl}/instance/setSettings/${instanceName}`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.apiKey || "",
      },
      body: JSON.stringify(settings),
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "Erro ao salvar configurações na Evolution API" },
        { status: response.status },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Configurações salvas com sucesso na Evolution API",
      source: "evolution_api",
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
