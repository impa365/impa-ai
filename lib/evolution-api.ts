// Remover todas as funções que fazem acesso direto ao Supabase
// Agora todas as operações passam pelas APIs seguras

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

// Função para verificar se a Evolution API está configurada
export async function checkEvolutionConfig(): Promise<boolean> {
  try {
    const response = await fetch("/api/integrations/evolution/config")
    const result = await response.json()
    return result.success && result.configured
  } catch (error) {
    return false
  }
}

// Todas as outras funções agora usam as APIs seguras em vez de acesso direto ao Supabase
// As operações específicas da Evolution API são feitas através das APIs que criamos

// Função para buscar configurações da instância na Evolution API
export async function fetchEvolutionBotSettings(instanceName: string): Promise<any> {
  try {
    // 🔧 ENDPOINT CORRIGIDO: Agora usa /settings em vez de /instance/fetchSettings
    const response = await fetch(`/api/integrations/evolution/settings/${instanceName}`)

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
    // 🔧 ENDPOINT CORRIGIDO: Agora usa /settings em vez de /instance/setSettings
    const response = await fetch(`/api/integrations/evolution/settings/${instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
    const response = await fetch(`/api/integrations/evolution/evolutionBot/create/${instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
    const response = await fetch(`/api/integrations/evolution/evolutionBot/update/${botId}/${instanceName}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
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
    const response = await fetch(`/api/integrations/evolution/evolutionBot/delete/${botId}/${instanceName}`, {
      method: "DELETE",
    })

    return response.ok
  } catch (error: any) {
    console.error(`Erro ao deletar bot ${botId}:`, error.message)
    return false
  }
}

export async function fetchEvolutionBot(instanceName: string, botId: string): Promise<any> {
  try {
    const response = await fetch(`/api/integrations/evolution/evolutionBot/fetch/${botId}/${instanceName}`)

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
