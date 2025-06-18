import { publicApi } from "@/lib/api-client"

// NUNCA mais acessa Supabase diretamente - apenas via APIs seguras
export async function fetchWhatsAppConnections(userId?: string, isAdmin = false) {
  try {
    console.log("📡 Buscando conexões WhatsApp via API...")

    // Usar API segura ao invés de Supabase direto
    const response = await publicApi.makeRequest(`/api/whatsapp-connections?userId=${userId || ""}&isAdmin=${isAdmin}`)

    if (response.error) {
      console.error("❌ Erro ao buscar conexões:", response.error)
      return []
    }

    console.log("✅ Conexões carregadas via API:", response.data?.connections?.length || 0)
    return response.data?.connections || []
  } catch (error) {
    console.error("💥 Erro ao buscar conexões WhatsApp:", error)
    return []
  }
}

export async function fetchUsers() {
  try {
    console.log("📡 Buscando usuários via API...")

    // Usar API segura ao invés de Supabase direto
    const response = await publicApi.makeRequest("/api/admin/users")

    if (response.error) {
      console.error("❌ Erro ao buscar usuários:", response.error)
      return []
    }

    console.log("✅ Usuários carregados via API:", response.data?.users?.length || 0)
    return response.data?.users || []
  } catch (error) {
    console.error("💥 Erro ao buscar usuários:", error)
    return []
  }
}

export async function createWhatsAppConnection(connectionData: {
  user_id: string
  connection_name: string
  instance_name: string
  instance_token: string
}) {
  try {
    console.log("📡 Criando conexão WhatsApp via API...")

    const response = await publicApi.makeRequest("/api/whatsapp-connections", {
      method: "POST",
      body: JSON.stringify(connectionData),
    })

    if (response.error) {
      console.error("❌ Erro ao criar conexão:", response.error)
      return { success: false, error: response.error }
    }

    console.log("✅ Conexão criada via API")
    return { success: true, connection: response.data?.connection }
  } catch (error: any) {
    console.error("💥 Erro ao criar conexão WhatsApp:", error)
    return { success: false, error: error.message || "Erro interno do servidor" }
  }
}

export async function updateWhatsAppConnection(connectionId: string, updates: any) {
  try {
    console.log("📡 Atualizando conexão WhatsApp via API...")

    const response = await publicApi.makeRequest("/api/whatsapp-connections", {
      method: "PUT",
      body: JSON.stringify({ id: connectionId, ...updates }),
    })

    if (response.error) {
      console.error("❌ Erro ao atualizar conexão:", response.error)
      return { success: false, error: response.error }
    }

    console.log("✅ Conexão atualizada via API")
    return { success: true, connection: response.data?.connection }
  } catch (error: any) {
    console.error("💥 Erro ao atualizar conexão WhatsApp:", error)
    return { success: false, error: error.message || "Erro interno do servidor" }
  }
}

export async function deleteWhatsAppConnection(connectionId: string) {
  try {
    console.log("📡 Deletando conexão WhatsApp via API...")

    const response = await publicApi.makeRequest(`/api/whatsapp-connections?id=${connectionId}`, {
      method: "DELETE",
    })

    if (response.error) {
      console.error("❌ Erro ao deletar conexão:", response.error)
      return { success: false, error: response.error }
    }

    console.log("✅ Conexão deletada via API")
    return { success: true }
  } catch (error: any) {
    console.error("💥 Erro ao deletar conexão WhatsApp:", error)
    return { success: false, error: error.message || "Erro interno do servidor" }
  }
}
