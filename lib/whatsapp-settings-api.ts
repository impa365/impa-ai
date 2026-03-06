import { queryOne, queryMany, query } from "@/lib/db"

// Função para verificar status de uma instância específica usando connectionState
export async function checkInstanceStatus(instanceName: string): Promise<{
  success: boolean
  status?: string
  number?: string
  error?: string
}> {
  try {
    if (process.env.NODE_ENV === "development" && typeof window === "undefined") {
      console.log(`[API SERVER LOG] Verificando status da instância: ${instanceName}`)
    }

    // Buscar configuração da Evolution API via SQL
    const integrationData = await queryOne<{ config: any }>(
      `SELECT config FROM integrations WHERE type = $1 AND is_active = true LIMIT 1`,
      ["evolution_api"]
    )

    if (!integrationData?.config?.apiUrl || !integrationData?.config?.apiKey) {
      return {
        success: false,
        error: "Evolution API não configurada.",
      }
    }

    const apiUrl = `${integrationData.config.apiUrl}/instance/connectionState/${instanceName}`
    // Removido: console.log(`[API] Fazendo requisição para: ${apiUrl}`) - Para evitar logar a URL completa no cliente

    // Criar uma Promise com timeout manual em vez de usar AbortController
    const fetchWithTimeout = async (url: string, options: any, timeoutMs: number) => {
      return Promise.race([
        fetch(url, options),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), timeoutMs)),
      ])
    }

    try {
      const response = await fetchWithTimeout(
        apiUrl,
        {
          method: "GET",
          headers: {
            apikey: integrationData.config.apiKey,
          },
          cache: "no-cache",
        },
        8000,
      ) // 8 segundos de timeout

      if (process.env.NODE_ENV === "development" && typeof window === "undefined") {
        console.log(`[API SERVER LOG] Status da resposta para ${instanceName}: ${response.status}`)
      }

      if (!response.ok) {
        const errorText = await response.text()
        if (process.env.NODE_ENV === "development" && typeof window === "undefined") {
          console.error(`[API SERVER LOG] Erro na resposta para ${instanceName}: ${errorText}`)
        }
        return {
          success: false,
          error: `Erro ao verificar status: ${response.status}`,
        }
      }

      const data = await response.json()
      if (process.env.NODE_ENV === "development" && typeof window === "undefined") {
        // Logar apenas se estiver em desenvolvimento e no servidor para evitar expor no cliente
        console.log(`[API SERVER LOG] Dados do connectionState para ${instanceName}:`, JSON.stringify(data, null, 2))
      }

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

      if (process.env.NODE_ENV === "development" && typeof window === "undefined") {
        console.log(
          `[API SERVER LOG] Estado da instância ${instanceName}: "${state}" -> mapeado para "${mappedStatus}"`,
        )
      }

      return {
        success: true,
        status: mappedStatus,
        number: data.instance?.wuid || data.instance?.number || null,
      }
    } catch (fetchError: any) {
      if (process.env.NODE_ENV === "development" && typeof window === "undefined") {
        console.error(`[API SERVER LOG] Erro de fetch para ${instanceName}:`, fetchError)
      }

      // Verificar se é erro de timeout ou outro tipo de erro
      if (fetchError.message === "Request timeout") {
        return {
          success: false,
          error: "Timeout ao verificar status da conexão",
        }
      }

      return {
        success: false,
        error: "Falha na conexão com a API",
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development" && typeof window === "undefined") {
      console.error("[API SERVER LOG] Erro ao verificar status:", error)
    }
    return {
      success: false,
      error: "Erro interno do servidor.",
    }
  }
}

export async function syncInstanceStatus(connectionId: string) {
  try {
    if (process.env.NODE_ENV === "development" && typeof window === "undefined") {
      console.log(`[SYNC SERVER LOG] Iniciando sincronização para conexão: ${connectionId}`)
    }

    // Buscar informações da conexão via SQL
    const connections = await queryMany<{ instance_name: string; status: string }>(
      `SELECT instance_name, status FROM whatsapp_connections WHERE id = $1`,
      [connectionId]
    )

    if (!connections || connections.length === 0) {
      console.error("Conexão não encontrada para ID:", connectionId)
      return { success: false, error: "Conexão não encontrada" }
    }

    const connection = connections[0] // Pegar a primeira conexão encontrada

    if (process.env.NODE_ENV === "development" && typeof window === "undefined") {
      console.log(`[SYNC SERVER LOG] Conexão encontrada: ${connection.instance_name}`)
    }

    // Verificar status real da instância via API
    const statusResult = await checkInstanceStatus(connection.instance_name)

    if (statusResult.success && statusResult.status) {
      // Atualizar apenas com colunas que sabemos que existem
      const currentTime = new Date().toISOString()

      const { rows: updatedRows } = await query(
        `UPDATE whatsapp_connections SET status = $1, updated_at = $2 WHERE id = $3 RETURNING *`,
        [statusResult.status, currentTime, connectionId]
      )
      const data = updatedRows

      if (!data || data.length === 0) {
        console.error("Erro ao atualizar status: nenhuma linha atualizada")
        return { success: false, error: "Erro ao atualizar status" }
      }
      if (process.env.NODE_ENV === "development" && typeof window === "undefined") {
        console.log(`[SYNC SERVER LOG] Status atualizado para: ${statusResult.status}`)
      }
      return {
        success: true,
        updated: true,
        status: statusResult.status,
        data: data?.[0],
      }
    } else {
      // Se não conseguir verificar o status, apenas atualizar o timestamp
      const currentTime = new Date().toISOString()

      await query(
        `UPDATE whatsapp_connections SET updated_at = $1 WHERE id = $2`,
        [currentTime, connectionId]
      )
      if (process.env.NODE_ENV === "development" && typeof window === "undefined") {
        console.log("[SYNC SERVER LOG] Timestamp atualizado (status não verificado)")
      }
      return { success: true, updated: true, note: "Apenas timestamp atualizado" }
    }
  } catch (error) {
    console.error("Erro na sincronização:", error) // Servidor
    return { success: false, error: "Erro interno" }
  }
}

export async function disconnectInstance(instanceName: string) {
  try {
    if (process.env.NODE_ENV === "development" && typeof window === "undefined") {
      console.log(`[DISCONNECT SERVER LOG] Desconectando instância: ${instanceName}`)
    }

    // Buscar configuração da Evolution API via SQL
    const integrationData = await queryOne<{ config: any }>(
      `SELECT config FROM integrations WHERE type = $1 AND is_active = true LIMIT 1`,
      ["evolution_api"]
    )

    if (integrationData?.config?.apiUrl && integrationData?.config?.apiKey) {
      try {
        // Tentar desconectar via API
        const apiUrl = `${integrationData.config.apiUrl}/instance/logout/${instanceName}`
        const response = await fetch(apiUrl, {
          method: "DELETE",
          headers: {
            apikey: integrationData.config.apiKey,
          },
        })

        if (response.ok) {
          if (process.env.NODE_ENV === "development" && typeof window === "undefined") {
            console.log(`[DISCONNECT SERVER LOG] Instância ${instanceName} desconectada via API`)
          }
        } else {
          if (process.env.NODE_ENV === "development" && typeof window === "undefined") {
            console.warn(`[DISCONNECT SERVER LOG] Falha ao desconectar via API: ${response.status}`)
          }
        }
      } catch (apiError) {
        if (process.env.NODE_ENV === "development" && typeof window === "undefined") {
          console.warn("[DISCONNECT SERVER LOG] Erro na API, continuando com atualização local:", apiError)
        }
      }
    }

    // Atualizar status no banco via SQL
    try {
      await query(
        `UPDATE whatsapp_connections SET status = $1, updated_at = $2 WHERE instance_name = $3`,
        ["disconnected", new Date().toISOString(), instanceName]
      )
    } catch (dbError: any) {
      console.error("Erro ao atualizar status de desconexão:", dbError)
      return { success: false, error: "Erro ao desconectar" }
    }
    if (process.env.NODE_ENV === "development" && typeof window === "undefined") {
      console.log(`[DISCONNECT SERVER LOG] Status atualizado para disconnected`)
    }
    return { success: true }
  } catch (error) {
    console.error("Erro ao desconectar instância:", error) // Servidor
    return { success: false, error: "Erro interno" }
  }
}

export async function getInstanceSettings(instanceName: string) {
  try {
    // Buscar configurações da instância no banco via SQL
    let connections: any[]
    try {
      connections = await queryMany(
        `SELECT * FROM whatsapp_connections WHERE instance_name = $1`,
        [instanceName]
      )
    } catch (dbError: any) {
      console.error("Erro ao buscar instância:", dbError)
      return {
        success: false,
        error: "Erro ao buscar instância",
        settings: null,
      }
    }

    if (!connections || connections.length === 0) {
      return {
        success: false,
        error: "Instância não encontrada",
        settings: null,
      }
    }

    const connection = connections[0] // Pegar a primeira conexão encontrada

    // Retornar configurações padrão (você pode expandir isso)
    const settings = {
      groupsIgnore: false,
      readMessages: true,
      alwaysOnline: false,
      readStatus: true,
      rejectCall: false,
      msgCall: "Não posso atender no momento, envie uma mensagem.",
      syncFullHistory: false,
      ...(connection.settings || {}), // Mescla com configurações salvas no banco, se houver
    }

    return {
      success: true,
      settings,
      error: null,
    }
  } catch (error) {
    console.error("Erro ao buscar configurações:", error) // Servidor
    return {
      success: false,
      error: "Erro interno",
      settings: null,
    }
  }
}

export async function saveInstanceSettings(instanceName: string, settings: any) {
  try {
    // Salvar configurações no banco via SQL
    try {
      await query(
        `UPDATE whatsapp_connections SET settings = $1, updated_at = $2 WHERE instance_name = $3`,
        [JSON.stringify(settings), new Date().toISOString(), instanceName]
      )
    } catch (dbError: any) {
      console.error("Erro ao salvar configurações:", dbError)
      return { success: false, error: "Erro ao salvar configurações" }
    }

    return { success: true }
  } catch (error) {
    console.error("Erro ao salvar configurações:", error) // Servidor
    return { success: false, error: "Erro interno" }
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
  // Idealmente, esta função também chamaria a API da Evolution para aplicar as configurações lá.
  // Por enquanto, está apenas salvando no nosso banco.
  return saveInstanceSettings(instanceName, settings)
}
