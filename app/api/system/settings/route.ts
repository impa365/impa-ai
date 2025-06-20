import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 })
    }

    // Buscar configurações da tabela system_settings
    const response = await fetch(`${supabaseUrl}/rest/v1/system_settings?select=*`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Accept-Profile": "impaai",
        "Content-Profile": "impaai",
      },
    })

    if (!response.ok) {
      // Retornar valores padrão se a tabela não existir
      return NextResponse.json({
        success: true,
        settings: {
          default_whatsapp_connections_limit: 1,
          default_agents_limit: 2,
          allow_public_registration: false,
        },
      })
    }

    const settingsArray = await response.json()

    // Converter array de configurações para objeto
    const settings: Record<string, any> = {}

    if (Array.isArray(settingsArray)) {
      settingsArray.forEach((setting: any) => {
        // Converter string para tipo apropriado
        let value = setting.setting_value

        // Tentar converter para número
        if (!isNaN(value) && !isNaN(Number.parseFloat(value))) {
          value = Number.parseFloat(value)
        }
        // Tentar converter para boolean
        else if (value === "true" || value === "false") {
          value = value === "true"
        }

        settings[setting.setting_key] = value
      })
    }

    // Garantir valores padrão
    const finalSettings = {
      default_whatsapp_connections_limit: settings.default_whatsapp_connections_limit || 1,
      default_agents_limit: settings.default_agents_limit || 2,
      allow_public_registration: settings.allow_public_registration || false,
      app_name: settings.app_name || "Impa AI",
      app_version: settings.app_version || "1.0.0",
      ...settings,
    }

    return NextResponse.json({
      success: true,
      settings: finalSettings,
    })
  } catch (error: any) {
    console.error("Erro ao buscar configurações:", error.message)
    return NextResponse.json({
      success: false,
      settings: {
        default_whatsapp_connections_limit: 1,
        default_agents_limit: 2,
        allow_public_registration: false,
      },
      error: error.message,
    })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Configuração do servidor incompleta",
        },
        { status: 500 },
      )
    }

    // Processar cada configuração individualmente
    const updates = []

    for (const [key, value] of Object.entries(body)) {
      // Pular chaves que não são configurações
      if (key.startsWith("theme_") || key === "success" || key === "settings") {
        continue
      }

      try {
        // Verificar se a configuração já existe
        const checkResponse = await fetch(`${supabaseUrl}/rest/v1/system_settings?select=id&setting_key=eq.${key}`, {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            "Accept-Profile": "impaai",
            "Content-Profile": "impaai",
          },
        })

        const existing = await checkResponse.json()
        const settingExists = Array.isArray(existing) && existing.length > 0

        if (settingExists) {
          // Atualizar configuração existente
          const updateResponse = await fetch(`${supabaseUrl}/rest/v1/system_settings?setting_key=eq.${key}`, {
            method: "PATCH",
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
              "Accept-Profile": "impaai",
              "Content-Profile": "impaai",
            },
            body: JSON.stringify({
              setting_value: String(value),
              updated_at: new Date().toISOString(),
            }),
          })

          if (updateResponse.ok) {
            updates.push(`${key}: atualizado`)
          } else {
            const errorText = await updateResponse.text()
            console.error(`Erro ao atualizar ${key}:`, errorText)
          }
        } else {
          // Criar nova configuração
          const createResponse = await fetch(`${supabaseUrl}/rest/v1/system_settings`, {
            method: "POST",
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
              "Accept-Profile": "impaai",
              "Content-Profile": "impaai",
            },
            body: JSON.stringify({
              setting_key: key,
              setting_value: String(value),
              category: key.includes("limit") ? "limits" : "general",
              description: `Configuração do sistema para a chave ${key}`,
              is_public: false,
              requires_restart: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }),
          })

          if (createResponse.ok) {
            updates.push(`${key}: criado`)
          } else {
            const errorText = await createResponse.text()
            console.error(`Erro ao criar ${key}:`, errorText)
          }
        }
      } catch (settingError: any) {
        console.error(`Erro ao processar configuração ${key}:`, settingError.message)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Configurações salvas com sucesso! (${updates.length} atualizações)`,
      updates: updates,
    })
  } catch (error: any) {
    console.error("Erro ao salvar configurações:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: `Erro ao salvar configurações: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
