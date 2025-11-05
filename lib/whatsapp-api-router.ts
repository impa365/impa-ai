/**
 * Camada de abstração que roteia chamadas entre Evolution API e Uazapi
 * Baseado no campo api_type da conexão
 */

import {
  createUazapiInstance,
  connectUazapiInstance,
  disconnectUazapiInstance,
  getUazapiInstanceStatus,
  updateUazapiInstanceName,
  deleteUazapiInstance,
  getUazapiPrivacySettings,
  updateUazapiPrivacySettings,
  updateUazapiProfileName,
  updateUazapiProfileImage,
} from './uazapi-client'

// ==================== TIPOS ====================

export type ApiType = 'evolution' | 'uazapi'

export interface ConnectionInfo {
  id: string
  api_type: ApiType
  instance_name: string
  instance_token: string
  user_id: string
}

// ==================== FUNÇÕES DE ROTEAMENTO ====================

/**
 * Cria uma instância na API especificada
 */
export async function createInstance(
  apiType: ApiType,
  connectionName: string,
  userId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (apiType === 'uazapi') {
    const result = await createUazapiInstance(connectionName)
    return result
  } else {
    // Evolution API - usar a função existente
    const response = await fetch('/api/whatsapp/create-instance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionName, userId }),
    })

    const data = await response.json()
    return {
      success: data.success || false,
      data: data.data,
      error: data.error,
    }
  }
}

/**
 * Conecta uma instância (gera QR Code)
 */
export async function connectInstance(
  connection: ConnectionInfo,
  phoneNumber?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (connection.api_type === 'uazapi') {
    return await connectUazapiInstance(connection.instance_token, phoneNumber)
  } else {
    // Evolution API - usar endpoint existente
    const response = await fetch(`/api/whatsapp/qr/${connection.instance_name}`, {
      method: 'POST',
    })

    const data = await response.json()
    return {
      success: !data.error,
      data,
      error: data.error,
    }
  }
}

/**
 * Desconecta uma instância
 */
export async function disconnectInstance(
  connection: ConnectionInfo
): Promise<{ success: boolean; error?: string }> {
  if (connection.api_type === 'uazapi') {
    return await disconnectUazapiInstance(connection.instance_token)
  } else {
    // Evolution API - usar endpoint existente
    const response = await fetch(`/api/whatsapp/disconnect/${connection.instance_name}`, {
      method: 'POST',
    })

    const data = await response.json()
    return {
      success: data.success || false,
      error: data.error,
    }
  }
}

/**
 * Verifica status da instância
 */
export async function getInstanceStatus(
  connection: ConnectionInfo
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (connection.api_type === 'uazapi') {
    return await getUazapiInstanceStatus(connection.instance_token)
  } else {
    // Evolution API - usar endpoint existente
    const response = await fetch(`/api/whatsapp/status/${connection.instance_name}`)
    const data = await response.json()
    return {
      success: !data.error,
      data,
      error: data.error,
    }
  }
}

/**
 * Deleta uma instância
 */
export async function deleteInstance(
  connection: ConnectionInfo
): Promise<{ success: boolean; error?: string }> {
  if (connection.api_type === 'uazapi') {
    // Primeiro deletar na API
    const apiResult = await deleteUazapiInstance(connection.instance_token)
    if (!apiResult.success) {
      return apiResult
    }

    // Depois deletar do banco
    const response = await fetch(`/api/whatsapp-connections/${connection.id}`, {
      method: 'DELETE',
    })

    const data = await response.json()
    return {
      success: data.success || false,
      error: data.error,
    }
  } else {
    // Evolution API - usar endpoint existente
    const response = await fetch(`/api/whatsapp/delete-instance/${connection.instance_name}`, {
      method: 'DELETE',
    })

    const data = await response.json()
    return {
      success: data.success || false,
      error: data.error,
    }
  }
}

/**
 * Atualiza nome da instância
 */
export async function updateInstanceName(
  connection: ConnectionInfo,
  newName: string
): Promise<{ success: boolean; error?: string }> {
  if (connection.api_type === 'uazapi') {
    return await updateUazapiInstanceName(connection.instance_token, newName)
  } else {
    // Evolution API - implementar endpoint se necessário
    return { success: false, error: 'Função não implementada para Evolution API' }
  }
}

/**
 * Busca configurações de privacidade
 */
export async function getPrivacySettings(
  connection: ConnectionInfo
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (connection.api_type === 'uazapi') {
    return await getUazapiPrivacySettings(connection.instance_token)
  } else {
    // Evolution API - implementar endpoint se necessário
    return { success: false, error: 'Função não implementada para Evolution API' }
  }
}

/**
 * Atualiza configurações de privacidade
 */
export async function updatePrivacySettings(
  connection: ConnectionInfo,
  settings: any
): Promise<{ success: boolean; error?: string }> {
  if (connection.api_type === 'uazapi') {
    return await updateUazapiPrivacySettings(connection.instance_token, settings)
  } else {
    // Evolution API - implementar endpoint se necessário
    return { success: false, error: 'Função não implementada para Evolution API' }
  }
}

/**
 * Atualiza nome do perfil WhatsApp
 */
export async function updateProfileName(
  connection: ConnectionInfo,
  name: string
): Promise<{ success: boolean; error?: string }> {
  if (connection.api_type === 'uazapi') {
    return await updateUazapiProfileName(connection.instance_token, name)
  } else {
    // Evolution API - implementar endpoint se necessário
    return { success: false, error: 'Função não implementada para Evolution API' }
  }
}

/**
 * Atualiza imagem do perfil WhatsApp
 */
export async function updateProfileImage(
  connection: ConnectionInfo,
  image: string
): Promise<{ success: boolean; error?: string }> {
  if (connection.api_type === 'uazapi') {
    return await updateUazapiProfileImage(connection.instance_token, image)
  } else {
    // Evolution API - implementar endpoint se necessário
    return { success: false, error: 'Função não implementada para Evolution API' }
  }
}

/**
 * Busca informações de uma conexão do banco de dados
 */
export async function getConnectionInfo(connectionId: string): Promise<ConnectionInfo | null> {
  try {
    const response = await fetch(`/api/whatsapp-connections/${connectionId}`)
    if (!response.ok) {
      return null
    }

    const data = await response.json()
    if (!data.success || !data.connection) {
      return null
    }

    return data.connection
  } catch (error) {
    console.error('Erro ao buscar informações da conexão:', error)
    return null
  }
}

/**
 * Busca informações de uma conexão pelo instance_name
 */
export async function getConnectionByInstanceName(instanceName: string): Promise<ConnectionInfo | null> {
  try {
    const response = await fetch(`/api/whatsapp-connections?instance_name=${encodeURIComponent(instanceName)}`)
    if (!response.ok) {
      return null
    }

    const data = await response.json()
    if (!data.success || !data.connections || data.connections.length === 0) {
      return null
    }

    return data.connections[0]
  } catch (error) {
    console.error('Erro ao buscar conexão por instance_name:', error)
    return null
  }
}

