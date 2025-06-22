import { supabase } from "./supabase"

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

// Função para validar se a resposta é JSON
function isJsonResponse(response: Response): boolean {
  const contentType = response.headers.get("content-type")
  return contentType && contentType.includes("application/json")
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

    // Validar URL da API
    let apiUrl: string
    try {
      const url = new URL(integrationData.config.apiUrl)
      apiUrl = url.toString().replace(/\/$/, "") // Remove trailing slash
    } catch (urlError) {
      return {
        success: false,
        error: "URL da Evolution API inválida na configuração.",
      }
    }

    // Buscar nome da plataforma
    const globalThemeConfigTable = await supabase.from("global_theme_config")
    const { data: themeData, error: themeError } = await globalThemeConfigTable
      .select("system_name")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (themeError && process.env.NODE_ENV === "development") {
      console.warn("Aviso: Não foi possível buscar nome da plataforma:", themeError.message)
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
    const requestBody = {
      instanceName,
      token,
      integration: "WHATSAPP-BAILEYS",
    }

    if (process.env.NODE_ENV === "development") {
      console.log("Fazendo requisição para Evolution API...")
    }

    const response = await fetch(`${apiUrl}/instance/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: integrationData.config.apiKey,
      },
      body: JSON.stringify(requestBody),
    })

    // Verificar se a resposta é JSON válido
    if (!isJsonResponse(response)) {
      const responseText = await response.text()
      console.error("Evolution API retornou resposta não-JSON:", {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get("content-type"),
        responsePreview: responseText.substring(0, 200) + "...",
      })

      return {
        success: false,
        error: `Evolution API retornou resposta inválida. Status: ${response.status}. Verifique se a URL e chave da API estão corretas.`,
      }
    }

    if (!response.ok) {
      let errorMessage = `Erro ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        errorMessage = `${errorMessage} - ${response.statusText}`
      }

      console.error("Erro na Evolution API ao criar instância:", {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
      })

      return {
        success: false,
        error: `Erro na Evolution API: ${errorMessage}`,
      }
    }

    let evolutionResponse: any
    try {
      evolutionResponse = await response.json()
    } catch (jsonError) {
      console.error("Erro ao fazer parse do JSON da resposta:", jsonError)
      return {
        success: false,
        error: "Resposta da Evolution API não é um JSON válido.",
      }
    }

    // Verificar se a resposta tem a estrutura esperada
    if (!evolutionResponse || (!Array.isArray(evolutionResponse) && !evolutionResponse.instance)) {
      console.error("Resposta da Evolution API tem estrutura inesperada:", evolutionResponse)
      return {
        success: false,
        error: "Resposta da Evolution API tem formato inesperado.",
      }
    }

    // Salvar no banco de dados
    const whatsappConnectionsTableInsert = await supabase.from("whatsapp_connections")
    const { data: connectionData, error: dbError } = await whatsappConnectionsTableInsert
      .insert([
        {
          user_id: userId,
          connection_name: connectionName,
          instance_name: instanceName,
          instance_id: Array.isArray(evolutionResponse)
            ? evolutionResponse[0]?.instance?.instanceId || null
            : evolutionResponse.instance?.instanceId || null,
          instance_token: token,
          status: "disconnected",
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
        evolutionResponse: Array.isArray(evolutionResponse) ? evolutionResponse[0] : evolutionResponse,
      },
    }
  } catch (error: any) {
    console.error("Erro interno ao criar instância:", error)
    return {
      success: false,
      error: `Erro interno: ${error.message || "Erro desconhecido"}`,
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
      console.error("Erro ao buscar config da Evolution API:", integrationError)
      return { success: false, error: "Erro ao buscar configuração da Evolution API." }
    }

    if (!integrationData?.config?.apiUrl || !integrationData?.config?.apiKey) {
      return {
        success: false,
        error: "Evolution API não configurada.",
      }
    }

    // Validar URL da API
    let apiUrl: string
    try {
      const url = new URL(integrationData.config.apiUrl)
      apiUrl = url.toString().replace(/\/$/, "")
    } catch (urlError) {
      return {
        success: false,
        error: "URL da Evolution API inválida na configuração.",
      }
    }

    const response = await fetch(`${apiUrl}/instance/fetchInstances`, {
      method: "GET",
      headers: {
        apikey: integrationData.config.apiKey,
      },
    })

    if (!isJsonResponse(response)) {
      const responseText = await response.text()
      console.error("Evolution API retornou resposta não-JSON ao buscar instâncias:", {
        status: response.status,
        responsePreview: responseText.substring(0, 200) + "...",
      })

      return {
        success: false,
        error: `Erro ao buscar detalhes: resposta inválida da API (Status: ${response.status})`,
      }
    }

    if (!response.ok) {
      let errorMessage = `Erro ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        errorMessage = `${errorMessage} - ${response.statusText}`
      }

      return {
        success: false,
        error: `Erro ao buscar detalhes: ${errorMessage}`,
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
      error: `Erro interno: ${error.message || "Erro desconhecido"}`,
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
      console.error("Erro ao buscar config da Evolution API:", integrationError)
      return { success: false, error: "Erro ao buscar configuração da Evolution API." }
    }

    if (!integrationData?.config?.apiUrl || !integrationData?.config?.apiKey) {
      return {
        success: false,
        error: "Evolution API não configurada.",
      }
    }

    // Validar URL da API
    let apiUrl: string
    try {
      const url = new URL(integrationData.config.apiUrl)
      apiUrl = url.toString().replace(/\/$/, "")
    } catch (urlError) {
      return {
        success: false,
        error: "URL da Evolution API inválida na configuração.",
      }
    }

    const response = await fetch(`${apiUrl}/instance/connect/${instanceName}`, {
      method: "GET",
      headers: {
        apikey: integrationData.config.apiKey,
      },
    })

    if (!isJsonResponse(response)) {
      const responseText = await response.text()
      console.error("Evolution API retornou resposta não-JSON ao buscar QR Code:", {
        status: response.status,
        responsePreview: responseText.substring(0, 200) + "...",
      })

      return {
        success: false,
        error: `Erro ao buscar QR Code: resposta inválida da API (Status: ${response.status})`,
      }
    }

    if (!response.ok) {
      let errorMessage = `Erro ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        errorMessage = `${errorMessage} - ${response.statusText}`
      }

      return {
        success: false,
        error: `Erro ao buscar QR Code: ${errorMessage}`,
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
      error: `Erro interno: ${error.message || "Erro desconhecido"}`,
    }
  }
}

// Remover a função deleteEvolutionInstance que está causando o erro
// Substituir por uma função que chama o endpoint de API

// Função para deletar instância (usando endpoint de API)
export async function deleteEvolutionInstance(instanceName: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const response = await fetch(`/api/whatsapp/delete/${instanceName}`, {
      method: "DELETE",
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || `Erro ${response.status}`,
      }
    }

    return {
      success: true,
    }
  } catch (error: any) {
    console.error("Erro ao deletar instância:", error)
    return {
      success: false,
      error: `Erro interno: ${error.message || "Erro desconhecido"}`,
    }
  }
}
