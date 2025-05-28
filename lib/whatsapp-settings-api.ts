import { supabase } from "./supabase"

// Função para verificar status de uma instância específica usando connectionState
export async function checkInstanceStatus(instanceName: string): Promise<{
  success: boolean
  status?: string
  number?: string
  error?: string
}> {
  try {
    console.log(`[API] Verificando status da instância: ${instanceName}`)

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

    const apiUrl = `${integrationData.config.apiUrl}/instance/connectionState/${instanceName}`
    console.log(`[API] Fazendo requisição para: ${apiUrl}`)

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        apikey: integrationData.config.apiKey,
      },
      cache: "no-cache",
    })

    console.log(`[API] Status da resposta: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[API] Erro na resposta: ${errorText}`)
      return {
        success: false,
        error: `Erro ao verificar status: ${response.status}`,
      }
    }

    const data = await response.json()
    console.log(`[API] Dados do connectionState para ${instanceName}:`, JSON.stringify(data, null, 2))

    // Extrair o estado da instância conforme o formato da API
    // Formato esperado: { "instance": { "instanceName": "nome", "state": "estado" } }
    let state = "close"

    if (data && data.instance && data.instance.state) {
      state = data.instance.state
    }

    // Mapear o estado da API para nosso formato interno
    let mappedStatus
    switch (state) {
      case "open":
        mappedStatus = "connected"
        break
      case "connecting":
        mappedStatus = "connecting"
        break
      case "close":
      default:
        mappedStatus = "disconnected"
        break
    }

    console.log(`[API] Estado da instância ${instanceName}: "${state}" -> mapeado para "${mappedStatus}"`)

    return {
      success: true,
      status: mappedStatus,
      number: data.instance?.wuid || data.instance?.number || null,
    }
  } catch (error) {
    console.error("Erro ao verificar status:", error)
    return {
      success: false,
      error: "Erro interno do servidor.",
    }
  }
}

// Função para sincronizar status de uma instância específica
export async function syncInstanceStatus(instanceId: string): Promise<{
  success: boolean
  updated: boolean
  error?: string
}> {
  try {
    console.log(`[SYNC] Sincronizando instância ID: ${instanceId}`)

    // 1. Buscar dados da conexão no banco
    const { data: connection, error: dbError } = await supabase
      .from("whatsapp_connections")
      .select("*")
      .eq("id", instanceId)
      .single()

    if (dbError || !connection) {
      console.error("[SYNC] Erro ao buscar conexão do banco:", dbError)
      return {
        success: false,
        updated: false,
        error: "Conexão não encontrada",
      }
    }

    console.log(`[SYNC] Conexão encontrada: ${connection.connection_name} (${connection.instance_name})`)

    // 2. Verificar status na API
    const statusResult = await checkInstanceStatus(connection.instance_name)

    if (!statusResult.success) {
      console.error(`[SYNC] Erro ao verificar status: ${statusResult.error}`)
      return {
        success: false,
        updated: false,
        error: statusResult.error,
      }
    }

    const newStatus = statusResult.status
    const phoneNumber = statusResult.number || connection.phone_number

    // 3. Atualizar no banco se o status mudou
    if (newStatus !== connection.status || phoneNumber !== connection.phone_number) {
      console.log(`[SYNC] Atualizando status: ${connection.status} -> ${newStatus}`)

      const { error: updateError } = await supabase
        .from("whatsapp_connections")
        .update({
          status: newStatus,
          phone_number: phoneNumber,
          last_sync: new Date().toISOString(),
        })
        .eq("id", connection.id)

      if (updateError) {
        console.error(`[SYNC] Erro ao atualizar conexão:`, updateError)
        return {
          success: false,
          updated: false,
          error: "Erro ao atualizar status no banco",
        }
      }

      console.log(`[SYNC] Status atualizado com sucesso: ${connection.status} -> ${newStatus}`)
      return {
        success: true,
        updated: true,
      }
    } else {
      console.log(`[SYNC] Status não mudou: ${connection.status}`)
      // Atualizar apenas o timestamp de sincronização
      await supabase
        .from("whatsapp_connections")
        .update({
          last_sync: new Date().toISOString(),
        })
        .eq("id", connection.id)

      return {
        success: true,
        updated: false,
      }
    }
  } catch (error) {
    console.error("[SYNC] Erro na sincronização:", error)
    return {
      success: false,
      updated: false,
      error: "Erro interno na sincronização",
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

// Função para buscar configurações atuais da API - SEMPRE EM TEMPO REAL
export async function getInstanceSettings(instanceName: string): Promise<{
  success: boolean
  settings?: any
  error?: string
}> {
  try {
    console.log(`[API] Buscando configurações para instância: ${instanceName}`)

    const { data: integrationData } = await supabase
      .from("integrations")
      .select("config")
      .eq("type", "evolution_api")
      .eq("is_active", true)
      .single()

    if (!integrationData?.config?.apiUrl || !integrationData?.config?.apiKey) {
      console.error("[API] Evolution API não configurada")
      return {
        success: false,
        error: "Evolution API não configurada.",
      }
    }

    const apiUrl = `${integrationData.config.apiUrl}/settings/find/${instanceName}`
    console.log(`[API] Fazendo requisição para: ${apiUrl}`)

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        apikey: integrationData.config.apiKey,
        "Content-Type": "application/json",
      },
      cache: "no-cache",
    })

    console.log(`[API] Status da resposta: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[API] Erro na resposta: ${errorText}`)
      return {
        success: false,
        error: `Erro ao buscar configurações: ${response.status} - ${errorText}`,
      }
    }

    const data = await response.json()
    console.log("[API] Dados recebidos:", data)

    let settings = {}

    if (data.settings) {
      settings = data.settings
    } else if (data.data && data.data.settings) {
      settings = data.data.settings
    } else if (data.data) {
      settings = data.data
    } else {
      settings = data
    }

    console.log("[API] Configurações extraídas:", settings)

    return {
      success: true,
      settings: settings,
    }
  } catch (error) {
    console.error("[API] Erro ao buscar configurações:", error)
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
    console.log(`[API] Salvando configurações para instância: ${instanceName}`)
    console.log("[API] Configurações a salvar:", settings)

    const { data: integrationData } = await supabase
      .from("integrations")
      .select("config")
      .eq("type", "evolution_api")
      .eq("is_active", true)
      .single()

    if (!integrationData?.config?.apiUrl || !integrationData?.config?.apiKey) {
      console.error("[API] Evolution API não configurada")
      return {
        success: false,
        error: "Evolution API não configurada.",
      }
    }

    const apiUrl = `${integrationData.config.apiUrl}/settings/set/${instanceName}`
    console.log(`[API] Fazendo requisição POST para: ${apiUrl}`)

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: integrationData.config.apiKey,
      },
      body: JSON.stringify(settings),
    })

    console.log(`[API] Status da resposta: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[API] Erro na resposta: ${errorText}`)
      return {
        success: false,
        error: `Erro ao salvar configurações: ${response.status} - ${errorText}`,
      }
    }

    const data = await response.json()
    console.log("[API] Resposta do salvamento:", data)

    return { success: true }
  } catch (error) {
    console.error("[API] Erro ao salvar configurações:", error)
    return {
      success: false,
      error: "Erro interno do servidor.",
    }
  }
}

// Função para aplicar configurações via Evolution API (mantida para compatibilidade)
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
  return saveInstanceSettings(instanceName, settings)
}
