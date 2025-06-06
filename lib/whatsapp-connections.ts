import { db } from "@/lib/supabase"

export async function fetchWhatsAppConnections(userId: string) {
  try {
    const { data, error } = await db
      .whatsappConnections()
      .select("*")
      .eq("user_id", userId)
      .eq("status", "connected")
      .order("created_at", { ascending: false })

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

export async function createWhatsAppConnection(connectionData: {
  user_id: string
  connection_name: string
  instance_name: string
  instance_token: string
}) {
  try {
    const { data, error } = await db.whatsappConnections().insert([connectionData]).select().single()

    if (error) {
      console.error("Erro ao criar conexão WhatsApp:", error)
      return { success: false, error: error.message }
    }

    return { success: true, connection: data }
  } catch (error) {
    console.error("Erro ao criar conexão WhatsApp:", error)
    return { success: false, error: "Erro interno do servidor" }
  }
}

export async function updateWhatsAppConnection(connectionId: string, updates: any) {
  try {
    const { data, error } = await db.whatsappConnections().update(updates).eq("id", connectionId).select().single()

    if (error) {
      console.error("Erro ao atualizar conexão WhatsApp:", error)
      return { success: false, error: error.message }
    }

    return { success: true, connection: data }
  } catch (error) {
    console.error("Erro ao atualizar conexão WhatsApp:", error)
    return { success: false, error: "Erro interno do servidor" }
  }
}

export async function deleteWhatsAppConnection(connectionId: string) {
  try {
    const { error } = await db.whatsappConnections().delete().eq("id", connectionId)

    if (error) {
      console.error("Erro ao deletar conexão WhatsApp:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Erro ao deletar conexão WhatsApp:", error)
    return { success: false, error: "Erro interno do servidor" }
  }
}
