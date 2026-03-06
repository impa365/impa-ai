/**
 * Funções server-side para integração com Uazapi
 * Estas funções devem ser usadas APENAS em API routes (servidor)
 */

// ==================== INTERFACES ====================

export interface UazapiConfig {
  serverUrl: string
  apiKey: string
}

export interface UazapiCreateInstanceResponse {
  response: string
  instance: {
    id: string
    token: string
    status: string
    paircode?: string
    qrcode?: string
    name: string
    profileName?: string
    profilePicUrl?: string
    isBusiness?: boolean
    plataform?: string
    systemName?: string
    owner?: string
    lastDisconnect?: string
    lastDisconnectReason?: string
    created?: string
    updated?: string
  }
  connected: boolean
  loggedIn: boolean
  name: string
  token: string
  info?: string
}

// ==================== FUNÇÕES DE CONFIGURAÇÃO (SERVER-SIDE) ====================

/**
 * Busca as configurações da integração Uazapi diretamente do banco de dados
 * USO EXCLUSIVO NO SERVIDOR (API routes)
 */
export async function getUazapiConfigServer(): Promise<UazapiConfig | null> {
  try {
    const { queryOne } = await import("@/lib/db")

    const row = await queryOne<{ config: any }>(
      `SELECT config FROM integrations WHERE type = $1 AND is_active = true LIMIT 1`,
      ["uazapi"]
    )

    if (!row) {
      console.log('⚠️ Uazapi não está configurada no banco de dados')
      return null
    }

    const config = typeof row.config === "string" ? JSON.parse(row.config) : row.config

    if (!config?.serverUrl || !config?.apiKey) {
      console.error('❌ Configuração da Uazapi está incompleta no banco')
      return null
    }

    return {
      serverUrl: config.serverUrl,
      apiKey: config.apiKey,
    }
  } catch (error) {
    console.error('❌ Erro ao buscar configurações da Uazapi:', error)
    return null
  }
}

/**
 * Verifica se a Uazapi está configurada (server-side)
 */
export async function isUazapiConfiguredServer(): Promise<boolean> {
  const config = await getUazapiConfigServer()
  return config !== null && !!config.serverUrl && !!config.apiKey
}

// ==================== FUNÇÕES DE INSTÂNCIA (SERVER-SIDE) ====================

/**
 * Cria uma nova instância no servidor Uazapi
 * USO EXCLUSIVO NO SERVIDOR (API routes)
 */
export async function createUazapiInstanceServer(
  instanceName: string
): Promise<{ success: boolean; data?: UazapiCreateInstanceResponse; error?: string }> {
  try {
    const config = await getUazapiConfigServer()
    if (!config) {
      return { 
        success: false, 
        error: 'Uazapi não está configurada. Configure em Admin > Integrações.' 
      }
    }

    console.log('🔧 Criando instância na Uazapi:', instanceName)

    const response = await fetch(`${config.serverUrl}/instance/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'admintoken': config.apiKey,
      },
      body: JSON.stringify({
        name: instanceName,
        systemName: 'impa-ai',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro ao criar instância na Uazapi:', response.status, errorText)
      return { 
        success: false, 
        error: `Erro ${response.status} da Uazapi: ${errorText}` 
      }
    }

    const data = await response.json()
    console.log('✅ Instância criada com sucesso na Uazapi:', data.instance.id)
    
    return { success: true, data }
  } catch (error: any) {
    console.error('❌ Erro ao criar instância na Uazapi:', error)
    return { 
      success: false, 
      error: error.message || 'Erro ao criar instância na Uazapi' 
    }
  }
}

/**
 * Conecta uma instância ao WhatsApp (gera QR Code ou código de pareamento)
 * USO EXCLUSIVO NO SERVIDOR (API routes)
 */
export async function connectUazapiInstanceServer(
  instanceToken: string,
  phoneNumber?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const config = await getUazapiConfigServer()
    if (!config) {
      return { success: false, error: 'Uazapi não está configurada.' }
    }

    const body: any = {}
    if (phoneNumber) {
      body.phone = phoneNumber
    }

    const response = await fetch(`${config.serverUrl}/instance/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': instanceToken,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { 
        success: false, 
        error: `Erro ${response.status}: ${errorText}` 
      }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Erro ao conectar instância' 
    }
  }
}

/**
 * Desconecta uma instância do WhatsApp
 */
export async function disconnectUazapiInstanceServer(
  instanceToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getUazapiConfigServer()
    if (!config) {
      return { success: false, error: 'Uazapi não está configurada.' }
    }

    const response = await fetch(`${config.serverUrl}/instance/disconnect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': instanceToken,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { 
        success: false, 
        error: `Erro ${response.status}: ${errorText}` 
      }
    }

    return { success: true }
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Erro ao desconectar instância' 
    }
  }
}

/**
 * Verifica o status de uma instância
 */
export async function getUazapiInstanceStatusServer(
  instanceToken: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const config = await getUazapiConfigServer()
    if (!config) {
      return { success: false, error: 'Uazapi não está configurada.' }
    }

    const response = await fetch(`${config.serverUrl}/instance/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'token': instanceToken,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { 
        success: false, 
        error: `Erro ${response.status}: ${errorText}` 
      }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Erro ao verificar status' 
    }
  }
}

/**
 * Deleta uma instância
 */
export async function deleteUazapiInstanceServer(
  instanceToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getUazapiConfigServer()
    if (!config) {
      return { success: false, error: 'Uazapi não está configurada.' }
    }

    const response = await fetch(`${config.serverUrl}/instance`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'token': instanceToken,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { 
        success: false, 
        error: `Erro ${response.status}: ${errorText}` 
      }
    }

    return { success: true }
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Erro ao deletar instância' 
    }
  }
}

/**
 * Atualiza o nome de perfil do WhatsApp
 */
export async function updateUazapiProfileNameServer(
  instanceToken: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getUazapiConfigServer()
    if (!config) {
      return { success: false, error: 'Uazapi não está configurada.' }
    }

    const response = await fetch(`${config.serverUrl}/profile/name`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': instanceToken,
      },
      body: JSON.stringify({ name }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { 
        success: false, 
        error: `Erro ${response.status}: ${errorText}` 
      }
    }

    return { success: true }
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Erro ao atualizar nome do perfil' 
    }
  }
}

/**
 * Atualiza a imagem de perfil do WhatsApp
 */
export async function updateUazapiProfileImageServer(
  instanceToken: string,
  image: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getUazapiConfigServer()
    if (!config) {
      return { success: false, error: 'Uazapi não está configurada.' }
    }

    const response = await fetch(`${config.serverUrl}/profile/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': instanceToken,
      },
      body: JSON.stringify({ image }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { 
        success: false, 
        error: `Erro ${response.status}: ${errorText}` 
      }
    }

    return { success: true }
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Erro ao atualizar imagem do perfil' 
    }
  }
}

// ==================== FUNÇÕES DE PRIVACIDADE (SERVER-SIDE) ====================

/**
 * Busca configurações de privacidade da instância Uazapi
 * GET /instance/privacy
 */
export async function getUazapiPrivacySettingsServer(
  instanceToken: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const config = await getUazapiConfigServer()
    if (!config) {
      return { success: false, error: 'Uazapi não está configurada.' }
    }

    console.log('🔍 [UAZAPI-PRIVACY-GET] Buscando configurações de privacidade...')

    const response = await fetch(`${config.serverUrl}/instance/privacy`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'token': instanceToken,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [UAZAPI-PRIVACY-GET] Erro:', response.status, errorText)
      return { 
        success: false, 
        error: `Erro ${response.status}: ${errorText}` 
      }
    }

    const data = await response.json()
    console.log('✅ [UAZAPI-PRIVACY-GET] Configurações obtidas:', data)
    
    return { success: true, data }
  } catch (error: any) {
    console.error('❌ [UAZAPI-PRIVACY-GET] Falha:', error.message)
    return { 
      success: false, 
      error: error.message || 'Erro ao buscar configurações de privacidade' 
    }
  }
}

/**
 * Altera configurações de privacidade da instância Uazapi
 * POST /instance/privacy
 */
export async function setUazapiPrivacySettingsServer(
  instanceToken: string,
  settings: any
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const config = await getUazapiConfigServer()
    if (!config) {
      return { success: false, error: 'Uazapi não está configurada.' }
    }

    console.log('💾 [UAZAPI-PRIVACY-SET] Salvando configurações de privacidade:', settings)

    const response = await fetch(`${config.serverUrl}/instance/privacy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': instanceToken,
      },
      body: JSON.stringify(settings),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [UAZAPI-PRIVACY-SET] Erro:', response.status, errorText)
      return { 
        success: false, 
        error: `Erro ${response.status}: ${errorText}` 
      }
    }

    const data = await response.json()
    console.log('✅ [UAZAPI-PRIVACY-SET] Configurações salvas:', data)
    
    return { success: true, data }
  } catch (error: any) {
    console.error('❌ [UAZAPI-PRIVACY-SET] Falha:', error.message)
    return { 
      success: false, 
      error: error.message || 'Erro ao salvar configurações de privacidade' 
    }
  }
}

