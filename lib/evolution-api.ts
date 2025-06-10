import { supabase } from "./supabase"

export interface CreateBotRequest {
  enabled: boolean
  description: string // Nome da IA
  apiUrl: string
  apiKey?: string
  triggerType: string
  triggerOperator: string
  triggerValue: string
  expire: number
  keywordFinish: string
  delayMessage: number
  unknownMessage: string
  listeningFromMe: boolean // Ouvindo de mim
  stopBotFromMe: boolean // Parar bot por mim
  keepOpen: boolean // Manter aberto
  debounceTime: number // Tempo de Debounce
  ignoreJids: string[]
  splitMessages: boolean // Dividir Mensagens
  timePerChar: number // Tempo por caractere
}

export interface CreateBotResponse {
  success: boolean
  botId?: string
  error?: string
}

// Melhorar a função getEvolutionConfig para validação mais robusta e logs detalhados

async function getEvolutionConfig() {
  console.log("🔍 Buscando configuração da Evolution API no banco de dados...")

  const { data, error: dbError } = await supabase
    .from("integrations")
    .select("config")
    .eq("type", "evolution_api")
    .eq("is_active", true)
    .single()

  if (dbError) {
    console.error("❌ Erro ao buscar configuração no Supabase:", dbError)
    throw new Error(`Erro no banco de dados: ${dbError.message}`)
  }

  if (!data) {
    console.error("❌ Configuração da Evolution API não encontrada ou não está ativa")
    throw new Error(
      "Configuração da Evolution API não encontrada. Verifique se está configurada no painel de administração.",
    )
  }

  const config = data.config as { apiUrl?: string; apiKey?: string }

  if (!config || typeof config !== "object") {
    console.error("❌ Configuração inválida:", data.config)
    throw new Error("Configuração da Evolution API está em formato inválido.")
  }

  if (!config.apiUrl || config.apiUrl.trim() === "") {
    console.error("❌ URL da Evolution API não configurada:", config.apiUrl)
    throw new Error("URL da Evolution API não está configurada. Configure no painel de administração.")
  }

  if (!config.apiKey || config.apiKey.trim() === "") {
    console.warn("⚠️ Chave da Evolution API não configurada. Requisições podem falhar.")
  }

  console.log("✅ Configuração da Evolution API encontrada:")
  console.log("📍 URL:", config.apiUrl)
  console.log("🔑 API Key:", config.apiKey ? "Configurada" : "Não configurada")

  return config
}

// Melhorar a função createEvolutionBot com logs detalhados e tratamento de erros robusto

export async function createEvolutionBot(instanceName: string, botData: CreateBotRequest): Promise<CreateBotResponse> {
  try {
    console.log("🤖 Iniciando criação de bot na Evolution API...")
    console.log("📋 Instância:", instanceName)
    console.log("📋 Dados do bot:", JSON.stringify(botData, null, 2))

    const config = await getEvolutionConfig()
    const url = `${config.apiUrl}/evolutionBot/create/${instanceName}`

    console.log("🌐 Fazendo requisição para:", url)
    console.log("🔑 API Key configurada:", !!config.apiKey)

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.apiKey || "",
      },
      body: JSON.stringify(botData),
    })

    console.log("📡 Status da resposta:", response.status)
    console.log("📡 Status text:", response.statusText)

    // Capturar o corpo da resposta como texto para análise
    const responseText = await response.text()
    console.log("📄 Corpo da resposta:", responseText)

    if (!response.ok) {
      console.error("❌ Erro da Evolution API:", responseText)
      return {
        success: false,
        error: `Erro ${response.status}: ${responseText}`,
      }
    }

    // Tentar converter o texto da resposta para JSON
    let result
    try {
      result = JSON.parse(responseText)
      console.log("✅ Bot criado com sucesso:", result)
    } catch (jsonError) {
      console.error("❌ Erro ao analisar resposta JSON:", jsonError)
      return {
        success: false,
        error: `Resposta inválida da API: ${responseText}`,
      }
    }

    // Verificar se o resultado contém um ID de bot
    if (!result.id) {
      console.error("❌ Resposta não contém ID do bot:", result)
      return {
        success: false,
        error: "Resposta da API não contém ID do bot",
      }
    }

    return {
      success: true,
      botId: result.id,
    }
  } catch (error: any) {
    console.error("❌ Erro detalhado ao criar bot:", error)

    // Verificar tipos específicos de erro
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      return {
        success: false,
        error:
          "Não foi possível conectar com a Evolution API. Verifique se o servidor está funcionando e a URL está correta.",
      }
    }

    return {
      success: false,
      error: error.message || "Erro desconhecido ao criar bot na Evolution API",
    }
  }
}

export async function updateEvolutionBot(
  instanceName: string,
  botId: string,
  botData: CreateBotRequest,
): Promise<boolean> {
  try {
    console.log("🔄 Atualizando bot na Evolution API...")
    console.log("📋 Instância:", instanceName)
    console.log("📋 Bot ID:", botId)

    const config = await getEvolutionConfig()
    const url = `${config.apiUrl}/evolutionBot/update/${botId}/${instanceName}`

    console.log("🌐 Fazendo requisição para:", url)

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        apikey: config.apiKey || "",
      },
      body: JSON.stringify(botData),
    })

    console.log("📡 Status da resposta:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Erro ao atualizar bot:", errorText)
      return false
    }

    console.log("✅ Bot atualizado com sucesso")
    return true
  } catch (error: any) {
    console.error("❌ Erro ao atualizar bot:", error)
    return false
  }
}

export async function deleteEvolutionBot(instanceName: string, botId: string): Promise<boolean> {
  try {
    console.log("🗑️ Deletando bot na Evolution API...")

    const config = await getEvolutionConfig()
    const url = `${config.apiUrl}/evolutionBot/delete/${botId}/${instanceName}`

    console.log("🌐 Fazendo requisição para:", url)

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        apikey: config.apiKey || "",
      },
    })

    console.log("📡 Status da resposta:", response.status)
    return response.ok
  } catch (error: any) {
    console.error("❌ Erro ao deletar bot:", error)
    return false
  }
}

export async function fetchEvolutionBot(instanceName: string, botId: string): Promise<any> {
  try {
    console.log("📥 Buscando bot na Evolution API...")

    const config = await getEvolutionConfig()
    const url = `${config.apiUrl}/evolutionBot/fetch/${botId}/${instanceName}`

    console.log("🌐 Fazendo requisição para:", url)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        apikey: config.apiKey || "",
      },
    })

    if (!response.ok) {
      console.error("❌ Erro ao buscar bot:", response.status)
      return null
    }

    const result = await response.json()
    console.log("✅ Bot encontrado:", result)
    return result
  } catch (error: any) {
    console.error("❌ Erro ao buscar bot:", error)
    return null
  }
}

export async function fetchEvolutionBotSettings(instanceName: string): Promise<any> {
  try {
    console.log("⚙️ Buscando configurações na Evolution API...")

    const config = await getEvolutionConfig()
    const url = `${config.apiUrl}/evolutionBot/fetchSettings/${instanceName}`

    console.log("🌐 Fazendo requisição para:", url)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        apikey: config.apiKey || "",
      },
    })

    if (!response.ok) {
      console.error("❌ Erro ao buscar configurações:", response.status)
      return null
    }

    const result = await response.json()
    console.log("✅ Configurações encontradas:", result)
    return result
  } catch (error: any) {
    console.error("❌ Erro ao buscar configurações:", error)
    return null
  }
}
