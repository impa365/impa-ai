import { defineStore } from 'pinia'
import type { Instance } from '../../shared/types/Instance'

interface InstanciaAtualState {
  instancia: Instance | null
  serverUrl: string | null
  adminToken: string | null
}

export const useInstanciaAtualStore = defineStore('instanciaAtual', {
  state: (): InstanciaAtualState => ({
    instancia: null,
    serverUrl: null,
    adminToken: null
  }),

  getters: {
    // Getter para verificar se há uma instância selecionada
    hasInstancia: (state) => {
      return state.instancia !== null
    },

    // Getter para o ID da instância atual
    instanciaId: (state) => {
      return state.instancia?.id || null
    },

    // Getter para o nome da instância atual
    instanciaNome: (state) => {
      return state.instancia?.name || 'Sem instância'
    },

    // Getter para o status da instância atual
    instanciaStatus: (state) => {
      return state.instancia?.status || 'unknown'
    }
  },

  actions: {
    // Ação para definir a instância atual
    setInstancia(instancia: Instance) {
      this.instancia = instancia
      console.log('Instância atual definida:', instancia.name)
    },

    // Ação para definir a instância atual com informações do servidor
    setInstanciaWithServer(instancia: Instance, serverUrl: string, adminToken: string) {
      this.instancia = instancia
      this.serverUrl = serverUrl
      this.adminToken = adminToken
      console.log('Instância atual definida com servidor:', instancia.name, serverUrl)
    },

    // Ação para limpar a instância atual
    clearInstancia() {
      this.instancia = null
      this.serverUrl = null
      this.adminToken = null
      console.log('Instância atual limpa')
    },

    // Ação para atualizar campos específicos da instância atual
    updateInstancia(updates: Partial<Instance>) {
      if (this.instancia) {
        this.instancia = { ...this.instancia, ...updates }
        console.log('Instância atual atualizada:', updates)
      }
    },

    // Ação para verificar se a instância atual corresponde a um ID
    isCurrentInstancia(instanceId: string): boolean {
      return this.instancia?.id === instanceId
    }
  },

  // TODO: Adicionar persistência se necessário
})
