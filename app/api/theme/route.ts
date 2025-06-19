import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      // Retornar tema padrão se não houver configuração
      return NextResponse.json({
        systemName: "Sistema",
        description: "Plataforma de gestão",
        logoIcon: "🔧",
        primaryColor: "#3b82f6",
        secondaryColor: "#10b981",
        accentColor: "#8b5cf6",
      })
    }

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
    }

    // Buscar tema ativo
    const themeResponse = await fetch(`${supabaseUrl}/rest/v1/system_themes?is_active=eq.true`, {
      headers,
      cache: "no-store",
    })

    if (themeResponse.ok) {
      const themes = await themeResponse.json()
      if (themes && themes.length > 0) {
        const theme = themes[0]
        return NextResponse.json({
          systemName: theme.display_name || theme.name || "Sistema",
          description: theme.description || "Sistema de gestão",
          logoIcon: theme.logo_icon || "🔧",
          primaryColor: theme.colors?.primary || "#3b82f6",
          secondaryColor: theme.colors?.secondary || "#10b981",
          accentColor: theme.colors?.accent || "#8b5cf6",
          textColor: theme.colors?.text,
          backgroundColor: theme.colors?.background,
          fontFamily: theme.fonts?.primary,
          borderRadius: theme.borders?.radius,
          customCss: theme.custom_css,
        })
      }
    }

    // Fallback para system_settings
    const settingsResponse = await fetch(`${supabaseUrl}/rest/v1/system_settings?setting_key=eq.current_theme`, {
      headers,
      cache: "no-store",
    })

    if (settingsResponse.ok) {
      const settings = await settingsResponse.json()
      if (settings && settings.length > 0) {
        const setting = settings[0]
        if (setting.setting_value && typeof setting.setting_value === "object") {
          return NextResponse.json(setting.setting_value)
        }
      }
    }

    // Tema padrão
    return NextResponse.json({
      systemName: "Sistema",
      description: "Plataforma de gestão",
      logoIcon: "🔧",
      primaryColor: "#3b82f6",
      secondaryColor: "#10b981",
      accentColor: "#8b5cf6",
    })
  } catch (error) {
    console.error("Erro ao carregar tema:", error)

    // Sempre retornar tema padrão em caso de erro
    return NextResponse.json({
      systemName: "Sistema",
      description: "Plataforma de gestão",
      logoIcon: "🔧",
      primaryColor: "#3b82f6",
      secondaryColor: "#10b981",
      accentColor: "#8b5cf6",
    })
  }
}
