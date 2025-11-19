import type { Server, CreateServerRequest } from '../../shared/types/Server'

// Composable para gerenciar servidores no localStorage
export const useServers = () => {
  const STORAGE_KEY = 'servers'
  
  // Estado reativo dos servidores
  const servers = ref<Server[]>([])

  // Ler servidores do localStorage
  const loadServers = () => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          servers.value = JSON.parse(stored)
        }
      } catch (error) {
        console.error('Erro ao carregar servidores:', error)
      }
    }
  }

  // Salvar no localStorage
  const saveToStorage = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(servers.value))
      } catch (error) {
        console.error('Erro ao salvar servidores:', error)
      }
    }
  }

  // Inserir novo servidor
  const addServer = (serverData: CreateServerRequest): Server => {
    const newServer: Server = {
      id: Date.now().toString(),
      nome: serverData.nome,
      serverUrl: serverData.serverUrl,
      adminToken: serverData.adminToken,
      status: 'offline'
    }
    
    servers.value.push(newServer)
    saveToStorage()
    return newServer
  }

  // Excluir servidor
  const deleteServer = (serverId: string): boolean => {
    const index = servers.value.findIndex(server => server.id === serverId)
    if (index !== -1) {
      servers.value.splice(index, 1)
      saveToStorage()
      return true
    }
    return false
  }

  // Inicializar no cliente
  onMounted(() => {
    loadServers()
  })

  return {
    servers,
    loadServers,
    addServer,
    deleteServer
  }
}
