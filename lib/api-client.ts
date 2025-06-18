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

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
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
}

// Instância única do cliente de API
export const publicApi = new PublicApiClient()
