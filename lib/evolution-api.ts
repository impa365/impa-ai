// API para integração com Evolution API
const EVOLUTION_API_BASE_URL = process.env.EVOLUTION_API_URL || ""
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ""

export interface CreateBotRequest {
  name: string
  prompt: string
  webhookUrl: string
  instanceName: string
}

export interface CreateBotResponse {
  success: boolean
  botId?: string
  error?: string
}

export async function createEvolutionBot(data: CreateBotRequest): Promise<CreateBotResponse> {
  try {
    // Buscar configurações de integração do admin
    const { data: integrationData } = await fetch("/api/integrations/evolution").then((res) => res.json())

    if (!integrationData?.config?.apiUrl || !integrationData?.config?.apiKey) {
      throw new Error("Evolution API não configurada pelo administrador")
    }

    const response = await fetch(`${integrationData.config.apiUrl}/instance/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: integrationData.config.apiKey,
      },
      body: JSON.stringify({
        instanceName: data.instanceName,
        token: generateInstanceToken(),
        qrcode: true,
        webhook: data.webhookUrl,
        webhook_by_events: true,
        events: [
          "APPLICATION_STARTUP",
          "QRCODE_UPDATED",
          "CONNECTION_UPDATE",
          "MESSAGES_UPSERT",
          "MESSAGES_UPDATE",
          "SEND_MESSAGE",
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`Erro na Evolution API: ${response.statusText}`)
    }

    const result = await response.json()

    return {
      success: true,
      botId: result.instance?.instanceName || data.instanceName,
    }
  } catch (error: any) {
    console.error("Erro ao criar bot na Evolution API:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

export async function deleteEvolutionBot(instanceName: string): Promise<boolean> {
  try {
    const { data: integrationData } = await fetch("/api/integrations/evolution").then((res) => res.json())

    if (!integrationData?.config?.apiUrl || !integrationData?.config?.apiKey) {
      return false
    }

    const response = await fetch(`${integrationData.config.apiUrl}/instance/delete/${instanceName}`, {
      method: "DELETE",
      headers: {
        apikey: integrationData.config.apiKey,
      },
    })

    return response.ok
  } catch (error) {
    console.error("Erro ao deletar bot na Evolution API:", error)
    return false
  }
}

export async function updateEvolutionBot(instanceName: string, webhookUrl: string): Promise<boolean> {
  try {
    const { data: integrationData } = await fetch("/api/integrations/evolution").then((res) => res.json())

    if (!integrationData?.config?.apiUrl || !integrationData?.config?.apiKey) {
      return false
    }

    const response = await fetch(`${integrationData.config.apiUrl}/webhook/set/${instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: integrationData.config.apiKey,
      },
      body: JSON.stringify({
        webhook: webhookUrl,
        webhook_by_events: true,
        events: [
          "APPLICATION_STARTUP",
          "QRCODE_UPDATED",
          "CONNECTION_UPDATE",
          "MESSAGES_UPSERT",
          "MESSAGES_UPDATE",
          "SEND_MESSAGE",
        ],
      }),
    })

    return response.ok
  } catch (error) {
    console.error("Erro ao atualizar webhook do bot:", error)
    return false
  }
}

function generateInstanceToken(): string {
  return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
