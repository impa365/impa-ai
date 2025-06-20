import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: { instanceName: string } }) {
  console.log("📡 API: POST /api/integrations/evolution/evolutionBot/create chamada")

  try {
    const { instanceName } = params
    const botData = await request.json()

    console.log("🤖 Criando bot na Evolution API para instância:", instanceName)

    // Buscar configurações da Evolution API do banco de forma segura
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Configurações do Supabase não encontradas")
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    // Buscar configurações da Evolution API na tabela integrations
    console.log("🔍 Buscando configurações da Evolution API na tabela integrations...")

    const integrationsResponse = await fetch(
      `${supabaseUrl}/rest/v1/integrations?select=*&type=eq.evolution_api&is_active=eq.true`,
      { headers },
    )

    if (!integrationsResponse.ok) {
      const errorText = await integrationsResponse.text()
      console.error("❌ Erro ao buscar integrações:", integrationsResponse.status, errorText)
      throw new Error("Erro ao buscar configurações da Evolution API")
    }

    const integrations = await integrationsResponse.json()
    console.log("📋 Integrações encontradas:", integrations.length)

    if (!integrations || integrations.length === 0) {
      throw new Error("Evolution API não configurada. Adicione a integração Evolution API no sistema.")
    }

    const evolutionIntegration = integrations[0]
    console.log("✅ Integração Evolution API encontrada:", evolutionIntegration.name)

    // Extrair configurações do JSON
    let evolutionConfig
    try {
      evolutionConfig =
        typeof evolutionIntegration.config === "string"
          ? JSON.parse(evolutionIntegration.config)
          : evolutionIntegration.config
    } catch (parseError) {
      console.error("❌ Erro ao fazer parse da configuração:", parseError)
      throw new Error("Configuração da Evolution API está malformada")
    }

    const evolutionUrl = evolutionConfig.apiUrl
    const evolutionKey = evolutionConfig.apiKey

    if (!evolutionUrl || !evolutionKey) {
      console.error("❌ Configurações incompletas:", {
        hasUrl: !!evolutionUrl,
        hasKey: !!evolutionKey,
        config: evolutionConfig,
      })
      throw new Error("Configurações da Evolution API incompletas. Verifique apiUrl e apiKey.")
    }

    console.log("✅ Configurações da Evolution API validadas")

    // Fazer requisição para a Evolution API
    const evolutionApiUrl = `${evolutionUrl}/evolutionBot/create/${instanceName}`
    console.log("🌐 Fazendo requisição para Evolution API...")

    const evolutionResponse = await fetch(evolutionApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: evolutionKey,
      },
      body: JSON.stringify(botData),
    })

    if (!evolutionResponse.ok) {
      const errorText = await evolutionResponse.text()
      console.error("❌ Erro na Evolution API:", evolutionResponse.status, errorText)
      throw new Error(`Erro na Evolution API: ${evolutionResponse.status} - ${errorText}`)
    }

    const result = await evolutionResponse.json()
    console.log("✅ Bot criado na Evolution API:", result.id)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("❌ Erro ao criar bot na Evolution API:", error.message)
    return NextResponse.json(
      {
        error: "Erro ao criar bot na Evolution API",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
