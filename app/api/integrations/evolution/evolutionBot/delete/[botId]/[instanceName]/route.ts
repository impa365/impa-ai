import { NextResponse } from "next/server"

export async function DELETE(request: Request, { params }: { params: { botId: string; instanceName: string } }) {
  console.log("🗑️ Deletando bot na Evolution API:", params.botId, "instância:", params.instanceName)

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

    // Deletar bot na Evolution API
    const deleteBotResponse = await fetch(`${apiUrl}/evolutionBot/delete/${params.botId}/${params.instanceName}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
    })

    console.log("📡 Status da resposta Evolution API:", deleteBotResponse.status)

    if (!deleteBotResponse.ok) {
      const errorText = await deleteBotResponse.text()
      console.error("❌ Erro da Evolution API:", errorText)
      throw new Error(`Evolution API erro ${deleteBotResponse.status}: ${errorText}`)
    }

    console.log("✅ Bot deletado com sucesso")

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("❌ Erro ao deletar bot na Evolution API:", error)
    return NextResponse.json(
      {
        error: "Erro ao deletar bot na Evolution API",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
