import { supabase } from "./supabase"

// API para integração com Evolution API
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

async function getN8nConfig() {
  const { data } = await supabase.from("integrations").select("config").eq("type", "n8n").eq("is_active", true).single()

  return data?.config || null
}

export async function createEvolutionBot(data: CreateBotRequest): Promise<CreateBotResponse> {
  try {
    const config = await getEvolutionConfig()
    const n8nConfig = await getN8nConfig()

    const webhookUrl = n8nConfig?.flowUrl ? `${n8nConfig.flowUrl}?id_evobot=${data.instanceName}` : data.webhookUrl

    const response = await fetch(`${config.apiUrl}/instance/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.apiKey,
      },
      body: JSON.stringify({
        instanceName: data.instanceName,
        token: generateInstanceToken(),
        qrcode: true,
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
    const config = await getEvolutionConfig()

    const response = await fetch(`${config.apiUrl}/instance/delete/${instanceName}`, {
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

export async function updateEvolutionBot(instanceName: string, webhookUrl: string): Promise<boolean> {
  try {
    const config = await getEvolutionConfig()

    const response = await fetch(`${config.apiUrl}/webhook/set/${instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.apiKey,
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
