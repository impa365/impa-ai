import { supabase } from "./supabase"

export async function diagnoseEvolutionApiConfig() {
  console.log("🔍 Iniciando diagnóstico da configuração da Evolution API...")

  try {
    // 1. Verificar se existe registro na tabela integrations
    const { data: integrationData, error: integrationError } = await supabase
      .from("integrations")
      .select("*")
      .eq("type", "evolution_api")

    if (integrationError) {
      console.error("❌ Erro ao buscar integração:", integrationError)
      return {
        success: false,
        message: `Erro ao buscar integração: ${integrationError.message}`,
        details: null,
      }
    }

    if (!integrationData || integrationData.length === 0) {
      console.error("❌ Nenhuma integração da Evolution API encontrada")
      return {
        success: false,
        message: "Nenhuma integração da Evolution API encontrada no banco de dados",
        details: null,
      }
    }

    const evolutionIntegration = integrationData[0]

    // 2. Verificar se a integração está ativa
    if (!evolutionIntegration.is_active) {
      console.error("❌ Integração da Evolution API está inativa")
      return {
        success: false,
        message: "A integração da Evolution API está configurada, mas está inativa",
        details: {
          integration: {
            id: evolutionIntegration.id,
            is_active: evolutionIntegration.is_active,
            created_at: evolutionIntegration.created_at,
          },
        },
      }
    }

    // 3. Verificar se a configuração contém apiUrl e apiKey
    const config = evolutionIntegration.config || {}

    if (!config.apiUrl || config.apiUrl.trim() === "") {
      console.error("❌ URL da API não configurada")
      return {
        success: false,
        message: "URL da Evolution API não está configurada",
        details: {
          integration: {
            id: evolutionIntegration.id,
            is_active: evolutionIntegration.is_active,
            config: {
              apiUrl: config.apiUrl || null,
              hasApiKey: !!config.apiKey,
            },
          },
        },
      }
    }

    // 4. Verificar se existe configuração do n8n
    const { data: n8nData, error: n8nError } = await supabase
      .from("integrations")
      .select("*")
      .eq("type", "n8n")
      .single()

    if (n8nError) {
      console.warn("⚠️ Erro ao buscar configuração do n8n:", n8nError)
    }

    const n8nConfig = n8nData?.config || {}
    const hasValidN8nConfig = !!(n8nConfig.flowUrl && n8nConfig.flowUrl.trim() !== "")

    // 5. Testar conexão com a Evolution API
    try {
      const testUrl = `${config.apiUrl}/ping`
      console.log("🌐 Testando conexão com:", testUrl)

      const response = await fetch(testUrl, {
        method: "GET",
        headers: {
          apikey: config.apiKey || "",
        },
      })

      const connectionSuccess = response.ok
      const statusCode = response.status
      const statusText = response.statusText

      let responseBody = null
      try {
        responseBody = await response.text()
      } catch (e) {
        console.warn("⚠️ Não foi possível ler o corpo da resposta")
      }

      console.log(`${connectionSuccess ? "✅" : "❌"} Teste de conexão: ${statusCode} ${statusText}`)

      return {
        success: true,
        message: "Diagnóstico concluído",
        details: {
          integration: {
            id: evolutionIntegration.id,
            is_active: evolutionIntegration.is_active,
            created_at: evolutionIntegration.created_at,
            config: {
              apiUrl: config.apiUrl,
              hasApiKey: !!config.apiKey,
            },
          },
          n8n: {
            configured: !!n8nData,
            is_active: n8nData?.is_active || false,
            hasFlowUrl: hasValidN8nConfig,
          },
          connectionTest: {
            success: connectionSuccess,
            statusCode,
            statusText,
            responseBody,
          },
        },
      }
    } catch (connectionError: any) {
      console.error("❌ Erro ao testar conexão:", connectionError)
      return {
        success: false,
        message: `Erro ao testar conexão: ${connectionError.message}`,
        details: {
          integration: {
            id: evolutionIntegration.id,
            is_active: evolutionIntegration.is_active,
            config: {
              apiUrl: config.apiUrl,
              hasApiKey: !!config.apiKey,
            },
          },
          n8n: {
            configured: !!n8nData,
            is_active: n8nData?.is_active || false,
            hasFlowUrl: hasValidN8nConfig,
          },
          error: connectionError.message,
        },
      }
    }
  } catch (error: any) {
    console.error("❌ Erro no diagnóstico:", error)
    return {
      success: false,
      message: `Erro no diagnóstico: ${error.message}`,
      details: null,
    }
  }
}
