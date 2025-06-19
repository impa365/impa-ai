import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔧 [API /api/config] Buscando configurações públicas...")

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ [API /api/config] Configuração do Supabase não encontrada")
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
    } else {
      console.error("❌ [API /api/config] Erro ao buscar tema:", themeResponse.status, await themeResponse.text())
    }

    // Buscar configurações do sistema
    const settingsResponse = await fetch(`${supabaseUrl}/rest/v1/system_settings`, { headers })
    let processedSettings: Record<string, any> = {}
    if (settingsResponse.ok) {
      const settingsData = await settingsResponse.json()
      console.log("📊 [API /api/config] Dados brutos das configurações:", settingsData)

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
          acc[setting.setting_key] = value // Chaves aqui são snake_case, ex: allow_public_registration
          return acc
        }, {})
        console.log("✅ [API /api/config] Configurações processadas internamente (snake_case):", processedSettings)
      } else {
        console.log("⚠️ [API /api/config] Nenhuma configuração encontrada na tabela system_settings")
      }
    } else {
      console.error(
        "❌ [API /api/config] Erro ao buscar configurações:",
        settingsResponse.status,
        await settingsResponse.text(),
      )
    }

    if (!themeData) {
      themeData = {
        systemName: "Impa AI",
        description: "Tema padrão azul da plataforma", // Adicionando descrição padrão
        logoIcon: "🤖",
        primaryColor: "#3b82f6",
      }
    }

    // CORREÇÃO AQUI:
    // 1. Remove a chave snake_case original do objeto processedSettings.
    // 2. Adiciona a chave camelCase com o valor correto.
    const { allow_public_registration, ...otherProcessedSettings } = processedSettings

    const finalResponseSettings = {
      ...otherProcessedSettings, // Espalha as outras configurações
      allowPublicRegistration: allow_public_registration === true, // Usa a snake_case para definir a camelCase
    }

    console.log(
      "🔧 [API /api/config] Objeto settings FINAL a ser enviado na resposta (camelCase):",
      finalResponseSettings,
    )

    const apiResponse = {
      theme: themeData,
      settings: finalResponseSettings,
    }

    console.log("📤 [API /api/config] Resposta COMPLETA a ser enviada:", apiResponse)
    return NextResponse.json(apiResponse)
  } catch (error: any) {
    console.error("💥 [API /api/config] Erro GERAL:", error.message, error.stack)
    return NextResponse.json(
      {
        theme: { systemName: "Impa AI", logoIcon: "🤖", primaryColor: "#3b82f6" },
        settings: { allowPublicRegistration: false },
      },
      { status: 500 },
    )
  }
}
