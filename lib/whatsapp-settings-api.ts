import { supabase } from "./supabase"

// Função para verificar status da instância
export async function checkInstanceStatus(instanceName: string): Promise<{
  success: boolean
  status?: string
  number?: string
  error?: string
}> {
  try {
    const { data: integrationData } = await supabase
      .from("integrations")
      .select("config")
      .eq("type", "evolution_api")
      .eq("is_active", true)
      .single()

    if (!integrationData?.config?.apiUrl || !integrationData?.config?.apiKey) {
      return {
        success: false,
        error: "Evolution API não configurada.",
      }
    }

    const response = await fetch(`${integrationData.config.apiUrl}/instance/connectionState/${instanceName}`, {
      method: "GET",
      headers: {
        apikey: integrationData.config.apiKey,
      },
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Erro ao verificar status: ${response.status}`,
      }
    }

    const data = await response.json()

    return {
      success: true,
      status: data.state || "disconnected",
      number: data.instance?.wuid || null,
    }
  } catch (error) {
    console.error("Erro ao verificar status:", error)
    return {
      success: false,
      error: "Erro interno do servidor.",
    }
  }
}

// Função para desconectar instância
export async function disconnectInstance(instanceName: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { data: integrationData } = await supabase
      .from("integrations")
      .select("config")
      .eq("type", "evolution_api")
      .eq("is_active", true)
      .single()

    if (!integrationData?.config?.apiUrl || !integrationData?.config?.apiKey) {
      return {
        success: false,
        error: "Evolution API não configurada.",
      }
    }

    const response = await fetch(`${integrationData.config.apiUrl}/instance/logout/${instanceName}`, {
      method: "DELETE",
      headers: {
        apikey: integrationData.config.apiKey,
      },
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Erro ao desconectar: ${response.status}`,
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Erro ao desconectar:", error)
    return {
      success: false,
      error: "Erro interno do servidor.",
    }
  }
}

// Função para buscar configurações atuais da API
export async function getInstanceSettings(instanceName: string): Promise<{
  success: boolean
  settings?: any
  error?: string
}> {
  try {
    const { data: integrationData } = await supabase
      .from("integrations")
      .select("config")
      .eq("type", "evolution_api")
      .eq("is_active", true)
      .single()

    if (!integrationData?.config?.apiUrl || !integrationData?.config?.apiKey) {
      return {
        success: false,
        error: "Evolution API não configurada.",
      }
    }

    const response = await fetch(`${integrationData.config.apiUrl}/settings/find/${instanceName}`, {
      method: "GET",
      headers: {
        apikey: integrationData.config.apiKey,
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
      settings: data.settings || {},
    }
  } catch (error) {
    console.error("Erro ao buscar configurações:", error)
    return {
      success: false,
      error: "Erro interno do servidor.",
    }
  }
}

// Função para salvar configurações na API
export async function saveInstanceSettings(
  instanceName: string,
  settings: any,
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { data: integrationData } = await supabase
      .from("integrations")
      .select("config")
      .eq("type", "evolution_api")
      .eq("is_active", true)
      .single()

    if (!integrationData?.config?.apiUrl || !integrationData?.config?.apiKey) {
      return {
        success: false,
        error: "Evolution API não configurada.",
      }
    }

    const response = await fetch(`${integrationData.config.apiUrl}/settings/set/${instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: integrationData.config.apiKey,
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
    console.error("Erro ao salvar configurações:", error)
    return {
      success: false,
      error: "Erro interno do servidor.",
    }
  }
}

// Função para aplicar configurações via Evolution API
export async function applyWhatsAppSettings(
  instanceName: string,
  settings: {
    groupsIgnore: boolean
    readMessages: boolean
    alwaysOnline: boolean
    readStatus: boolean
    rejectCall: boolean
    msgCall: string
    syncFullHistory: boolean
  },
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Buscar configurações da Evolution API
    const { data: integrationData } = await supabase
      .from("integrations")
      .select("config")
      .eq("type", "evolution_api")
      .eq("is_active", true)
      .single()

    if (!integrationData?.config?.apiUrl || !integrationData?.config?.apiKey) {
      return {
        success: false,
        error: "Evolution API não configurada.",
      }
    }

    // Aplicar configurações via Evolution API
    const response = await fetch(`${integrationData.config.apiUrl}/settings/set/${instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: integrationData.config.apiKey,
      },
      body: JSON.stringify(settings),
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Erro ao aplicar configurações: ${response.status}`,
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Erro ao aplicar configurações:", error)
    return {
      success: false,
      error: "Erro interno do servidor.",
    }
  }
}
