import { supabase } from "./supabase" // Assuming this is your custom Supabase wrapper
import type { EvolutionBotIndividualConfig, EvolutionInstanceSettings, CreateBotResponse } from "./evolution-api" // Assuming types are in the same file or correctly pathed

// Melhorar a função getEvolutionConfig para validação mais robusta e logs detalhados
async function getEvolutionConfig() {
  console.log("🔍 Buscando configuração da Evolution API no banco de dados...")

  // Corrected Supabase call
  const integrationsTable = await supabase.from("integrations")
  const { data, error: dbError } = await integrationsTable
    .select("config")
    .eq("type", "evolution_api")
    .eq("is_active", true)
    .single()

  if (dbError) {
    console.error("❌ Erro ao buscar configuração da Evolution API no Supabase:", dbError)
    throw new Error(`Erro no banco de dados ao buscar config da Evolution API: ${dbError.message}`)
  }

  if (!data) {
    console.error("❌ Configuração da Evolution API não encontrada ou não está ativa no banco de dados.")
    throw new Error(
      "Configuração da Evolution API não encontrada ou inativa. Verifique se está configurada no painel de administração.",
    )
  }

  const config = data.config as { apiUrl?: string; apiKey?: string }

  if (!config || typeof config !== "object") {
    console.error("❌ Configuração da Evolution API inválida no banco de dados:", data.config)
    throw new Error("Configuração da Evolution API está em formato inválido.")
  }

  if (!config.apiUrl || config.apiUrl.trim() === "") {
    console.error("❌ URL da Evolution API não configurada na base de dados:", config.apiUrl)
    throw new Error("URL da Evolution API não está configurada. Configure no painel de administração.")
  }

  // apiKey is optional for some Evolution API setups, so a warning is appropriate
  if (!config.apiKey || config.apiKey.trim() === "") {
    console.warn("⚠️ Chave da API da Evolution API (apiKey) não configurada. Algumas requisições podem falhar.")
  }

  console.log("✅ Configuração da Evolution API encontrada.")
  console.log("🔑 API Key:", config.apiKey ? "Configurada" : "Não configurada (opcional para alguns endpoints)")

  return config
}

// Melhorar a função createEvolutionBot com logs detalhados e tratamento de erros robusto
export async function createEvolutionBot(
  instanceName: string,
  botData: EvolutionBotIndividualConfig,
): Promise<CreateBotResponse> {
  try {
    console.log(`🤖 Iniciando criação de bot na Evolution API para instância: ${instanceName}...`)
    console.log("📋 Dados do bot para CRIAR:", JSON.stringify(botData, null, 2))

    const config = await getEvolutionConfig() // This will now work correctly
    const url = `${config.apiUrl}/evolutionBot/create/${instanceName}`

    console.log("🌐 Fazendo requisição POST para o endpoint da Evolution API")

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.apiKey || "", // Send empty string if not configured
      },
      body: JSON.stringify(botData),
    })

    const responseText = await response.text() // Always get text first for better error details
    if (process.env.NODE_ENV === "development") {
      console.log(`📄 Resposta da Evolution API (Criação - Status ${response.status}):`, responseText)
    } else {
      console.log(`📄 Resposta da Evolution API (Criação - Status ${response.status})`)
    }

    if (!response.ok) {
      const errorDetail = process.env.NODE_ENV === "development" ? responseText : "Detalhes omitidos no cliente."
      console.error(`❌ Erro da Evolution API (Criação - Status ${response.status}): ${errorDetail}`)
      return {
        success: false,
        error: `Erro ${response.status} da Evolution API: ${responseText || "Resposta vazia"}`,
      }
    }

    try {
      const result = JSON.parse(responseText)
      if (!result.id) {
        console.error("❌ Resposta da Evolution API não contém ID do bot (Criação):", result)
        return { success: false, error: "Resposta da API (criação) não contém ID do bot esperado." }
      }
      console.log("✅ Bot criado com sucesso na Evolution API. ID:", result.id)
      return { success: true, botId: result.id }
    } catch (parseError) {
      console.error("❌ Erro ao parsear JSON da resposta da Evolution API (Criação):", parseError)
      console.error("📄 Texto da resposta que falhou no parse:", responseText)
      return { success: false, error: "Resposta da API (criação) não é um JSON válido." }
    }
  } catch (error: any) {
    console.error("❌ Erro detalhado ao criar bot na Evolution API:", error)
    // Check for specific fetch error (e.g., server not reachable)
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      return {
        success: false,
        error:
          "Não foi possível conectar com a Evolution API. Verifique se o servidor está funcionando e a URL está correta.",
      }
    }
    return { success: false, error: error.message || "Erro desconhecido ao tentar criar bot na Evolution API" }
  }
}

export async function updateEvolutionBot(
  instanceName: string,
  botId: string,
  botData: EvolutionBotIndividualConfig,
): Promise<boolean> {
  try {
    console.log(`🔄 Atualizando bot ${botId} na Evolution API para instância: ${instanceName}...`)
    console.log("📋 Dados do bot para ATUALIZAR:", JSON.stringify(botData, null, 2))

    const config = await getEvolutionConfig()
    const url = `${config.apiUrl}/evolutionBot/update/${botId}/${instanceName}`

    console.log("🌐 Fazendo requisição PUT para o endpoint da Evolution API")

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        apikey: config.apiKey || "",
      },
      body: JSON.stringify(botData),
    })

    const responseText = await response.text()
    if (process.env.NODE_ENV === "development") {
      console.log(`📄 Resposta da Evolution API (Atualização - Status ${response.status}):`, responseText)
    } else {
      console.log(`📄 Resposta da Evolution API (Atualização - Status ${response.status})`)
    }

    if (!response.ok) {
      const errorDetail = process.env.NODE_ENV === "development" ? responseText : "Detalhes omitidos no cliente."
      console.error(`❌ Erro ao atualizar bot na Evolution API (Status ${response.status}): ${errorDetail}`)
      return false
    }

    console.log(`✅ Bot ${botId} atualizado com sucesso na Evolution API.`)
    return true
  } catch (error: any) {
    console.error(`❌ Erro detalhado ao atualizar bot ${botId} na Evolution API:`, error)
    return false
  }
}

export async function setEvolutionInstanceSettings(
  instanceName: string,
  settingsData: EvolutionInstanceSettings,
): Promise<boolean> {
  try {
    console.log(`⚙️ Configurando definições da instância ${instanceName} na Evolution API...`)
    console.log("📋 Dados das definições:", JSON.stringify(settingsData, null, 2))

    const config = await getEvolutionConfig()
    const url = `${config.apiUrl}/evolutionBot/settings/${instanceName}` // Endpoint é POST para settings

    console.log("🌐 Fazendo requisição POST para o endpoint da Evolution API")

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.apiKey || "",
      },
      body: JSON.stringify(settingsData),
    })

    const responseText = await response.text()
    if (process.env.NODE_ENV === "development") {
      console.log(`📄 Resposta da Evolution API (Definições da Instância - Status ${response.status}):`, responseText)
    } else {
      console.log(`📄 Resposta da Evolution API (Definições da Instância - Status ${response.status})`)
    }

    if (!response.ok) {
      const errorDetail = process.env.NODE_ENV === "development" ? responseText : "Detalhes omitidos no cliente."
      console.error(
        `❌ Erro ao configurar definições da instância na Evolution API (Status ${response.status}): ${errorDetail}`,
      )
      return false
    }

    console.log(`✅ Definições da instância ${instanceName} configuradas com sucesso na Evolution API.`)
    return true
  } catch (error: any) {
    console.error(`❌ Erro detalhado ao configurar definições da instância ${instanceName} na Evolution API:`, error)
    return false
  }
}

export async function deleteEvolutionBot(instanceName: string, botId: string): Promise<boolean> {
  try {
    console.log(`🗑️ Deletando bot ${botId} na Evolution API para instância: ${instanceName}...`)

    const config = await getEvolutionConfig()
    const url = `${config.apiUrl}/evolutionBot/delete/${botId}/${instanceName}`

    console.log("🌐 Fazendo requisição DELETE para o endpoint da Evolution API")

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        apikey: config.apiKey || "",
      },
    })

    const responseText = await response.text() // Get text even for delete for potential error messages
    if (process.env.NODE_ENV === "development") {
      console.log(`📄 Resposta da Evolution API (Deleção - Status ${response.status}):`, responseText)
    } else {
      console.log(`📄 Resposta da Evolution API (Deleção - Status ${response.status})`)
    }

    if (!response.ok) {
      const errorDetail = process.env.NODE_ENV === "development" ? responseText : "Detalhes omitidos no cliente."
      console.error(`❌ Erro ao deletar bot na Evolution API (Status ${response.status}): ${errorDetail}`)
      return false
    }

    console.log(`✅ Bot ${botId} deletado com sucesso na Evolution API.`)
    return true
  } catch (error: any) {
    console.error(`❌ Erro detalhado ao deletar bot ${botId} na Evolution API:`, error)
    return false
  }
}

export async function fetchEvolutionBot(instanceName: string, botId: string): Promise<any> {
  try {
    console.log(`📥 Buscando bot ${botId} na Evolution API para instância: ${instanceName}...`)

    const config = await getEvolutionConfig()
    const url = `${config.apiUrl}/evolutionBot/fetch/${botId}/${instanceName}`

    console.log("🌐 Fazendo requisição GET para o endpoint da Evolution API")

    const response = await fetch(url, {
      method: "GET",
      headers: {
        apikey: config.apiKey || "",
      },
    })

    const responseText = await response.text()
    if (process.env.NODE_ENV === "development") {
      console.log(`📄 Resposta da Evolution API (Busca de Bot - Status ${response.status}):`, responseText)
    } else {
      console.log(`📄 Resposta da Evolution API (Busca de Bot - Status ${response.status})`)
    }

    if (!response.ok) {
      const errorDetail = process.env.NODE_ENV === "development" ? responseText : "Detalhes omitidos no cliente."
      console.error(`❌ Erro ao buscar bot na Evolution API (Status ${response.status}): ${errorDetail}`)
      return null
    }

    try {
      const result = JSON.parse(responseText)
      console.log(`✅ Bot ${botId} encontrado na Evolution API:`, result)
      return result
    } catch (parseError) {
      console.error("❌ Erro ao parsear JSON da resposta da Evolution API (Busca de Bot):", parseError)
      console.error("📄 Texto da resposta que falhou no parse:", responseText)
      return null
    }
  } catch (error: any) {
    console.error(`❌ Erro detalhado ao buscar bot ${botId} na Evolution API:`, error)
    return null
  }
}

export async function fetchEvolutionBotSettings(instanceName: string): Promise<any> {
  try {
    console.log(`⚙️ Buscando configurações da instância ${instanceName} na Evolution API...`)

    const config = await getEvolutionConfig()
    const url = `${config.apiUrl}/evolutionBot/fetchSettings/${instanceName}`

    console.log("🌐 Fazendo requisição GET para o endpoint da Evolution API")

    const response = await fetch(url, {
      method: "GET",
      headers: {
        apikey: config.apiKey || "",
      },
    })

    const responseText = await response.text()
    if (process.env.NODE_ENV === "development") {
      console.log(`📄 Resposta da Evolution API (Busca de Configurações - Status ${response.status}):`, responseText)
    } else {
      console.log(`📄 Resposta da Evolution API (Busca de Configurações - Status ${response.status})`)
    }

    if (!response.ok) {
      const errorDetail = process.env.NODE_ENV === "development" ? responseText : "Detalhes omitidos no cliente."
      console.error(
        `❌ Erro ao buscar configurações da instância na Evolution API (Status ${response.status}): ${errorDetail}`,
      )
      return null
    }

    try {
      const result = JSON.parse(responseText)
      console.log(`✅ Configurações da instância ${instanceName} encontradas na Evolution API:`, result)
      return result
    } catch (parseError) {
      console.error("❌ Erro ao parsear JSON da resposta da Evolution API (Busca de Configurações):", parseError)
      console.error("📄 Texto da resposta que falhou no parse:", responseText)
      return null
    }
  } catch (error: any) {
    console.error(`❌ Erro detalhado ao buscar configurações da instância ${instanceName} na Evolution API:`, error)
    return null
  }
}
