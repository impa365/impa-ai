import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    console.log("🔧 Buscando configurações públicas...")

    // Usar variáveis de ambiente APENAS no servidor
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("❌ Configuração do Supabase não encontrada")
      return NextResponse.json({ error: "Erro de configuração do servidor" }, { status: 500 })
    }

    // Criar cliente Supabase APENAS no servidor
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: "impaai" },
    })

    // Buscar tema ativo
    const { data: theme, error: themeError } = await supabase
      .from("system_themes")
      .select("*")
      .eq("is_active", true)
      .single()

    if (themeError) {
      console.warn("⚠️ Erro ao buscar tema:", themeError.message)
    }

    // Buscar configuração de registro público
    const { data: registrationSetting, error: settingError } = await supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "allow_public_registration")
      .single()

    if (settingError) {
      console.warn("⚠️ Erro ao buscar configuração de registro:", settingError.message)
    }

    // Preparar resposta com dados públicos (SEM variáveis de ambiente)
    const publicConfig = {
      theme: theme || {
        systemName: "Impa AI",
        logoIcon: "🤖",
        primaryColor: "#3b82f6",
        secondaryColor: "#64748b",
        backgroundColor: "#ffffff",
        textColor: "#1f2937",
      },
      settings: {
        allowPublicRegistration: registrationSetting?.setting_value === true || false,
      },
    }

    console.log("✅ Configurações públicas carregadas")
    return NextResponse.json(publicConfig)
  } catch (error: any) {
    console.error("💥 Erro ao buscar configurações:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
