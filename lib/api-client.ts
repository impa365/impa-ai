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
        console.warn(
          `⚠️ [API-CLIENT] Falha ao parsear JSON da resposta de ${endpoint} (status: ${response.status}). Corpo não era JSON?`,
          e,
        )
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
  // ... outros métodos ...
}

export const publicApi = new PublicApiClient()
export const apiClient = publicApi // Compatibilidade
// ... outros exports de conveniência ...
export type { ApiResponse }
