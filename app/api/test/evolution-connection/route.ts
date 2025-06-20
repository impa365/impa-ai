import { NextResponse } from "next/server"

export async function GET() {
  console.log("🧪 Testando conexão com Evolution API...")

  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Variáveis Supabase não configuradas" }, { status: 500 })
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    // Buscar configuração da Evolution API
    console.log("🔍 Buscando configuração Evolution API...")
    const evolutionResponse = await fetch(
      `${supabaseUrl}/rest/v1/integrations?select=*&type=eq.evolution_api&is_active=eq.true`,
      { headers },
    )

    if (!evolutionResponse.ok) {
      return NextResponse.json({ error: "Erro ao buscar configuração Evolution" }, { status: 500 })
    }

    const evolutionIntegrations = await evolutionResponse.json()
    if (!evolutionIntegrations || evolutionIntegrations.length === 0) {
      return NextResponse.json({ error: "Evolution API não configurada" }, { status: 404 })
    }

    const evolutionConfig = evolutionIntegrations[0]
    const { apiUrl, apiKey } = evolutionConfig.config

    console.log("🔗 Testando conexão com Evolution API:", apiUrl)

    // Testar conexão direta com Evolution API
    const testResponse = await fetch(`${apiUrl}/instance/fetchInstances`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
    })

    const testResult = {
      evolutionConfigured: true,
      evolutionUrl: apiUrl,
      evolutionConnectable: testResponse.ok,
      evolutionStatus: testResponse.status,
      evolutionStatusText: testResponse.statusText,
      timestamp: new Date().toISOString(),
    }

    if (testResponse.ok) {
      const instances = await testResponse.json()
      testResult.instancesCount = Array.isArray(instances) ? instances.length : 0
    }

    console.log("✅ Resultado do teste:", testResult)

    return NextResponse.json({
      success: true,
      test: testResult,
    })
  } catch (error: any) {
    console.error("❌ Erro no teste de conexão:", error)
    return NextResponse.json(
      {
        error: "Erro no teste de conexão",
        details: error.message,
        evolutionConfigured: false,
        evolutionConnectable: false,
      },
      { status: 500 },
    )
  }
}
