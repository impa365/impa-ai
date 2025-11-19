import type { WebhookConfig, CreateWebhookRequest, WebhookResponse } from '../../shared/types/Webhook'

// Composable para gerenciar webhooks de uma instância
export const useWebhooks = () => {
  // Estado reativo dos webhooks
  const webhooks = ref<WebhookResponse[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Criar webhook
  const createWebhook = async (
    serverUrl: string,
    instanceToken: string,
    webhookData: CreateWebhookRequest
  ) => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<WebhookResponse>(`${serverUrl}/webhook`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'token': instanceToken
        },
        body: {
          action: 'add',
          url: webhookData.url,
          events: webhookData.events,
          ...(webhookData.excludeMessages && webhookData.excludeMessages.length > 0 && { 
            excludeMessages: webhookData.excludeMessages 
          }),
          ...(webhookData.addUrlEvents && { addUrlEvents: webhookData.addUrlEvents }),
          ...(webhookData.addUrlTypesMessages && { addUrlTypesMessages: webhookData.addUrlTypesMessages }),
          ...(webhookData.enabled !== undefined && { enabled: webhookData.enabled })
        }
      })

      return { success: true, data: response }

    } catch (err: any) {
      console.error('Erro ao criar webhook:', err)
      
      // Tratar diferentes tipos de erro
      if (err.status === 400) {
        error.value = 'Dados inválidos fornecidos'
      } else if (err.status === 401) {
        error.value = 'Token da instância inválido'
      } else if (err.status === 404) {
        error.value = 'Instância não encontrada'
      } else if (err.status === 405) {
        error.value = 'Método não permitido - verifique a URL da API'
      } else if (err.status === 500) {
        error.value = 'Erro interno do servidor'
      } else if (err.data?.error) {
        error.value = err.data.error
      } else {
        error.value = 'Erro ao criar webhook'
      }
      
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // Buscar webhooks da instância
  const fetchWebhooks = async (
    serverUrl: string,
    instanceToken: string
  ) => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<WebhookResponse[] | string>(`${serverUrl}/webhook`, {
        method: 'GET',
        headers: {
          'token': instanceToken
        }
      })

      // Se a resposta é null, "null" (string), ou não é um array, considera como sem webhooks
      if (response === null || response === 'null' || !Array.isArray(response)) {
        webhooks.value = []
        return { success: true, data: [] }
      }

      webhooks.value = response
      return { success: true, data: response }

    } catch (err: any) {
      console.error('Erro ao buscar webhooks:', err)
      
      // Se é 404, pode ser que não tenha webhooks configurados
      if (err.status === 404) {
        webhooks.value = []
        return { success: true, data: [] }
      }
      
      // Tratar diferentes tipos de erro
      if (err.status === 401) {
        error.value = 'Token da instância inválido'
      } else if (err.status === 405) {
        error.value = 'Método não permitido - verifique a URL da API'
      } else if (err.data?.error) {
        error.value = err.data.error
      } else {
        error.value = 'Erro ao buscar webhooks'
      }
      
      webhooks.value = []
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

    // Deletar webhook
  const deleteWebhook = async (
    serverUrl: string,
    instanceToken: string,
    webhookId: string
  ) => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch(`${serverUrl}/webhook`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'token': instanceToken
        },
        body: {
          action: 'delete',
          id: webhookId
        }
      })

      return { success: true, data: response }

    } catch (err: any) {
      console.error('Erro ao deletar webhook:', err)
      
      // Tratar diferentes tipos de erro
      if (err.status === 401) {
        error.value = 'Token da instância inválido'
      } else if (err.status === 404) {
        error.value = 'Webhook não encontrado'
      } else if (err.data?.error) {
        error.value = err.data.error
      } else {
        error.value = 'Erro ao deletar webhook'
      }
      
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // Limpar dados dos webhooks
  const clearWebhooks = () => {
    webhooks.value = []
    error.value = null
  }

  return {
    webhooks: readonly(webhooks),
    loading: readonly(loading),
    error: readonly(error),
    createWebhook,
    fetchWebhooks,
    deleteWebhook,
    clearWebhooks
  }
}
