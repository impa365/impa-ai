import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: { instanceName: string } }) {
  console.log("🤖 Criando bot na Evolution API para instância:", params.instanceName)

  try {
    const botData = await request.json()
    console.log("📝 Dados do bot recebidos:", botData)

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

    // Buscar configuração da Evolution API
    console.log("🔍 Buscando configuração da Evolution API...")
    const evolutionResponse = await fetch(
      `${supabaseUrl}/rest/v1/integrations?select=*&type=eq.evolution_api&is_active=eq.true`,
      { headers },
    )

    if (!evolutionResponse.ok) {
      throw new Error("Erro ao buscar configuração da Evolution API")
    }

    const evolutionIntegrations = await evolutionResponse.json()
    if (!evolutionIntegrations || evolutionIntegrations.length === 0) {
      throw new Error("Evolution API não configurada")
    }

    const evolutionConfig = evolutionIntegrations[0]
    const { apiUrl, apiKey } = evolutionConfig.config

    console.log("🔗 URL da Evolution API:", apiUrl)
    console.log("🔑 API Key configurada:", apiKey ? "SIM" : "NÃO")

    // Criar bot na Evolution API
    const createBotResponse = await fetch(`${apiUrl}/evolutionBot/create/${params.instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify(botData),
    })

    console.log("📡 Status da resposta Evolution API:", createBotResponse.status)

    if (!createBotResponse.ok) {
      const errorText = await createBotResponse.text()
      console.error("❌ Erro da Evolution API:", errorText)
      throw new Error(`Evolution API erro ${createBotResponse.status}: ${errorText}`)
    }

    const result = await createBotResponse.json()
    console.log("✅ Bot criado com sucesso:", result)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("❌ Erro ao criar bot na Evolution API:", error)
    return NextResponse.json(
      {
        error: "Erro ao criar bot na Evolution API",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
