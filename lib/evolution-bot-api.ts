import { supabase } from "./supabase"

export interface EvolutionBotConfig {
  enabled: boolean
  description: string
  apiUrl: string
  apiKey?: string
  triggerType: "all" | "keyword"
  triggerOperator: "contains" | "equals" | "startsWith" | "endsWith" | "regex" | "none"
  triggerValue?: string
  expire: number
  keywordFinish: string
  delayMessage: number
  unknownMessage: string
  listeningFromMe: boolean
  stopBotFromMe: boolean
  keepOpen: boolean
  debounceTime: number
  ignoreJids: string[]
  splitMessages: boolean
  timePerChar: number
}

export interface EvolutionBotResponse {
  id: string
  enabled: boolean
  description: string
  apiUrl: string
  apiKey?: string
  expire: number
  keywordFinish: string
  delayMessage: number
  unknownMessage: string
  listeningFromMe: boolean
  stopBotFromMe: boolean
  keepOpen: boolean
  debounceTime: number
  ignoreJids: string[]
  splitMessages: boolean
  timePerChar: number
  triggerType: string
  triggerOperator: string
  triggerValue: string
  createdAt: string
  updatedAt: string
  instanceId: string
}

// Função para obter configurações da Evolution API
async function getEvolutionConfig() {
  const { data: integrationData } = await supabase
    .from("integrations")
    .select("config")
    .eq("type", "evolution_api")
    .eq("is_active", true)
    .single()

  if (!integrationData?.config?.apiUrl || !integrationData?.config?.apiKey) {
    throw new Error("Evolution API não configurada")
  }

  return integrationData.config
}

// Função para obter configurações do N8N
async function getN8NConfig() {
  const { data: integrationData } = await supabase
    .from("integrations")
    .select("config")
    .eq("type", "n8n")
    .eq("is_active", true)
    .single()

  if (!integrationData?.config?.flowUrl) {
    throw new Error("N8N não configurado")
  }

  return integrationData.config
}

// Criar bot na Evolution API
export async function createEvolutionBot(
  instanceName: string,
  agentId: string,
  config: EvolutionBotConfig,
): Promise<{
  success: boolean
  data?: EvolutionBotResponse
  error?: string
}> {
  try {
    const evolutionConfig = await getEvolutionConfig()
    const n8nConfig = await getN8NConfig()

    // Construir URL do N8N com o ID do agente
    const n8nUrl = `${n8nConfig.flowUrl}?agent_id=${agentId}`

    const botConfig = {
      ...config,
      apiUrl: n8nUrl,
      apiKey: n8nConfig.apiKey || undefined,
    }

    const response = await fetch(`${evolutionConfig.apiUrl}/evolutionBot/create/${instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: evolutionConfig.apiKey,
      },
      body: JSON.stringify(botConfig),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        error: `Erro na Evolution API: ${response.status} - ${errorText}`,
      }
    }

    const data = await response.json()

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error("Erro ao criar bot Evolution:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    }
  }
}

// Buscar bot da Evolution API
export async function fetchEvolutionBot(
  instanceName: string,
  evolutionBotId: string,
): Promise<{
  success: boolean
  data?: EvolutionBotResponse
  error?: string
}> {
  try {
    const evolutionConfig = await getEvolutionConfig()

    const response = await fetch(`${evolutionConfig.apiUrl}/evolutionBot/fetch/${evolutionBotId}/${instanceName}`, {
      method: "GET",
      headers: {
        apikey: evolutionConfig.apiKey,
      },
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Erro ao buscar bot: ${response.status}`,
      }
    }

    const data = await response.json()

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error("Erro ao buscar bot Evolution:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    }
  }
}

// Atualizar bot na Evolution API
export async function updateEvolutionBot(
  instanceName: string,
  evolutionBotId: string,
  agentId: string,
  config: EvolutionBotConfig,
): Promise<{
  success: boolean
  data?: EvolutionBotResponse
  error?: string
}> {
  try {
    const evolutionConfig = await getEvolutionConfig()
    const n8nConfig = await getN8NConfig()

    // Construir URL do N8N com o ID do agente
    const n8nUrl = `${n8nConfig.flowUrl}?agent_id=${agentId}`

    const botConfig = {
      ...config,
      apiUrl: n8nUrl,
      apiKey: n8nConfig.apiKey || undefined,
    }

    const response = await fetch(`${evolutionConfig.apiUrl}/evolutionBot/update/${evolutionBotId}/${instanceName}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        apikey: evolutionConfig.apiKey,
      },
      body: JSON.stringify(botConfig),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        error: `Erro na Evolution API: ${response.status} - ${errorText}`,
      }
    }

    const data = await response.json()

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error("Erro ao atualizar bot Evolution:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    }
  }
}

// Deletar bot da Evolution API
export async function deleteEvolutionBot(
  instanceName: string,
  evolutionBotId: string,
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const evolutionConfig = await getEvolutionConfig()

    const response = await fetch(`${evolutionConfig.apiUrl}/evolutionBot/delete/${evolutionBotId}/${instanceName}`, {
      method: "DELETE",
      headers: {
        apikey: evolutionConfig.apiKey,
      },
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Erro ao deletar bot: ${response.status}`,
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Erro ao deletar bot Evolution:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    }
  }
}

// Buscar configurações padrão dos bots
export async function fetchEvolutionBotSettings(instanceName: string): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    const evolutionConfig = await getEvolutionConfig()

    const response = await fetch(`${evolutionConfig.apiUrl}/evolutionBot/fetchSettings/${instanceName}`, {
      method: "GET",
      headers: {
        apikey: evolutionConfig.apiKey,
      },
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Erro ao buscar configurações: ${response.status}`,
      }
    }

    const data = await response.json()

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error("Erro ao buscar configurações do bot:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    }
  }
}

// Salvar configurações padrão dos bots
export async function saveEvolutionBotSettings(
  instanceName: string,
  settings: any,
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const evolutionConfig = await getEvolutionConfig()

    const response = await fetch(`${evolutionConfig.apiUrl}/evolutionBot/settings/${instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: evolutionConfig.apiKey,
      },
      body: JSON.stringify(settings),
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Erro ao salvar configurações: ${response.status}`,
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Erro ao salvar configurações do bot:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    }
  }
}
