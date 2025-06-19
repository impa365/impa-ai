const makeRequest = async (url: string, options: RequestInit = {}) => {
  const res = await fetch(url, options)

  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.")
    // @ts-ignore
    error.status = res.status
    throw error
  }

  return res.json()
}

export const publicApi = {
  getWhatsAppConnections: async (userId?: string, isAdmin = false) => {
    const url = `/api/whatsapp-connections${userId ? `?userId=${userId}` : ""}${isAdmin ? `${userId ? "&" : "?"}isAdmin=true` : ""}`
    return makeRequest(url)
  },
}
