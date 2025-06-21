import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: { instanceName: string } }) {
  console.log("🤖 API Evolution Bot Create chamada para:", params.instanceName)

  try {
    const instanceName = params.instanceName
    const botData = await request.json()

    console.log("📝 Dados do bot recebidos:", JSON.stringify(botData, null, 2))

    // Buscar configuração da Evolution API
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Variáveis Supabase não configuradas")
      throw new Error("Variáveis de ambiente do Supabase não configuradas")
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    console.log("🔍 Buscando configuração Evolution API...")
    const evolutionResponse = await fetch(
      `${supabaseUrl}/rest/v1/integrations?select=*&type=eq.evolution_api&is_active=eq.true`,
      { headers },
    )

    if (!evolutionResponse.ok) {
      console.error("❌ Erro ao buscar configuração Evolution:", evolutionResponse.status)
      throw new Error("Erro ao buscar configuração da Evolution API")
    }

    const evolutionIntegrations = await evolutionResponse.json()
    if (!evolutionIntegrations || evolutionIntegrations.length === 0) {
      console.error("❌ Evolution API não configurada")
      throw new Error("Evolution API não configurada")
    }

    const evolutionConfig = evolutionIntegrations[0]
    let config
    try {
      config = typeof evolutionConfig.config === "string" ? JSON.parse(evolutionConfig.config) : evolutionConfig.config
    } catch (parseError) {
      console.error("❌ Erro ao parsear config Evolution:", parseError)
      throw new Error("Configuração da Evolution API inválida")
    }

    const { apiUrl, apiKey } = config
    console.log("🔗 Evolution API URL:", apiUrl)
    console.log("🔑 Evolution API Key:", apiKey ? "***PRESENTE***" : "AUSENTE")

    if (!apiUrl || !apiKey) {
      console.error("❌ URL ou API Key da Evolution não configurados")
      throw new Error("Evolution API não configurada corretamente")
    }

    // Fazer requisição para Evolution API
    const evolutionApiUrl = `${apiUrl}/evolutionBot/create/${instanceName}`
    console.log("📤 Fazendo requisição para:", evolutionApiUrl)

    const evolutionCreateResponse = await fetch(evolutionApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify(botData),
    })

    console.log("📥 Resposta Evolution API:", {
      status: evolutionCreateResponse.status,
      statusText: evolutionCreateResponse.statusText,
      ok: evolutionCreateResponse.ok,
    })

    if (!evolutionCreateResponse.ok) {
      const errorText = await evolutionCreateResponse.text()
      console.error("❌ Erro da Evolution API:", errorText)
      throw new Error(`Erro da Evolution API: ${evolutionCreateResponse.status} - ${errorText}`)
    }

    const result = await evolutionCreateResponse.json()
    console.log("✅ Bot criado com sucesso:", result)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("❌ Erro ao criar bot Evolution:", error.message)
    return NextResponse.json(
      {
        error: "Erro ao criar bot na Evolution API",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
