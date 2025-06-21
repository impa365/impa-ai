import { NextResponse } from "next/server"

export async function GET() {
  console.log("📡 API: /api/integrations/evolution/config chamada")

  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Variáveis de ambiente do Supabase não configuradas")
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    console.log("🔍 Buscando configuração da Evolution API...")
    const response = await fetch(
      `${supabaseUrl}/rest/v1/integrations?select=*&type=eq.evolution_api&is_active=eq.true`,
      { headers },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Erro ao buscar configuração Evolution:", response.status, errorText)
      return NextResponse.json({
        success: false,
        configured: false,
        error: "Erro ao buscar configuração",
      })
    }

    const integrations = await response.json()
    console.log("📋 Integrações encontradas:", integrations.length)

    if (!integrations || integrations.length === 0) {
      console.log("⚠️ Nenhuma configuração Evolution API encontrada")
      return NextResponse.json({
        success: true,
        configured: false,
        data: null,
      })
    }

    const evolutionConfig = integrations[0]
    console.log("✅ Configuração Evolution encontrada:", {
      id: evolutionConfig.id,
      name: evolutionConfig.name,
      hasConfig: !!evolutionConfig.config,
    })

    // Parse da configuração se for string
    let config = evolutionConfig.config
    if (typeof config === "string") {
      try {
        config = JSON.parse(config)
      } catch (e) {
        console.error("❌ Erro ao fazer parse da configuração:", e)
        return NextResponse.json({
          success: false,
          configured: false,
          error: "Configuração inválida",
        })
      }
    }

    console.log("🔧 Configuração processada:", {
      baseUrl: config?.baseUrl ? "✅ Definida" : "❌ Ausente",
      apiKey: config?.apiKey ? "✅ Definida" : "❌ Ausente",
    })

    return NextResponse.json({
      success: true,
      configured: !!(config?.baseUrl && config?.apiKey),
      data: evolutionConfig,
    })
  } catch (error: any) {
    console.error("❌ Erro na API evolution/config:", error.message)
    return NextResponse.json(
      {
        success: false,
        configured: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
