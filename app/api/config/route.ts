import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Erro de configuração do servidor" }, { status: 500 })
    }

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
    }

    // Buscar tema ativo
    const themeResponse = await fetch(`${supabaseUrl}/rest/v1/system_themes?is_active=eq.true`, { headers })
    let themeData = null
    if (themeResponse.ok) {
      const themes = await themeResponse.json()
      if (themes && themes.length > 0) {
        const theme = themes[0]
        themeData = {
          systemName: theme.display_name || theme.name || "Sistema",
          description: theme.description || "Sistema de gestão",
          logoIcon: theme.logo_icon || "🤖",
          primaryColor: theme.colors?.primary || "#3b82f6",
          secondaryColor: theme.colors?.secondary || "#10b981",
          accentColor: theme.colors?.accent || "#8b5cf6",
          textColor: theme.colors?.text,
          backgroundColor: theme.colors?.background,
          fontFamily: theme.fonts?.primary,
          borderRadius: theme.borders?.radius,
          customCss: theme.custom_css,
        }
      }
    }

    // Buscar configurações do sistema
    const settingsResponse = await fetch(`${supabaseUrl}/rest/v1/system_settings`, { headers })
    let processedSettings: Record<string, any> = {}
    if (settingsResponse.ok) {
      const settingsData = await settingsResponse.json()

      if (settingsData && settingsData.length > 0) {
        processedSettings = settingsData.reduce((acc: any, setting: any) => {
          let value = setting.setting_value
          if (value === "true") value = true
          else if (value === "false") value = false
          else if (
            typeof value === "string" &&
            !isNaN(Number.parseFloat(value)) &&
            isFinite(Number(value)) &&
            value.trim() !== ""
          ) {
            value = Number(value)
          }
          acc[setting.setting_key] = value
          return acc
        }, {})
      }
    }

    if (!themeData) {
      themeData = {
        systemName: "Impa AI",
        description: "Tema padrão azul da plataforma",
        logoIcon: "🤖",
        primaryColor: "#3b82f6",
      }
    }

    // Remove a chave snake_case e adiciona a camelCase
    const { allow_public_registration, ...otherProcessedSettings } = processedSettings

    const finalResponseSettings = {
      ...otherProcessedSettings,
      allowPublicRegistration: allow_public_registration === true,
    }

    const apiResponse = {
      theme: themeData,
      settings: finalResponseSettings,
    }

    return NextResponse.json(apiResponse)
  } catch (error: any) {
    console.error("💥 [API /api/config] Erro:", error.message)
    return NextResponse.json(
      {
        theme: { systemName: "Impa AI", logoIcon: "🤖", primaryColor: "#3b82f6" },
        settings: { allowPublicRegistration: false },
      },
      { status: 500 },
    )
  }
}
