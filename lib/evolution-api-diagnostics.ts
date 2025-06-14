import { db } from "./supabase" // Import both, ideally use db

export async function diagnoseEvolutionApiConfig() {
  console.log("🔍 Iniciando diagnóstico da configuração da Evolution API...")

  try {
    // 1. Verificar se existe registro na tabela integrations
    // Using the 'db' object is preferred for consistency
    const integrationsTable = await db.integrations()
    const { data: integrationData, error: integrationError } = await integrationsTable
      .select("*")
      .eq("type", "evolution_api")
      .limit(1) // Fetch at most one record

    if (integrationError) {
      console.error("❌ Erro ao buscar integração:", integrationError)
      return {
        success: false,
        message: `Erro ao buscar integração: ${integrationError.message}`,
        details: null,
      }
    }

    if (!integrationData || integrationData.length === 0) {
      console.warn("⚠️ Nenhuma integração da Evolution API encontrada") // Changed to warn as it's a diagnostic finding
      return {
        success: true, // Diagnostic itself didn't fail, just found no config
        message: "Diagnóstico concluído: Nenhuma integração da Evolution API encontrada no banco de dados",
        details: {
          configExists: false,
          recommendations: ["Configure a integração da Evolution API nas Configurações > Integrações."],
        },
      }
    }

    const evolutionIntegration = integrationData[0]

    // 2. Verificar se a integração está ativa
    if (!evolutionIntegration.is_active) {
      console.warn("⚠️ Integração da Evolution API está inativa")
      return {
        success: true, // Diagnostic itself didn't fail
        message: "Diagnóstico concluído: A integração da Evolution API está configurada, mas está inativa",
        details: {
          configExists: true,
          isActive: false,
          integration: {
            id: evolutionIntegration.id,
            is_active: evolutionIntegration.is_active,
            created_at: evolutionIntegration.created_at,
          },
          recommendations: ["Ative a integração da Evolution API nas Configurações > Integrações."],
        },
      }
    }

    // 3. Verificar se a configuração contém apiUrl e apiKey
    const config = evolutionIntegration.config || {}
    const recommendations: string[] = []
    let configValid = true

    if (!config.apiUrl || String(config.apiUrl).trim() === "") {
      console.warn("⚠️ URL da API não configurada")
      recommendations.push("Configure a URL da API da Evolution na integração.")
      configValid = false
    }
    // Simple URL format check (basic)
    let apiUrlValid = false
    try {
      if (config.apiUrl) {
        new URL(String(config.apiUrl))
        apiUrlValid = true
      }
    } catch (e) {
      recommendations.push("A URL da API da Evolution parece ter um formato inválido.")
      apiUrlValid = false
      configValid = false
    }

    if (!config.apiKey || String(config.apiKey).trim() === "") {
      console.warn("⚠️ API Key da Evolution não configurada")
      recommendations.push("Configure a API Key da Evolution na integração.")
      configValid = false
    }

    // 4. Verificar se existe configuração do n8n
    const n8nIntegrationsTable = await db.integrations()
    const { data: n8nData, error: n8nError } = await n8nIntegrationsTable.select("*").eq("type", "n8n").maybeSingle() // Use maybeSingle if you expect 0 or 1

    if (n8nError && n8nError.code !== "PGRST116") {
      // PGRST116 means no rows found, which is fine for maybeSingle
      console.warn("⚠️ Erro ao buscar configuração do n8n:", n8nError)
    }

    const n8nConfig = n8nData?.config || {}
    const n8nFlowUrlValid = !!(n8nConfig.flowUrl && String(n8nConfig.flowUrl).trim() !== "")
    if (n8nData && !n8nFlowUrlValid) {
      recommendations.push("A integração n8n está presente, mas a URL do fluxo não está configurada ou é inválida.")
    }

    // 5. Testar conexão com a Evolution API
    let connectionTestResult: any = { success: false, error: "Não testado (configuração inválida)" }
    if (configValid && config.apiUrl) {
      try {
        const testUrl = `${String(config.apiUrl).replace(/\/$/, "")}/ping` // Ensure no trailing slash before adding /ping
        console.log("🌐 Testando conexão com:", testUrl)

        const response = await fetch(testUrl, {
          method: "GET",
          headers: {
            apikey: config.apiKey || "",
          },
          signal: AbortSignal.timeout(5000), // Add a timeout
        })

        const connectionSuccess = response.ok
        const statusCode = response.status
        const statusText = response.statusText

        let responseBodyText = null
        try {
          responseBodyText = await response.text()
        } catch (e) {
          console.warn("⚠️ Não foi possível ler o corpo da resposta do teste de conexão")
        }

        console.log(`${connectionSuccess ? "✅" : "❌"} Teste de conexão: ${statusCode} ${statusText}`)
        connectionTestResult = {
          success: connectionSuccess,
          statusCode,
          statusText,
          responseBody: responseBodyText
            ? responseBodyText.substring(0, 200) + (responseBodyText.length > 200 ? "..." : "")
            : null, // Limit response body length
        }
        if (!connectionSuccess) {
          recommendations.push(
            `Falha no teste de conexão com a Evolution API (Status: ${statusCode}). Verifique a URL, API Key e se o serviço está online. Detalhe: ${statusText}`,
          )
        }
      } catch (connectionError: any) {
        console.error("❌ Erro ao testar conexão:", connectionError)
        connectionTestResult = {
          success: false,
          error: connectionError.message || "Erro desconhecido durante o teste de conexão",
        }
        recommendations.push(
          `Erro ao tentar conectar na Evolution API: ${connectionError.message}. Verifique a URL e a rede.`,
        )
      }
    }

    return {
      success: true, // Diagnostic itself completed
      message: "Diagnóstico da Evolution API concluído.",
      details: {
        configExists: true,
        isActive: evolutionIntegration.is_active,
        apiUrlValid: apiUrlValid,
        apiKeyPresent: !!(config.apiKey && String(config.apiKey).trim() !== ""),
        connectionTest: connectionTestResult,
        n8nConfig: {
          configured: !!n8nData,
          isActive: n8nData?.is_active || false,
          flowUrlValid: n8nFlowUrlValid,
        },
        recommendations:
          recommendations.length > 0
            ? recommendations
            : ["Configuração parece OK. Se houver problemas, verifique os logs detalhados."],
      },
    }
  } catch (error: any) {
    console.error("❌ Erro crítico no diagnóstico da Evolution API:", error)
    return {
      success: false,
      message: `Erro crítico no diagnóstico: ${error.message}`,
      details: {
        recommendations: ["Ocorreu um erro inesperado ao executar o diagnóstico. Verifique os logs do servidor."],
      },
    }
  }
}
