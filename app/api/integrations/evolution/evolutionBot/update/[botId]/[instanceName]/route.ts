import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: { botId: string; instanceName: string } }) {
  console.log("📡 API: PUT /api/integrations/evolution/evolutionBot/update chamada")
  console.log("🔧 Bot ID:", params.botId, "Instance:", params.instanceName)

  try {
    const botData = await request.json()
    console.log("📝 Dados de atualização do bot:", {
      description: botData.description,
      enabled: botData.enabled,
    })

    // Buscar configuração da Evolution API
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
    const configResponse = await fetch(
      `${supabaseUrl}/rest/v1/integrations?select=*&type=eq.evolution_api&is_active=eq.true`,
      { headers },
    )

    if (!configResponse.ok) {
      throw new Error("Erro ao buscar configuração da Evolution API")
    }

    const integrations = await configResponse.json()
    if (!integrations || integrations.length === 0) {
      throw new Error("Evolution API não configurada")
    }

    const evolutionConfig = integrations[0]
    let config = evolutionConfig.config
    if (typeof config === "string") {
      config = JSON.parse(config)
    }

    if (!config?.baseUrl || !config?.apiKey) {
      throw new Error("Configuração da Evolution API incompleta")
    }

    console.log("🌐 Fazendo requisição para Evolution API:", config.baseUrl)

    // Fazer requisição para Evolution API
    const evolutionUrl = `${config.baseUrl}/bot/update/${params.botId}/${params.instanceName}`
    console.log("📡 URL completa:", evolutionUrl)

    const evolutionResponse = await fetch(evolutionUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        apikey: config.apiKey,
      },
      body: JSON.stringify(botData),
    })

    console.log("📊 Status da resposta Evolution:", evolutionResponse.status)

    if (!evolutionResponse.ok) {
      const errorText = await evolutionResponse.text()
      console.error("❌ Erro da Evolution API:", evolutionResponse.status, errorText)
      throw new Error(`Evolution API retornou erro ${evolutionResponse.status}: ${errorText}`)
    }

    const result = await evolutionResponse.json()
    console.log("✅ Bot atualizado com sucesso na Evolution API")

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("❌ Erro ao atualizar bot na Evolution API:", error.message)
    return NextResponse.json(
      {
        error: "Erro ao atualizar bot na Evolution API",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
