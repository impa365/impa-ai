import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Esta API NUNCA deve retornar variáveis de ambiente
// Apenas dados públicos do sistema obtidos do banco de dados
export async function GET() {
  try {
    // Usar variáveis de ambiente apenas no servidor
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("❌ Missing Supabase configuration on server")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // Criar cliente Supabase no servidor
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: "impaai" },
    })

    // Buscar apenas dados públicos do sistema
    const [themeResult, settingsResult] = await Promise.allSettled([
      // Buscar tema ativo
      supabase
        .from("system_themes")
        .select("display_name, name, description, logo_icon, colors, fonts, borders, custom_css")
        .eq("is_active", true)
        .single(),

      // Buscar configurações públicas do sistema
      supabase
        .from("system_settings")
        .select("setting_key, setting_value")
        .eq("is_public", true)
        .in("setting_key", ["system_name", "allow_public_registration", "current_theme"]),
    ])

    let themeData = null
    const publicSettings = {}

    // Processar resultado do tema
    if (themeResult.status === "fulfilled" && themeResult.value.data) {
      const theme = themeResult.value.data
      themeData = {
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
      }
    }

    // Processar configurações públicas
    if (settingsResult.status === "fulfilled" && settingsResult.value.data) {
      const settings = settingsResult.value.data
      settings.forEach((setting: any) => {
        publicSettings[setting.setting_key] = setting.setting_value
      })
    }

    // Fallback para tema se não encontrado
    if (!themeData) {
      // Tentar buscar da configuração current_theme
      if (publicSettings["current_theme"]) {
        if (typeof publicSettings["current_theme"] === "object") {
          themeData = publicSettings["current_theme"]
        }
      }

      // Fallback final
      if (!themeData) {
        themeData = {
          systemName: publicSettings["system_name"] || "Sistema",
          description: "Sistema de gestão",
          logoIcon: "🔧",
          primaryColor: "#3b82f6",
          secondaryColor: "#10b981",
          accentColor: "#8b5cf6",
        }
      }
    }

    // Retornar APENAS dados públicos, NUNCA variáveis de ambiente
    const publicConfig = {
      theme: themeData,
      settings: {
        allowPublicRegistration: publicSettings["allow_public_registration"] || false,
        systemName: publicSettings["system_name"] || themeData?.systemName || "Sistema",
      },
    }

    console.log("✅ Public config loaded successfully")
    return NextResponse.json(publicConfig)
  } catch (error) {
    console.error("❌ Error loading public config:", error)

    // Retornar configuração mínima em caso de erro
    return NextResponse.json({
      theme: {
        systemName: "Sistema",
        description: "Sistema de gestão",
        logoIcon: "🔧",
        primaryColor: "#3b82f6",
        secondaryColor: "#10b981",
        accentColor: "#8b5cf6",
      },
      settings: {
        allowPublicRegistration: false,
        systemName: "Sistema",
      },
    })
  }
}
