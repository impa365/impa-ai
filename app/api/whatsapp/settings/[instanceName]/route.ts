import { type NextRequest, NextResponse } from "next/server"

// Função para buscar configuração da Evolution API de forma segura
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

  if (!config.apiKey || config.apiKey.trim() === "") {
    throw new Error("API Key da Evolution API não está configurada")
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

    // Endpoint correto da Evolution API para buscar configurações
    const url = `${config.apiUrl}/settings/find/${instanceName}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 segundos

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          apikey: config.apiKey,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        // Se a API retornar erro, usar configurações padrão
        const defaultSettings = {
          rejectCall: false,
          msgCall: "",
          groupsIgnore: false,
          alwaysOnline: false,
          readMessages: false,
          readStatus: false,
          syncFullHistory: false,
        }

        return NextResponse.json({
          success: true,
          settings: defaultSettings,
          source: "default",
          warning: `Evolution API retornou erro ${response.status}. Usando configurações padrão.`,
        })
      }

      const result = await response.json()

      return NextResponse.json({
        success: true,
        settings: result,
        source: "evolution_api",
      })
    } catch (fetchError: any) {
      clearTimeout(timeoutId)

      // Se houver erro de conexão, usar configurações padrão
      const defaultSettings = {
        rejectCall: false,
        msgCall: "",
        groupsIgnore: false,
        alwaysOnline: false,
        readMessages: false,
        readStatus: false,
        syncFullHistory: false,
      }

      return NextResponse.json({
        success: true,
        settings: defaultSettings,
        source: "default",
        warning: "Evolution API indisponível. Usando configurações padrão.",
      })
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao processar solicitação",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: { instanceName: string } }) {
  try {
    const { instanceName } = params
    const settings = await request.json()

    if (!instanceName) {
      return NextResponse.json({ success: false, error: "Nome da instância é obrigatório" }, { status: 400 })
    }

    // Validar estrutura dos dados
    const requiredFields = [
      "rejectCall",
      "groupsIgnore",
      "alwaysOnline",
      "readMessages",
      "readStatus",
      "syncFullHistory",
    ]
    for (const field of requiredFields) {
      if (typeof settings[field] !== "boolean") {
        return NextResponse.json({ success: false, error: `Campo ${field} deve ser um boolean` }, { status: 400 })
      }
    }

    const config = await getEvolutionConfig()

    // Endpoint correto da Evolution API para salvar configurações
    const url = `${config.apiUrl}/settings/set/${instanceName}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 segundos para salvar

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          apikey: config.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rejectCall: settings.rejectCall,
          msgCall: settings.msgCall || "",
          groupsIgnore: settings.groupsIgnore,
          alwaysOnline: settings.alwaysOnline,
          readMessages: settings.readMessages,
          syncFullHistory: settings.syncFullHistory,
          readStatus: settings.readStatus,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        return NextResponse.json(
          {
            success: false,
            error: `Erro ao salvar na Evolution API (${response.status})`,
            details: errorText || "Erro desconhecido",
          },
          { status: response.status },
        )
      }

      const result = await response.json()

      return NextResponse.json({
        success: true,
        message: "Configurações salvas com sucesso na Evolution API",
        data: result,
        source: "evolution_api",
      })
    } catch (fetchError: any) {
      clearTimeout(timeoutId)

      return NextResponse.json(
        {
          success: false,
          error: "Erro ao conectar com a Evolution API",
          details: fetchError.name === "AbortError" ? "Timeout na requisição" : fetchError.message,
        },
        { status: 503 },
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
