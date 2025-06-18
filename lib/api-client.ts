// Cliente para fazer requisições seguras para as APIs
// NUNCA acessa variáveis de ambiente diretamente

interface ApiResponse<T> {
  data?: T
  error?: string
}

class ApiClient {
  private baseUrl: string

  constructor() {
    // Usar a URL base atual, sem hardcode
    this.baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}/api${endpoint}`

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      const data = await response.json()
      return { data }
    } catch (error: any) {
      console.error(`API Error [${endpoint}]:`, error.message)
      return {
        error: error.message || "Erro de conexão",
      }
    }
  }

  // Buscar configurações públicas do sistema
  async getPublicConfig() {
    return this.request<{
      theme: any
      settings: any
    }>("/config")
  }

  // Login do usuário
  async login(email: string, password: string) {
    return this.request<{ user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }

  // Registro de usuário
  async register(userData: { email: string; password: string; full_name: string }) {
    return this.request<{ user: any }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  // Buscar dados do usuário atual (quando logado)
  async getCurrentUser() {
    return this.request<{ user: any }>("/user/profile")
  }

  // Atualizar tema
  async updateTheme(themeData: any) {
    return this.request<{ success: boolean }>("/theme/update", {
      method: "POST",
      body: JSON.stringify(themeData),
    })
  }
}

// Instância singleton
export const apiClient = new ApiClient()

// Funções de conveniência
export const publicApi = {
  getConfig: () => apiClient.getPublicConfig(),
  login: (email: string, password: string) => apiClient.login(email, password),
  register: (userData: any) => apiClient.register(userData),
}

export const authApi = {
  getCurrentUser: () => apiClient.getCurrentUser(),
  updateTheme: (themeData: any) => apiClient.updateTheme(themeData),
}
