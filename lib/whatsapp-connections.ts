// Função simplificada para buscar conexões WhatsApp
export async function fetchWhatsAppConnections(userId?: string, isAdmin = false) {
  try {
    const params = new URLSearchParams()

    if (userId) {
      params.append("userId", userId)
    }

    if (isAdmin) {
      params.append("isAdmin", "true")
    }

    const url = `/api/whatsapp-connections?${params.toString()}`

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store", // Evitar cache
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || "Erro na resposta da API")
    }

    return data.connections || []
  } catch (error: any) {
    console.error("Erro ao buscar conexões WhatsApp:", error.message)
    return []
  }
}

// Função simplificada para buscar usuários
export async function fetchUsers() {
  try {
    const response = await fetch("/api/admin/users", {
      method: "GET",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    return data.users || []
  } catch (error: any) {
    console.error("Erro ao buscar usuários:", error.message)
    return []
  }
}
