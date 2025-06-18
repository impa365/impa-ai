// Cliente de API que NUNCA expõe variáveis de ambiente
// Todas as requisições passam pelas APIs do servidor

interface ApiResponse<T = any> {
  data?: T
  error?: string
}

class PublicApiClient {
  private baseUrl: string

  constructor() {
    // Usar apenas a URL base atual, SEM variáveis de ambiente
    this.baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  }

  async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      console.log("📡 Fazendo requisição para:", endpoint)

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("❌ Erro na requisição:", response.status, data.error)
        return { error: data.error || "Erro na requisição" }
      }

      console.log("✅ Requisição bem-sucedida:", endpoint)
      return { data }
    } catch (error: any) {
      console.error("💥 Erro de rede:", error.message)
      return { error: "Erro de conexão" }
    }
  }

  // Login via API (NUNCA expõe variáveis de ambiente)
  async login(email: string, password: string): Promise<ApiResponse<{ user: any }>> {
    return this.makeRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
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

  // Configurações públicas via API (SEM variáveis de ambiente)
  async getConfig(): Promise<ApiResponse<{ theme: any; settings: any }>> {
    return this.makeRequest("/api/config")
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

  // Buscar estatísticas do dashboard
  async getDashboardStats(): Promise<ApiResponse<{ stats: any }>> {
    return this.makeRequest("/api/dashboard/stats")
  }

  // Buscar dados do dashboard admin
  async getAdminDashboard(): Promise<ApiResponse<any>> {
    return this.makeRequest("/api/admin/dashboard")
  }

  // Buscar versão do sistema
  async getSystemVersion(): Promise<ApiResponse<{ version: string }>> {
    return this.makeRequest("/api/system/version")
  }

  // Buscar usuários (admin)
  async getUsers(): Promise<ApiResponse<{ users: any[] }>> {
    return this.makeRequest("/api/admin/users")
  }

  // Buscar usuário específico (admin)
  async getUser(userId: string): Promise<ApiResponse<{ user: any }>> {
    return this.makeRequest(`/api/admin/users/${userId}`)
  }

  // Criar usuário (admin)
  async createUser(userData: any): Promise<ApiResponse<{ user: any }>> {
    return this.makeRequest("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  // Atualizar usuário (admin)
  async updateUser(userId: string, userData: any): Promise<ApiResponse<{ user: any }>> {
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

  // Buscar configurações do sistema
  async getSystemSettings(): Promise<ApiResponse<{ settings: any }>> {
    return this.makeRequest("/api/system/settings")
  }
}

// Instância única do cliente de API
export const publicApi = new PublicApiClient()

// Export adicional para compatibilidade (mesmo objeto, nomes diferentes)
export const apiClient = publicApi

// Exports de conveniência para diferentes contextos
export const authApi = {
  login: (email: string, password: string) => publicApi.login(email, password),
  register: (userData: any) => publicApi.register(userData),
  getCurrentUser: () => publicApi.getCurrentUser(),
}

export const themeApi = {
  getConfig: () => publicApi.getConfig(),
  updateTheme: (themeData: any) => publicApi.updateTheme(themeData),
}

export const dashboardApi = {
  getStats: () => publicApi.getDashboardStats(),
  getAgents: () => publicApi.getAgents(),
  getAdminDashboard: () => publicApi.getAdminDashboard(),
}

export const systemApi = {
  getVersion: () => publicApi.getSystemVersion(),
  getSettings: () => publicApi.getSystemSettings(),
}

export const adminApi = {
  getUsers: () => publicApi.getUsers(),
  getUser: (userId: string) => publicApi.getUser(userId),
  createUser: (userData: any) => publicApi.createUser(userData),
  updateUser: (userId: string, userData: any) => publicApi.updateUser(userId, userData),
  deleteUser: (userId: string) => publicApi.deleteUser(userId),
}

// Tipo para as respostas da API
export type { ApiResponse }
