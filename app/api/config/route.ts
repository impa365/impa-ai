import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔧 Buscando configurações públicas...")

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Configuração do Supabase não encontrada")
      return NextResponse.json({ error: "Erro de configuração do servidor" }, { status: 500 })
    }

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      "Accept-Profile": "impaai", // Especifica o schema para leitura
      "Content-Profile": "impaai", // Especifica o schema para escrita (não usado aqui, mas bom ter)
    }

    // Buscar tema ativo
    // Removido ?schema=impaai da URL, confiando nos headers
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
    } else {
      console.error("❌ Erro ao buscar tema:", themeResponse.status, await themeResponse.text())
    }

    // Buscar configurações do sistema
    // Removido ?schema=impaai da URL, confiando nos headers
    const settingsResponse = await fetch(`${supabaseUrl}/rest/v1/system_settings`, { headers })

    let settings = {}
    if (settingsResponse.ok) {
      const settingsData = await settingsResponse.json()
      console.log("📊 Dados brutos das configurações:", settingsData)

      if (settingsData && settingsData.length > 0) {
        settings = settingsData.reduce((acc: any, setting: any) => {
          let value = setting.setting_value
          if (value === "true") value = true
          if (value === "false") value = false
          // Apenas converte para número se for um número válido e não uma string vazia
          if (
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
        console.log("✅ Configurações processadas:", settings)
      } else {
        console.log("⚠️ Nenhuma configuração encontrada na tabela system_settings")
      }
    } else {
      console.error("❌ Erro ao buscar configurações:", settingsResponse.status, await settingsResponse.text())
    }

    if (!themeData) {
      themeData = {
        systemName: "Impa AI",
        description: "Sistema de gestão de agentes",
        logoIcon: "🤖",
        primaryColor: "#3b82f6",
        secondaryColor: "#10b981",
        accentColor: "#8b5cf6",
      }
    }

    console.log("✅ Configurações carregadas com sucesso")

    return NextResponse.json({
      theme: themeData,
      settings: {
        allowPublicRegistration: settings.allowPublicRegistration === true, // Garante que seja boolean
        ...settings,
      },
    })
  } catch (error: any) {
    console.error("💥 Erro ao buscar configurações:", error.message, error.stack)
    return NextResponse.json({
      theme: {
        systemName: "Impa AI",
        description: "Sistema de gestão de agentes",
        logoIcon: "🤖",
        primaryColor: "#3b82f6",
        secondaryColor: "#10b981",
        accentColor: "#8b5cf6",
      },
      settings: {
        allowPublicRegistration: false,
      },
    })
  }
}
