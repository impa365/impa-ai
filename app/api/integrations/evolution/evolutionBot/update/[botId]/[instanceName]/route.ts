import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: { botId: string; instanceName: string } }) {
  console.log("🔄 Atualizando bot na Evolution API:", params.botId, "instância:", params.instanceName)

  try {
    const botData = await request.json()
    console.log("📝 Dados de atualização do bot:", botData)

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

    // Atualizar bot na Evolution API
    const updateBotResponse = await fetch(`${apiUrl}/evolutionBot/update/${params.botId}/${params.instanceName}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify(botData),
    })

    console.log("📡 Status da resposta Evolution API:", updateBotResponse.status)

    if (!updateBotResponse.ok) {
      const errorText = await updateBotResponse.text()
      console.error("❌ Erro da Evolution API:", errorText)
      throw new Error(`Evolution API erro ${updateBotResponse.status}: ${errorText}`)
    }

    const result = await updateBotResponse.json()
    console.log("✅ Bot atualizado com sucesso:", result)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("❌ Erro ao atualizar bot na Evolution API:", error)
    return NextResponse.json(
      {
        error: "Erro ao atualizar bot na Evolution API",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
