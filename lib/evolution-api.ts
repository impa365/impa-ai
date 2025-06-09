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

async function getEvolutionConfig() {
  const { data, error } = await supabase
    .from("integrations")
    .select("config")
    .eq("type", "evolution_api")
    .eq("is_active", true)
    .single()

  if (error || !data?.config?.apiUrl || !data?.config?.apiKey) {
    throw new Error("Evolution API não configurada pelo administrador")
  }

  return data.config
}

export async function createEvolutionBot(instanceName: string, botData: CreateBotRequest): Promise<CreateBotResponse> {
  try {
    const config = await getEvolutionConfig()

    const response = await fetch(`${config.apiUrl}/evolutionBot/create/${instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.apiKey,
      },
      body: JSON.stringify(botData),
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Erro na Evolution API: ${response.statusText} - ${errorData}`)
    }

    const result = await response.json()

    return {
      success: true,
      botId: result.id,
    }
  } catch (error: any) {
    console.error("Erro ao criar bot na Evolution API:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

export async function updateEvolutionBot(
  instanceName: string,
  botId: string,
  botData: CreateBotRequest,
): Promise<boolean> {
  try {
    const config = await getEvolutionConfig()

    const response = await fetch(`${config.apiUrl}/evolutionBot/update/${botId}/${instanceName}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        apikey: config.apiKey,
      },
      body: JSON.stringify(botData),
    })

    return response.ok
  } catch (error) {
    console.error("Erro ao atualizar bot na Evolution API:", error)
    return false
  }
}

export async function deleteEvolutionBot(instanceName: string, botId: string): Promise<boolean> {
  try {
    const config = await getEvolutionConfig()

    const response = await fetch(`${config.apiUrl}/evolutionBot/delete/${botId}/${instanceName}`, {
      method: "DELETE",
      headers: {
        apikey: config.apiKey,
      },
    })

    return response.ok
  } catch (error) {
    console.error("Erro ao deletar bot na Evolution API:", error)
    return false
  }
}

export async function fetchEvolutionBot(instanceName: string, botId: string): Promise<any> {
  try {
    const config = await getEvolutionConfig()

    const response = await fetch(`${config.apiUrl}/evolutionBot/fetch/${botId}/${instanceName}`, {
      method: "GET",
      headers: {
        apikey: config.apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(`Erro ao buscar bot: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Erro ao buscar bot na Evolution API:", error)
    return null
  }
}

export async function fetchEvolutionBotSettings(instanceName: string): Promise<any> {
  try {
    const config = await getEvolutionConfig()

    const response = await fetch(`${config.apiUrl}/evolutionBot/fetchSettings/${instanceName}`, {
      method: "GET",
      headers: {
        apikey: config.apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(`Erro ao buscar configurações: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Erro ao buscar configurações do bot:", error)
    return null
  }
}
