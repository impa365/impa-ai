import { NextResponse } from "next/server"

export async function GET() {
  console.log("🧪 Testando conexão com Evolution API...")

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
    const config =
      typeof evolutionConfig.config === "string" ? JSON.parse(evolutionConfig.config) : evolutionConfig.config

    const { apiUrl, apiKey } = config

    console.log("🔗 Testando conexão com:", apiUrl)

    // Testar conexão básica
    const testResponse = await fetch(`${apiUrl}/instance/fetchInstances`, {
      method: "GET",
      headers: {
        apikey: apiKey,
      },
    })

    const testResult = {
      evolutionConfigured: true,
      evolutionUrl: apiUrl,
      evolutionReachable: testResponse.ok,
      evolutionStatus: testResponse.status,
      evolutionStatusText: testResponse.statusText,
      dockerEnv: {
        NODE_ENV: process.env.NODE_ENV,
        HOSTNAME: process.env.HOSTNAME,
        DOCKER: process.env.DOCKER,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      },
    }

    if (testResponse.ok) {
      const instances = await testResponse.json()
      testResult.instancesCount = Array.isArray(instances) ? instances.length : 0
    }

    console.log("🧪 Resultado do teste:", testResult)

    return NextResponse.json({
      success: testResponse.ok,
      ...testResult,
    })
  } catch (error: any) {
    console.error("❌ Erro no teste de conexão:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        dockerEnv: {
          NODE_ENV: process.env.NODE_ENV,
          HOSTNAME: process.env.HOSTNAME,
          DOCKER: process.env.DOCKER,
          NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        },
      },
      { status: 500 },
    )
  }
}
