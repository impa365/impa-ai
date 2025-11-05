/**
 * Cliente para integração com a API Uazapi
 * Documentação: https://uazapi.com/docs
 */

// ==================== INTERFACES ====================

export interface UazapiConfig {
  serverUrl: string
  apiKey: string // admintoken
}

export interface UazapiInstance {
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

export interface UazapiCreateInstanceResponse {
  response: string
  instance: UazapiInstance
  connected: boolean
  loggedIn: boolean
  name: string
  token: string
  info?: string
}

export interface UazapiConnectResponse {
  connected: boolean
  loggedIn: boolean
  jid?: any
  instance: UazapiInstance
}

export interface UazapiStatusResponse {
  instance: UazapiInstance
  status: {
    connected: boolean
    loggedIn: boolean
    jid?: any
  }
}

export interface UazapiPrivacySettings {
  groupadd?: 'all' | 'contacts' | 'contact_blacklist' | 'none'
  last?: 'all' | 'contacts' | 'contact_blacklist' | 'none'
  status?: 'all' | 'contacts' | 'contact_blacklist' | 'none'
  profile?: 'all' | 'contacts' | 'contact_blacklist' | 'none'
  readreceipts?: 'all' | 'none'
  online?: 'all' | 'match_last_seen'
  calladd?: 'all' | 'known'
}

// ==================== FUNÇÕES DE CONFIGURAÇÃO ====================

/**
 * Busca as configurações da integração Uazapi do banco de dados
 */
export async function getUazapiConfig(): Promise<UazapiConfig | null> {
  try {
    const response = await fetch('/api/integrations')
    if (!response.ok) {
      return null
    }

    const data = await response.json()
    if (!data.success || !data.integrations) {
      return null
    }

    const uazapiIntegration = data.integrations.find((int: any) => int.type === 'uazapi')
    if (!uazapiIntegration || !uazapiIntegration.config) {
      return null
    }

    return {
      serverUrl: uazapiIntegration.config.serverUrl,
      apiKey: uazapiIntegration.config.apiKey,
    }
  } catch (error) {
    console.error('Erro ao buscar configurações da Uazapi:', error)
    return null
  }
}

/**
 * Verifica se a Uazapi está configurada
 */
export async function isUazapiConfigured(): Promise<boolean> {
  const config = await getUazapiConfig()
  return config !== null && !!config.serverUrl && !!config.apiKey
}

// ==================== FUNÇÕES DE INSTÂNCIA ====================

/**
 * Cria uma nova instância no servidor Uazapi
 */
export async function createUazapiInstance(
  instanceName: string
): Promise<{ success: boolean; data?: UazapiCreateInstanceResponse; error?: string }> {
  try {
    const config = await getUazapiConfig()
    if (!config) {
      return { success: false, error: 'Uazapi não está configurada. Configure em Admin > Integrações.' }
    }

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
      return { 
        success: false, 
        error: `Erro ${response.status} da Uazapi: ${errorText}` 
      }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Erro ao criar instância na Uazapi' 
    }
  }
}

/**
 * Conecta uma instância ao WhatsApp (gera QR Code ou código de pareamento)
 */
export async function connectUazapiInstance(
  instanceToken: string,
  phoneNumber?: string
): Promise<{ success: boolean; data?: UazapiConnectResponse; error?: string }> {
  try {
    const config = await getUazapiConfig()
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
export async function disconnectUazapiInstance(
  instanceToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getUazapiConfig()
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
export async function getUazapiInstanceStatus(
  instanceToken: string
): Promise<{ success: boolean; data?: UazapiStatusResponse; error?: string }> {
  try {
    const config = await getUazapiConfig()
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
 * Atualiza o nome de uma instância
 */
export async function updateUazapiInstanceName(
  instanceToken: string,
  newName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getUazapiConfig()
    if (!config) {
      return { success: false, error: 'Uazapi não está configurada.' }
    }

    const response = await fetch(`${config.serverUrl}/instance/updateInstanceName`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': instanceToken,
      },
      body: JSON.stringify({ name: newName }),
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
      error: error.message || 'Erro ao atualizar nome da instância' 
    }
  }
}

/**
 * Deleta uma instância
 */
export async function deleteUazapiInstance(
  instanceToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getUazapiConfig()
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

// ==================== FUNÇÕES DE PRIVACIDADE ====================

/**
 * Busca configurações de privacidade da instância
 */
export async function getUazapiPrivacySettings(
  instanceToken: string
): Promise<{ success: boolean; data?: UazapiPrivacySettings; error?: string }> {
  try {
    const config = await getUazapiConfig()
    if (!config) {
      return { success: false, error: 'Uazapi não está configurada.' }
    }

    const response = await fetch(`${config.serverUrl}/instance/privacy`, {
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
      error: error.message || 'Erro ao buscar configurações de privacidade' 
    }
  }
}

/**
 * Atualiza configurações de privacidade da instância
 */
export async function updateUazapiPrivacySettings(
  instanceToken: string,
  settings: Partial<UazapiPrivacySettings>
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getUazapiConfig()
    if (!config) {
      return { success: false, error: 'Uazapi não está configurada.' }
    }

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
      return { 
        success: false, 
        error: `Erro ${response.status}: ${errorText}` 
      }
    }

    return { success: true }
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Erro ao atualizar configurações de privacidade' 
    }
  }
}

// ==================== FUNÇÕES DE PERFIL ====================

/**
 * Atualiza o nome do perfil do WhatsApp
 */
export async function updateUazapiProfileName(
  instanceToken: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getUazapiConfig()
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
 * Atualiza a imagem do perfil do WhatsApp
 */
export async function updateUazapiProfileImage(
  instanceToken: string,
  image: string // URL, base64 ou "remove"/"delete"
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getUazapiConfig()
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

/**
 * Lista todas as instâncias (admin only)
 */
export async function listAllUazapiInstances(): Promise<{ success: boolean; data?: UazapiInstance[]; error?: string }> {
  try {
    const config = await getUazapiConfig()
    if (!config) {
      return { success: false, error: 'Uazapi não está configurada.' }
    }

    const response = await fetch(`${config.serverUrl}/instance/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'admintoken': config.apiKey,
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
      error: error.message || 'Erro ao listar instâncias' 
    }
  }
}

