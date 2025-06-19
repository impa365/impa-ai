import { supabase } from "./supabase"

// Tipos para as configurações da Evolution API
export interface EvolutionInstanceSettings {
  groupsIgnore?: boolean
  readMessages?: boolean
  alwaysOnline?: boolean
  readStatus?: boolean
  rejectCall?: boolean
  msgCall?: string
  syncFullHistory?: boolean
}

export interface EvolutionBotIndividualConfig {
  enabled: boolean
  description?: string
  keywordFinish?: string
  delayMessage?: number
  unknownMessage?: string
  listeningFromMe?: boolean
  stopBotFromMe?: boolean
  keepOpen?: boolean
  debounceTime?: number
  ignoreJids?: string[]
}

export interface CreateBotResponse {
  success: boolean
  botId?: string
  error?: string
}

// Melhorar a função getEvolutionConfig para validação mais robusta
async function getEvolutionConfig() {
  try {
    const integrationsTable = await supabase.from("integrations")
    const { data, error: dbError } = await integrationsTable
      .select("config")
      .eq("type", "evolution_api")
      .eq("is_active", true)
      .single()

    if (dbError) {
      throw new Error(`Erro no banco de dados: ${dbError.message}`)
    }

    if (!data) {
      throw new Error("Configuração da Evolution API não encontrada ou inativa")
    }

    const config = data.config as { apiUrl?: string; apiKey?: string }

    if (!config || typeof config !== "object") {
      throw new Error("Configuração da Evolution API está em formato inválido")
    }

    if (!config.apiUrl || config.apiUrl.trim() === "") {
      throw new Error("URL da Evolution API não está configurada")
    }

    return config
  } catch (error: any) {
    console.error("Erro ao buscar configuração da Evolution API:", error.message)
    throw error
  }
}

// Função para buscar configurações da instância na Evolution API
export async function fetchEvolutionBotSettings(instanceName: string): Promise<any> {
  try {
    const config = await getEvolutionConfig()
    const url = `${config.apiUrl}/instance/fetchSettings/${instanceName}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        apikey: config.apiKey || "",
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error(`Erro ao buscar configurações da Evolution API: ${response.status}`)
      return null
    }

    const result = await response.json()
    return result
  } catch (error: any) {
    console.error(`Erro ao buscar configurações da instância ${instanceName}:`, error.message)
    return null
  }
}

// Função para definir configurações da instância na Evolution API
export async function setEvolutionInstanceSettings(
  instanceName: string,
  settingsData: EvolutionInstanceSettings,
): Promise<boolean> {
  try {
    const config = await getEvolutionConfig()
    const url = `${config.apiUrl}/instance/setSettings/${instanceName}`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.apiKey || "",
      },
      body: JSON.stringify(settingsData),
    })

    if (!response.ok) {
      console.error(`Erro ao configurar definições da instância: ${response.status}`)
      return false
    }

    return true
  } catch (error: any) {
    console.error(`Erro ao configurar definições da instância ${instanceName}:`, error.message)
    return false
  }
}

// Manter as outras funções existentes
export async function createEvolutionBot(
  instanceName: string,
  botData: EvolutionBotIndividualConfig,
): Promise<CreateBotResponse> {
  try {
    const config = await getEvolutionConfig()
    const url = `${config.apiUrl}/evolutionBot/create/${instanceName}`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.apiKey || "",
      },
      body: JSON.stringify(botData),
    })

    const responseText = await response.text()

    if (!response.ok) {
      return {
        success: false,
        error: `Erro ${response.status} da Evolution API: ${responseText || "Resposta vazia"}`,
      }
    }

    try {
      const result = JSON.parse(responseText)
      if (!result.id) {
        return { success: false, error: "Resposta da API não contém ID do bot esperado." }
      }
      return { success: true, botId: result.id }
    } catch (parseError) {
      return { success: false, error: "Resposta da API não é um JSON válido." }
    }
  } catch (error: any) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      return {
        success: false,
        error: "Não foi possível conectar com a Evolution API. Verifique se o servidor está funcionando.",
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
    const config = await getEvolutionConfig()
    const url = `${config.apiUrl}/evolutionBot/update/${botId}/${instanceName}`

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        apikey: config.apiKey || "",
      },
      body: JSON.stringify(botData),
    })

    return response.ok
  } catch (error: any) {
    console.error(`Erro ao atualizar bot ${botId}:`, error.message)
    return false
  }
}

export async function deleteEvolutionBot(instanceName: string, botId: string): Promise<boolean> {
  try {
    const config = await getEvolutionConfig()
    const url = `${config.apiUrl}/evolutionBot/delete/${botId}/${instanceName}`

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        apikey: config.apiKey || "",
      },
    })

    return response.ok
  } catch (error: any) {
    console.error(`Erro ao deletar bot ${botId}:`, error.message)
    return false
  }
}

export async function fetchEvolutionBot(instanceName: string, botId: string): Promise<any> {
  try {
    const config = await getEvolutionConfig()
    const url = `${config.apiUrl}/evolutionBot/fetch/${botId}/${instanceName}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        apikey: config.apiKey || "",
      },
    })

    if (!response.ok) {
      return null
    }

    const responseText = await response.text()
    try {
      return JSON.parse(responseText)
    } catch (parseError) {
      return null
    }
  } catch (error: any) {
    console.error(`Erro ao buscar bot ${botId}:`, error.message)
    return null
  }
}
