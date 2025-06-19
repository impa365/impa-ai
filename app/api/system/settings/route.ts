import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 })
    }

    // Buscar configurações via REST API
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
        settings: {
          default_whatsapp_connections_limit: 1,
          default_agents_limit: 2,
          allow_public_registration: false,
        },
      })
    }

    const settings = await response.json()

    // Converter array de configurações em objeto
    const settingsObj: Record<string, any> = {}
    settings.forEach((setting: any) => {
      settingsObj[setting.setting_key] = setting.setting_value
    })

    // Garantir valores padrão
    const finalSettings = {
      default_whatsapp_connections_limit: settingsObj.default_whatsapp_connections_limit || 1,
      default_agents_limit: settingsObj.default_agents_limit || 2,
      allow_public_registration: settingsObj.allow_public_registration || false,
      ...settingsObj,
    }

    return NextResponse.json({ settings: finalSettings })
  } catch (error: any) {
    console.error("Erro ao buscar configurações:", error.message)
    // Retornar valores padrão em caso de erro
    return NextResponse.json({
      settings: {
        default_whatsapp_connections_limit: 1,
        default_agents_limit: 2,
        allow_public_registration: false,
      },
    })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 })
    }

    // Preparar configurações para upsert
    const settingsToUpsert = [
      {
        setting_key: "default_whatsapp_connections_limit",
        setting_value: body.default_whatsapp_connections_limit || 1,
        category: "limits",
        description: "Limite padrão de conexões WhatsApp para novos usuários",
        is_public: false,
        requires_restart: false,
      },
      {
        setting_key: "default_agents_limit",
        setting_value: body.default_agents_limit || 2,
        category: "limits",
        description: "Limite padrão de agentes IA para novos usuários",
        is_public: false,
        requires_restart: false,
      },
      {
        setting_key: "allow_public_registration",
        setting_value: body.allow_public_registration || false,
        category: "auth",
        description: "Permitir cadastro público de usuários",
        is_public: true,
        requires_restart: false,
      },
    ]

    // Salvar cada configuração usando estratégia de upsert segura
    for (const setting of settingsToUpsert) {
      // Primeiro, tentar buscar se já existe
      const checkResponse = await fetch(
        `${supabaseUrl}/rest/v1/system_settings?setting_key=eq.${setting.setting_key}&select=setting_key`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            "Accept-Profile": "impaai",
            "Content-Profile": "impaai",
          },
        },
      )

      const existingSettings = await checkResponse.json()
      const exists = existingSettings && existingSettings.length > 0

      if (exists) {
        // UPDATE se já existe
        const updateResponse = await fetch(
          `${supabaseUrl}/rest/v1/system_settings?setting_key=eq.${setting.setting_key}`,
          {
            method: "PATCH",
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
              "Accept-Profile": "impaai",
              "Content-Profile": "impaai",
            },
            body: JSON.stringify({
              setting_value: setting.setting_value,
              updated_at: new Date().toISOString(),
            }),
          },
        )

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text()
          throw new Error(`Erro ao atualizar ${setting.setting_key}: ${updateResponse.status} - ${errorText}`)
        }
      } else {
        // INSERT se não existe
        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/system_settings`, {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            "Accept-Profile": "impaai",
            "Content-Profile": "impaai",
          },
          body: JSON.stringify({
            ...setting,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }),
        })

        if (!insertResponse.ok) {
          const errorText = await insertResponse.text()
          throw new Error(`Erro ao inserir ${setting.setting_key}: ${insertResponse.status} - ${errorText}`)
        }
      }
    }

    return NextResponse.json({ success: true, message: "Configurações salvas com sucesso!" })
  } catch (error: any) {
    console.error("Erro ao salvar configurações:", error.message)
    return NextResponse.json({ error: `Erro ao salvar configurações: ${error.message}` }, { status: 500 })
  }
}
