const makeRequest = async (url: string, options: RequestInit = {}) => {
  const res = await fetch(url, options)

  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.")
    // @ts-ignore
    error.status = res.status
    throw error
  }

  const data = await res.json()
  console.log("📡 [API-CLIENT] Dados a serem retornados por makeRequest:", data)
  return data
}

export const publicApi = {
  getWhatsAppConnections: async (userId?: string, isAdmin = false) => {
    const url = `/api/whatsapp-connections${userId ? `?userId=${userId}` : ""}${isAdmin ? `${userId ? "&" : "?"}isAdmin=true` : ""}`
    return makeRequest(url)
  },
  // Configurações públicas via API (SEM variáveis de ambiente)
  async getConfig(): Promise<any> {
    const response = await makeRequest("/api/config")
    console.log("📡 [API-CLIENT] Resposta de getConfig:", response)
    return response
  },
}
