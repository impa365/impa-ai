import { defineStore } from 'pinia'
import type { Instance } from '../../shared/types/Instance'

interface InstancesState {
  instances: Instance[]
  loading: boolean
  error: string | null
}

export const useInstancesStore = defineStore('instances', {
  state: (): InstancesState => ({
    instances: [],
    loading: false,
    error: null
  }),

  getters: {
    // Getter para buscar instância por ID
    getInstanceById: (state) => {
      return (id: string): Instance | undefined => {
        return state.instances.find(instance => instance.id === id)
      }
    },

    // Getter para verificar se há dados carregados  
    hasInstances: (state) => {
      return state.instances.length > 0
    },

    // Getter para verificar se pode buscar (não está carregando e não tem dados)
    shouldFetch: (state) => {
      return !state.loading && state.instances.length === 0
    },

    // Getter para contar instâncias por status
    statusCounts: (state) => {
      const connected = state.instances.filter(i => i.status.toLowerCase() === 'connected').length
      const total = state.instances.length
      const disconnected = total - connected
      
      return { connected, disconnected, total }
    },

    // Getter para filtrar instâncias por texto
    filteredInstances: (state) => {
      return (searchQuery: string): Instance[] => {
        if (!searchQuery.trim()) {
          return [...state.instances]
        }
        
        const query = searchQuery.toLowerCase().trim()
        
        return state.instances.filter(instance => 
          instance.name.toLowerCase().includes(query) ||
          (instance.profileName || '').toLowerCase().includes(query) ||
          instance.token.toLowerCase().includes(query)
        )
      }
    }
  },

  actions: {
    // Ação para definir instâncias
    setInstances(instances: Instance[]) {
      this.instances = instances
    },

    // Ação para adicionar uma nova instância
    addInstance(instance: Instance) {
      this.instances.push(instance)
    },

    // Ação para atualizar uma instância existente
    updateInstance(updatedInstance: Instance) {
      const index = this.instances.findIndex(instance => instance.id === updatedInstance.id)
      if (index !== -1) {
        this.instances[index] = updatedInstance
      }
    },

    // Ação para remover uma instância
    removeInstance(instanceId: string) {
      const index = this.instances.findIndex(instance => instance.id === instanceId)
      if (index !== -1) {
        this.instances.splice(index, 1)
      }
    },

    // Ação para definir estado de loading
    setLoading(loading: boolean) {
      this.loading = loading
    },

    // Ação para definir erro
    setError(error: string | null) {
      this.error = error
    },

    // Ação para limpar instâncias
    clearInstances() {
      this.instances = []
      this.error = null
    },

    // Ação para verificar se deve limpar instâncias (quando mudar de servidor)
    clearInstancesIfDifferentServer(currentServerUrl: string) {
      // Por simplicidade, vamos apenas manter as instâncias em cache
      // até implementarmos um controle mais sofisticado por servidor
      console.log('Mantendo instâncias em cache para server:', currentServerUrl)
    },

    // Ação para buscar instâncias de forma inteligente (só se necessário)
    async fetchInstancesIfNeeded(serverUrl: string, adminToken: string) {
      // Se já tem dados válidos, não busca
      if (this.instances.length > 0) {
        console.log('Instâncias já carregadas no store, pulando busca automatica')
        return
      }

      // Se está carregando, não inicia nova busca
      if (this.loading) {
        console.log('Já está buscando instâncias, pulando nova busca')
        return
      }

      console.log('Nenhuma instância no store, iniciando busca...')
      return this.fetchInstances(serverUrl, adminToken)
    },

    // Ação para buscar instâncias (integração com API real)
    async fetchInstances(serverUrl: string, adminToken: string) {
      this.setLoading(true)
      this.setError(null)

      try {
        console.log('Buscando instâncias para:', { serverUrl, adminToken })
        
        // Chamada real para a API usando $fetch
        const response = await $fetch<Instance[]>(`${serverUrl}/instance/all`, {
          headers: {
            'admintoken': adminToken
          }
        })

        console.log('Instâncias carregadas da API:', response)
        this.setInstances(response)
        
      } catch (error: any) {
        console.error('Erro ao buscar instâncias:', error)
        
        // Tratar diferentes tipos de erro como no composable original
        if (error.status === 401) {
          this.setError('Token de administrador inválido')
        } else if (error.status === 404) {
          this.setError('Servidor não encontrado')
        } else if (error.data?.error) {
          this.setError(error.data.error)
        } else {
          this.setError('Erro ao conectar com o servidor')
        }
        
        // Limpar instâncias em caso de erro
        this.instances = []
      } finally {
        this.setLoading(false)
      }
    },

    // Ação para criar nova instância e atualizar a lista
    async createInstance(serverUrl: string, adminToken: string, instanceData: any) {
      this.setLoading(true)
      this.setError(null)

      try {
        console.log('Criando nova instância:', instanceData)
        
        const response = await $fetch(`${serverUrl}/instance/init`, {
          method: 'POST',
          headers: {
            'admintoken': adminToken,
            'Content-Type': 'application/json'
          },
          body: instanceData
        })

        console.log('Instância criada:', response)
        
        // Após criar com sucesso, recarregar a lista de instâncias
        await this.fetchInstances(serverUrl, adminToken)
        
        return { success: true, data: response }
      } catch (error: any) {
        console.error('Erro ao criar instância:', error)
        
        // Tratar diferentes tipos de erro
        if (error.status === 401) {
          this.setError('Token de administrador inválido ou expirado')
        } else if (error.status === 404) {
          this.setError('Endpoint não encontrado')
        } else if (error.status === 500) {
          this.setError('Erro interno do servidor')
        } else if (error.data?.error) {
          this.setError(error.data.error)
        } else {
          this.setError('Erro ao criar instância')
        }
        
        return { success: false, error: this.error }
      } finally {
        this.setLoading(false)
      }
    },

    // Ação para atualizar campos administrativos de uma instância
    async updateAdminFields(
      serverUrl: string, 
      adminToken: string,
      instanceId: string, 
      adminField01: string, 
      adminField02: string
    ) {
      this.setLoading(true)
      this.setError(null)

      try {
        console.log('Atualizando campos administrativos:', { instanceId, adminField01, adminField02 })
        
        const response = await $fetch(`${serverUrl}/instance/updateAdminFields`, {
          method: 'POST',
          headers: {
            'admintoken': adminToken,
            'Content-Type': 'application/json'
          },
          body: {
            id: instanceId,
            adminField01,
            adminField02
          }
        })

        console.log('Campos administrativos atualizados:', response)
        
        return { success: true, data: response }
      } catch (error: any) {
        console.error('Erro ao atualizar campos administrativos:', error)
        
        // Tratar diferentes tipos de erro
        if (error.status === 400) {
          this.setError('Dados inválidos fornecidos')
        } else if (error.status === 401) {
          this.setError('Token de administrador inválido')
        } else if (error.status === 404) {
          this.setError('Instância não encontrada')
        } else if (error.status === 500) {
          this.setError('Erro interno do servidor')
        } else if (error.data?.error) {
          this.setError(error.data.error)
        } else {
          this.setError('Erro ao atualizar campos administrativos')
        }
        
        return { success: false, error: this.error }
      } finally {
        this.setLoading(false)
      }
    },

    // Ação para desconectar instância
    async disconnectInstance(serverUrl: string, instanceToken: string) {
      this.setLoading(true)
      this.setError(null)

      try {
        console.log('Desconectando instância:', instanceToken)
        
        const response = await $fetch(`${serverUrl}/instance/disconnect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'token': instanceToken
          }
        })

        console.log('Instância desconectada:', response)
        
        return { success: true, data: response }
      } catch (error: any) {
        console.error('Erro ao desconectar instância:', error)
        
        // Tratar diferentes tipos de erro
        if (error.status === 401) {
          this.setError('Token da instância inválido')
        } else if (error.status === 404) {
          this.setError('Instância não encontrada')
        } else if (error.data?.error) {
          this.setError(error.data.error)
        } else {
          this.setError('Erro ao desconectar instância')
        }
        
        return { success: false, error: this.error }
      } finally {
        this.setLoading(false)
      }
    },

    // Ação para gerar QR code para conectar instância
    async generateQRCode(serverUrl: string, instanceToken: string) {
      this.setLoading(true)
      this.setError(null)

      try {
        console.log('Gerando QR code para instância:', instanceToken)
        
        // Verificar o status da conexão primeiro
        const statusResponse = await $fetch<any>(`${serverUrl}/instance/status`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'token': instanceToken
          }
        })

        // Se já está conectando e tem QR code, retornar o existente
        if (statusResponse.instance && 
            statusResponse.instance.status === "connecting" && 
            statusResponse.instance.qrcode) {
          return { success: true, qrcode: statusResponse.instance.qrcode }
        }

        // Caso contrário, gerar novo QR code
        const connectResponse = await $fetch<any>(`${serverUrl}/instance/connect`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'token': instanceToken
          }
        })

        if (connectResponse.instance && connectResponse.instance.qrcode) {
          return { success: true, qrcode: connectResponse.instance.qrcode }
        } else {
          return { success: false, error: 'QR code não foi gerado' }
        }
      } catch (error: any) {
        console.error('Erro ao gerar QR code:', error)
        
        // Tratar diferentes tipos de erro
        if (error.status === 401) {
          this.setError('Token da instância inválido')
        } else if (error.status === 404) {
          this.setError('Instância não encontrada')
        } else if (error.data?.error) {
          this.setError(error.data.error)
        } else {
          this.setError('Erro ao gerar QR code')
        }
        
        return { success: false, error: this.error }
      } finally {
        this.setLoading(false)
      }
    },

    // Ação para deletar instância
    async deleteInstance(serverUrl: string, instanceToken: string, instanceId: string) {
      this.setLoading(true)
      this.setError(null)

      try {
        console.log('Deletando instância:', instanceId)
        
        const response = await $fetch(`${serverUrl}/instance`, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            'token': instanceToken
          }
        })

        console.log('Instância deletada:', response)
        
        // Remover a instância do store após sucesso
        this.removeInstance(instanceId)
        
        return { success: true, data: response }
      } catch (error: any) {
        console.error('Erro ao deletar instância:', error)
        
        // Tratar diferentes tipos de erro
        if (error.status === 401) {
          this.setError('Token da instância inválido')
        } else if (error.status === 404) {
          this.setError('Instância não encontrada')
        } else if (error.data?.error) {
          this.setError(error.data.error)
        } else {
          this.setError('Erro ao deletar instância')
        }
        
        return { success: false, error: this.error }
      } finally {
        this.setLoading(false)
      }
    },

    // Ação para buscar webhooks de uma instância
    async getWebhooks(serverUrl: string, instanceToken: string) {
      this.setLoading(true)
      this.setError(null)

      try {
        console.log('Buscando webhooks para instância:', instanceToken)
        
        const response = await $fetch<any[]>(`${serverUrl}/webhook`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'token': instanceToken
          }
        })

        console.log('Webhooks encontrados:', response)
        return { success: true, data: response }
      } catch (error: any) {
        console.error('Erro ao buscar webhooks:', error)
        
        if (error.status === 401) {
          this.setError('Token da instância inválido')
        } else if (error.status === 404) {
          this.setError('Instância não encontrada')
        } else if (error.data?.error) {
          this.setError(error.data.error)
        } else {
          this.setError('Erro ao buscar webhooks')
        }
        
        return { success: false, error: this.error }
      } finally {
        this.setLoading(false)
      }
    },

    // Ação para criar webhook (modo simples - remove existente e cria novo)
    async createWebhook(serverUrl: string, instanceToken: string, webhookData: any) {
      this.setLoading(true)
      this.setError(null)

      try {
        console.log('Criando webhook:', webhookData)
        
        const response = await $fetch(`${serverUrl}/webhook`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'token': instanceToken
          },
          body: webhookData
        })

        console.log('Webhook criado:', response)
        return { success: true, data: response }
      } catch (error: any) {
        console.error('Erro ao criar webhook:', error)
        
        if (error.status === 400) {
          this.setError('Dados do webhook inválidos')
        } else if (error.status === 401) {
          this.setError('Token da instância inválido')
        } else if (error.status === 404) {
          this.setError('Instância não encontrada')
        } else if (error.data?.error) {
          this.setError(error.data.error)
        } else {
          this.setError('Erro ao criar webhook')
        }
        
        return { success: false, error: this.error }
      } finally {
        this.setLoading(false)
      }
    },

    // Ação para deletar webhook
    async deleteWebhook(serverUrl: string, instanceToken: string, webhookId: string) {
      this.setLoading(true)
      this.setError(null)

      try {
        console.log('Deletando webhook:', webhookId)
        
        const response = await $fetch(`${serverUrl}/webhook`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'token': instanceToken
          },
          body: {
            id: webhookId,
            action: 'delete'
          }
        })

        console.log('Webhook deletado:', response)
        return { success: true, data: response }
      } catch (error: any) {
        console.error('Erro ao deletar webhook:', error)
        
        if (error.status === 401) {
          this.setError('Token da instância inválido')
        } else if (error.status === 404) {
          this.setError('Webhook não encontrado')
        } else if (error.data?.error) {
          this.setError(error.data.error)
        } else {
          this.setError('Erro ao deletar webhook')
        }
        
        return { success: false, error: this.error }
      } finally {
        this.setLoading(false)
      }
    }
  }
})
