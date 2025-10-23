/**
 * Helper functions para gerenciar webhooks da Uazapi
 * Usado para criar/deletar webhooks ao criar/deletar bots
 */

interface UazapiWebhookConfig {
  url: string
  events: string[]
  excludeMessages: string[]
  enabled: boolean
  action: 'add' | 'delete'
}

interface UazapiWebhookResponse {
  id: string
  instance_id: string
  enabled: boolean
  url: string
  events: string[]
  AddUrlTypesMessages: boolean
  addUrlEvents: boolean
  excludeMessages: string[]
  created: string
  updated: string
}

interface CreateWebhookParams {
  uazapiServerUrl: string
  instanceToken: string
  webhookUrl: string
  ignoreGroups: boolean
}

interface DeleteWebhookParams {
  uazapiServerUrl: string
  instanceToken: string
  webhookId: string
}

/**
 * Cria um webhook na Uazapi
 */
export async function createUazapiWebhook({
  uazapiServerUrl,
  instanceToken,
  webhookUrl,
  ignoreGroups,
}: CreateWebhookParams): Promise<{ success: boolean; webhookId?: string; error?: string }> {
  try {
    console.log('🔄 [UAZAPI-WEBHOOK] Criando webhook:', {
      url: webhookUrl,
      ignoreGroups,
    })
    console.log('🔗 [UAZAPI-WEBHOOK] Server URL:', uazapiServerUrl)
    console.log('🔑 [UAZAPI-WEBHOOK] Token:', instanceToken ? `${instanceToken.substring(0, 15)}...` : 'NENHUM')

    // Montar excludeMessages baseado em ignoreGroups
    const excludeMessages = ['wasSentByApi'] // Sempre evitar loops
    if (ignoreGroups) {
      excludeMessages.push('isGroupYes')
    }

    const payload: UazapiWebhookConfig = {
      action: 'add',
      url: webhookUrl,
      events: ['messages'],
      excludeMessages,
      enabled: true,
    }

    console.log('📦 [UAZAPI-WEBHOOK] Payload:', JSON.stringify(payload, null, 2))

    // Aumentar timeout para 30 segundos
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      const response = await fetch(`${uazapiServerUrl}/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': instanceToken,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [UAZAPI-WEBHOOK] Erro ao criar webhook:', response.status, errorText)
        return {
          success: false,
          error: `Erro ${response.status}: ${errorText}`,
        }
      }

      const data: UazapiWebhookResponse[] = await response.json()
      
      if (!data || data.length === 0) {
        console.error('❌ [UAZAPI-WEBHOOK] Resposta vazia da API')
        return {
          success: false,
          error: 'API retornou resposta vazia',
        }
      }

      const webhook = data[0]
      console.log('✅ [UAZAPI-WEBHOOK] Webhook criado com sucesso:', webhook.id)

      return {
        success: true,
        webhookId: webhook.id,
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      // Verificar se foi timeout
      if (fetchError.name === 'AbortError') {
        console.error('❌ [UAZAPI-WEBHOOK] Timeout de 30 segundos excedido')
        return {
          success: false,
          error: 'Timeout: Servidor Uazapi não respondeu em 30 segundos',
        }
      }
      
      throw fetchError
    }
  } catch (error: any) {
    console.error('❌ [UAZAPI-WEBHOOK] Erro ao criar webhook:', error)
    console.error('❌ [UAZAPI-WEBHOOK] Tipo do erro:', error.name)
    console.error('❌ [UAZAPI-WEBHOOK] Causa:', error.cause)
    return {
      success: false,
      error: error.message || 'Erro desconhecido ao criar webhook',
    }
  }
}

/**
 * Deleta um webhook na Uazapi
 */
export async function deleteUazapiWebhook({
  uazapiServerUrl,
  instanceToken,
  webhookId,
}: DeleteWebhookParams): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🗑️ [UAZAPI-WEBHOOK] Deletando webhook:', webhookId)

    const payload = {
      action: 'delete',
      id: webhookId,
    }

    const response = await fetch(`${uazapiServerUrl}/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': instanceToken,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [UAZAPI-WEBHOOK] Erro ao deletar webhook:', response.status, errorText)
      
      // Se o webhook não existir (404), considerar como sucesso
      if (response.status === 404) {
        console.warn('⚠️ [UAZAPI-WEBHOOK] Webhook não encontrado, considerando como deletado')
        return { success: true }
      }
      
      return {
        success: false,
        error: `Erro ${response.status}: ${errorText}`,
      }
    }

    console.log('✅ [UAZAPI-WEBHOOK] Webhook deletado com sucesso')
    return { success: true }
  } catch (error: any) {
    console.error('❌ [UAZAPI-WEBHOOK] Erro ao deletar webhook:', error)
    return {
      success: false,
      error: error.message || 'Erro desconhecido ao deletar webhook',
    }
  }
}

/**
 * Verifica se ignoreJids contém @g.us (ignorar grupos)
 */
export function shouldIgnoreGroups(ignoreJids: string): boolean {
  return ignoreJids.includes('@g.us')
}

