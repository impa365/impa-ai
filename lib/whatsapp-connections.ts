// Content from attached file: lib__whatsapp-connections-zlSSYqM5qMw4z1G8QUqxbSXmBGcmn0.ts
import { supabase } from "@/lib/supabase"

export async function fetchWhatsAppConnections(userId?: string, isAdmin = false) {
  try {
    let query = supabase.from("whatsapp_connections").select("*")

    // Se for admin e não especificou userId, buscar todas as conexões
    if (isAdmin && !userId) {
      console.log("Admin buscando todas as conexões")
      // Não aplicar filtro de usuário
    } else if (userId) {
      // Filtrar por usuário específico (admin escolheu um usuário ou usuário comum)
      console.log(`Filtrando conexões para usuário: ${userId}`)
      query = query.eq("user_id", userId)
    } else {
      // Fallback: não retornar nenhuma conexão se não tiver userId e não for admin
      // This case might occur if a non-admin calls this without a userId,
      // or an admin calls it with isAdmin=false and no userId.
      console.warn("Nenhum userId fornecido e/ou usuário não é admin sem userId específico. Retornando array vazio.")
      return []
    }

    // The previous version had:
    // const validStatuses = ["connected", "Authenticated", "disconnected", "connecting", "error"]
    // query = query.in("status", validStatuses)
    // This filtering is not present in the new file, so it will fetch all statuses.

    query = query.order("created_at", { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error("Erro ao buscar conexões WhatsApp:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Erro ao buscar conexões WhatsApp:", error)
    return []
  }
}

export async function fetchUsers() {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("id, full_name, email, status, role") // Added role as per agent-modal usage
      .eq("status", "active") // Fetches only active users
      .order("full_name", { ascending: true })

    if (error) {
      console.error("Erro ao buscar usuários:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Erro ao buscar usuários:", error)
    return []
  }
}

export async function createWhatsAppConnection(connectionData: {
  user_id: string
  connection_name: string
  instance_name: string
  instance_token: string // This field was not in the previous ai_agents table schema for whatsapp_connections
}) {
  try {
    const { data, error } = await supabase.from("whatsapp_connections").insert([connectionData]).select().single()

    if (error) {
      console.error("Erro ao criar conexão WhatsApp:", error)
      return { success: false, error: error.message }
    }

    return { success: true, connection: data }
  } catch (error: any) {
    console.error("Erro ao criar conexão WhatsApp:", error)
    return { success: false, error: error.message || "Erro interno do servidor" }
  }
}

export async function updateWhatsAppConnection(connectionId: string, updates: any) {
  try {
    const { data, error } = await supabase
      .from("whatsapp_connections")
      .update(updates)
      .eq("id", connectionId)
      .select()
      .single()

    if (error) {
      console.error("Erro ao atualizar conexão WhatsApp:", error)
      return { success: false, error: error.message }
    }

    return { success: true, connection: data }
  } catch (error: any) {
    console.error("Erro ao atualizar conexão WhatsApp:", error)
    return { success: false, error: error.message || "Erro interno do servidor" }
  }
}

export async function deleteWhatsAppConnection(connectionId: string) {
  try {
    const { error } = await supabase.from("whatsapp_connections").delete().eq("id", connectionId)

    if (error) {
      console.error("Erro ao deletar conexão WhatsApp:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Erro ao deletar conexão WhatsApp:", error)
    return { success: false, error: error.message || "Erro interno do servidor" }
  }
}
