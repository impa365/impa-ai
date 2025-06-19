// Adicionando tipo para a resposta da API para maior clareza
interface ApiResponse<T = any> {
  data?: T
  error?: string
}

class PublicApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  }

  async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      })

      // Tenta parsear JSON mesmo se !response.ok para obter a mensagem de erro do corpo
      const responseData = await response.json().catch((e) => {
        return { error: `Erro no servidor (status: ${response.status}), resposta não é JSON válido.` } // Retorna um objeto de erro se o JSON falhar
      })

      if (!response.ok) {
        console.error(`❌ [API-CLIENT] Erro na requisição para ${endpoint}:`, response.status, responseData)
        // Usa o erro do responseData se existir, senão um genérico
        return { error: responseData?.error || `Erro na requisição (status ${response.status})` }
      }

      return { data: responseData }
    } catch (error: any) {
      console.error(`💥 [API-CLIENT] Erro de rede ou inesperado para ${endpoint}:`, error.message)
      return { error: "Erro de conexão ou processamento da resposta" }
    }
  }

  async getConfig(): Promise<ApiResponse<{ theme: any; settings: any }>> {
    const result = await this.makeRequest<{ theme: any; settings: any }>("/api/config")
    return result
  }

  async login(email: string, password: string): Promise<ApiResponse<{ user: any }>> {
    return this.makeRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }

  // Buscar dados do dashboard admin
  async getAdminDashboard(): Promise<ApiResponse<any>> {
    return this.makeRequest("/api/admin/dashboard")
  }

  // Buscar usuários (admin)
  async getUsers(): Promise<ApiResponse<any[]>> {
    return this.makeRequest("/api/admin/users")
  }

  // Buscar usuário específico (admin)
  async getUser(userId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/admin/users/${userId}`)
  }

  // Criar usuário (admin)
  async createUser(userData: any): Promise<ApiResponse<any>> {
    return this.makeRequest("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  // Atualizar usuário (admin)
  async updateUser(userId: string, userData: any): Promise<ApiResponse<any>> {
    return this.makeRequest("/api/admin/users", {
      method: "PUT",
      body: JSON.stringify({ id: userId, ...userData }),
    })
  }

  // Deletar usuário (admin)
  async deleteUser(userId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.makeRequest(`/api/admin/users?id=${userId}`, {
      method: "DELETE",
    })
  }

  // Registro via API
  async register(userData: { email: string; password: string; full_name: string }): Promise<
    ApiResponse<{ user: any }>
  > {
    return this.makeRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  // Buscar perfil do usuário atual (quando autenticado)
  async getCurrentUser(): Promise<ApiResponse<{ user: any }>> {
    return this.makeRequest("/api/user/profile")
  }

  // Atualizar tema (quando autenticado)
  async updateTheme(themeData: any): Promise<ApiResponse<{ success: boolean }>> {
    return this.makeRequest("/api/theme/update", {
      method: "POST",
      body: JSON.stringify(themeData),
    })
  }

  // Buscar agentes do usuário
  async getAgents(): Promise<ApiResponse<{ agents: any[] }>> {
    return this.makeRequest("/api/agents")
  }

  // Buscar agentes (admin)
  async getAdminAgents(): Promise<ApiResponse<{ agents: any[]; users: any[]; connections: any[] }>> {
    return this.makeRequest("/api/admin/agents")
  }

  // Criar agente
  async createAgent(agentData: any): Promise<ApiResponse<{ agent: any }>> {
    return this.makeRequest("/api/admin/agents", {
      method: "POST",
      body: JSON.stringify(agentData),
    })
  }

  // Atualizar agente
  async updateAgent(agentId: string, agentData: any): Promise<ApiResponse<{ agent: any }>> {
    return this.makeRequest("/api/admin/agents", {
      method: "PUT",
      body: JSON.stringify({ id: agentId, ...agentData }),
    })
  }

  // Deletar agente
  async deleteAgent(agentId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.makeRequest(`/api/admin/agents?id=${agentId}`, {
      method: "DELETE",
    })
  }

  // Buscar conexões WhatsApp
  async getWhatsAppConnections(userId?: string, isAdmin = false): Promise<ApiResponse<{ connections: any[] }>> {
    return this.makeRequest(`/api/whatsapp-connections?userId=${userId || ""}&isAdmin=${isAdmin}`)
  }

  // Buscar estatísticas do dashboard
  async getDashboardStats(): Promise<ApiResponse<{ stats: any }>> {
    return this.makeRequest("/api/dashboard/stats")
  }

  // Buscar versão do sistema
  async getSystemVersion(): Promise<ApiResponse<{ version: string }>> {
    return this.makeRequest("/api/system/version")
  }

  // Buscar modelo padrão do sistema
  async getSystemDefaultModel(): Promise<ApiResponse<{ defaultModel: string }>> {
    return this.makeRequest("/api/system/default-model")
  }

  // Buscar configurações do sistema
  async getSystemSettings(): Promise<ApiResponse<{ settings: any }>> {
    return this.makeRequest("/api/system/settings")
  }

  // Buscar integrações
  async getIntegrations(): Promise<ApiResponse<any[]>> {
    return this.makeRequest("/api/integrations")
  }
  // ... outros métodos ...
}

export const publicApi = new PublicApiClient()
export const apiClient = publicApi // Compatibilidade
// ... outros exports de conveniência ...
export type { ApiResponse }
