import { supabase } from "./supabase" // Import db as well for potential future refactor

// Função para gerar token único
function generateInstanceToken(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16).toUpperCase()
  })
}

// Função para gerar nome da instância
function generateInstanceName(platformName: string, connectionName: string): string {
  const randomNumber = Math.floor(Math.random() * 9999) + 1000
  const cleanConnectionName = connectionName.toLowerCase().replace(/[^a-z0-9]/g, "")
  const cleanPlatformName = platformName.toLowerCase().replace(/[^a-z0-9]/g, "")
  return `${cleanPlatformName}_${cleanConnectionName}_${randomNumber}`
}

// Função para verificar se nome/token já existe
async function checkInstanceExists(instanceName: string, token: string): Promise<boolean> {
  const whatsappConnectionsTable = await supabase.from("whatsapp_connections")
  const { data } = await whatsappConnectionsTable
    .select("id")
    .or(`instance_name.eq.${instanceName},instance_token.eq.${token}`)
    .limit(1)

  return (data?.length || 0) > 0
}

// Função para criar instância na Evolution API
export async function createEvolutionInstance(
  connectionName: string,
  userId: string,
): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    // Buscar configurações da Evolution API
    const integrationsTable = await supabase.from("integrations")
    const { data: integrationData, error: integrationError } = await integrationsTable
      .select("config")
      .eq("type", "evolution_api")
      .eq("is_active", true)
      .single()

    if (integrationError) {
      console.error("Erro ao buscar configuração da Evolution API:", integrationError)
      return { success: false, error: "Erro ao buscar configuração da Evolution API." }
    }
    if (!integrationData?.config?.apiUrl || !integrationData?.config?.apiKey) {
      return {
        success: false,
        error: "Evolution API não configurada. Entre em contato com o administrador.",
      }
    }

    // Buscar nome da plataforma
    // Note: "global_theme_config" might be better accessed via db.systemSettings or db.themes if it's one of those
    const globalThemeConfigTable = await supabase.from("global_theme_config")
    const { data: themeData, error: themeError } = await globalThemeConfigTable
      .select("system_name")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (themeError) {
      console.warn("Aviso: Não foi possível buscar nome da plataforma de global_theme_config:", themeError.message)
    }
    const platformName = themeData?.system_name || "impaai"

    // Gerar nome e token únicos
    let instanceName: string
    let token: string
    let attempts = 0

    do {
      instanceName = generateInstanceName(platformName, connectionName)
      token = generateInstanceToken()
      attempts++

      if (attempts > 10) {
        return {
          success: false,
          error: "Erro ao gerar identificadores únicos. Tente novamente.",
        }
      }
    } while (await checkInstanceExists(instanceName, token))

    // Criar instância na Evolution API
    const apiUrl = integrationData.config.apiUrl
    const maskedApiUrl = apiUrl.replace(/^(https?:\/\/)[^@/]+@/, "$1")

    const response = await fetch(`${integrationData.config.apiUrl}/instance/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: integrationData.config.apiKey,
      },
      body: JSON.stringify({
        instanceName,
        token,
        integration: "WHATSAPP-BAILEYS", // Consider making this configurable if other integrations are planned
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Erro na Evolution API ao criar instância: ${response.status} - ${errorText}`)
      return {
        success: false,
        error: `Erro na Evolution API: ${response.status} - ${errorText}`,
      }
    }

    const evolutionResponse = await response.json()

    // Salvar no banco de dados
    const whatsappConnectionsTableInsert = await supabase.from("whatsapp_connections")
    const { data: connectionData, error: dbError } = await whatsappConnectionsTableInsert
      .insert([
        {
          user_id: userId,
          connection_name: connectionName,
          instance_name: instanceName,
          instance_id: evolutionResponse[0]?.instance?.instanceId || null,
          instance_token: token,
          status: "disconnected", // Initial status
        },
      ])
      .select()
      .single()

    if (dbError) {
      console.error("Erro ao salvar conexão no banco de dados:", dbError)
      return {
        success: false,
        error: "Erro ao salvar conexão no banco de dados.",
      }
    }

    return {
      success: true,
      data: {
        connection: connectionData,
        evolutionResponse: evolutionResponse[0],
      },
    }
  } catch (error: any) {
    console.error("Erro interno ao criar instância:", error)
    return {
      success: false,
      error: `Erro interno do servidor: ${error.message || error}`,
    }
  }
}

// Função para buscar detalhes da instância
export async function fetchInstanceDetails(instanceName: string): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    // Buscar configurações da Evolution API
    const integrationsTable = await supabase.from("integrations")
    const { data: integrationData, error: integrationError } = await integrationsTable
      .select("config")
      .eq("type", "evolution_api")
      .eq("is_active", true)
      .single()

    if (integrationError) {
      console.error("Erro ao buscar config da Evolution API (fetchInstanceDetails):", integrationError)
      return { success: false, error: "Erro ao buscar configuração da Evolution API." }
    }
    if (!integrationData?.config?.apiUrl || !integrationData?.config?.apiKey) {
      return {
        success: false,
        error: "Evolution API não configurada.",
      }
    }

    const response = await fetch(`${integrationData.config.apiUrl}/instance/fetchInstances`, {
      method: "GET",
      headers: {
        apikey: integrationData.config.apiKey,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Erro ao buscar detalhes da instância da Evolution API: ${response.status} - ${errorText}`)
      return {
        success: false,
        error: `Erro ao buscar detalhes: ${response.status}`,
      }
    }

    const data = await response.json()

    // Filtrar para obter apenas a instância solicitada
    const instanceDetails = Array.isArray(data) ? data.find((instance) => instance.name === instanceName) : data

    if (!instanceDetails) {
      return {
        success: false,
        error: "Instância não encontrada",
      }
    }

    return {
      success: true,
      data: instanceDetails,
    }
  } catch (error: any) {
    console.error("Erro interno ao buscar detalhes da instância:", error)
    return {
      success: false,
      error: `Erro interno do servidor: ${error.message || error}`,
    }
  }
}

// Função para buscar QR Code
export async function getInstanceQRCode(instanceName: string): Promise<{
  success: boolean
  qrCode?: string
  error?: string
}> {
  try {
    const integrationsTable = await supabase.from("integrations")
    const { data: integrationData, error: integrationError } = await integrationsTable
      .select("config")
      .eq("type", "evolution_api")
      .eq("is_active", true)
      .single()

    if (integrationError) {
      console.error("Erro ao buscar config da Evolution API (getInstanceQRCode):", integrationError)
      return { success: false, error: "Erro ao buscar configuração da Evolution API." }
    }
    if (!integrationData?.config?.apiUrl || !integrationData?.config?.apiKey) {
      return {
        success: false,
        error: "Evolution API não configurada.",
      }
    }

    const response = await fetch(`${integrationData.config.apiUrl}/instance/connect/${instanceName}`, {
      method: "GET",
      headers: {
        apikey: integrationData.config.apiKey,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Erro ao buscar QR Code da Evolution API: ${response.status} - ${errorText}`)
      return {
        success: false,
        error: `Erro ao buscar QR Code: ${response.status}`,
      }
    }

    const data = await response.json()

    return {
      success: true,
      qrCode: data.base64,
    }
  } catch (error: any) {
    console.error("Erro interno ao buscar QR Code:", error)
    return {
      success: false,
      error: `Erro interno do servidor: ${error.message || error}`,
    }
  }
}

// Função para deletar instância
export async function deleteEvolutionInstance(instanceName: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const integrationsTable = await supabase.from("integrations")
    const { data: integrationData, error: integrationError } = await integrationsTable
      .select("config")
      .eq("type", "evolution_api")
      .eq("is_active", true)
      .single()

    if (integrationError) {
      console.error("Erro ao buscar config da Evolution API (deleteEvolutionInstance):", integrationError)
      return { success: false, error: "Erro ao buscar configuração da Evolution API." }
    }
    if (!integrationData?.config?.apiUrl || !integrationData?.config?.apiKey) {
      return {
        success: false,
        error: "Evolution API não configurada.",
      }
    }

    const response = await fetch(`${integrationData.config.apiUrl}/instance/delete/${instanceName}`, {
      method: "DELETE",
      headers: {
        apikey: integrationData.config.apiKey,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Erro ao deletar instância na Evolution API: ${response.status} - ${errorText}`)
      return {
        success: false,
        error: `Erro ao deletar instância: ${response.status}`,
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Erro interno ao deletar instância:", error)
    return {
      success: false,
      error: `Erro interno do servidor: ${error.message || error}`,
    }
  }
}
