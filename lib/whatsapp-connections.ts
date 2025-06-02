import { supabase } from "./supabase"

export interface WhatsAppConnection {
  id: string
  user_id: string
  connection_name: string
  phone_number?: string
  instance_name: string
  status: "disconnected" | "connecting" | "connected"
  qr_code?: string
  created_at: string
  updated_at: string
}

export async function fetchWhatsAppConnections(userId: string): Promise<WhatsAppConnection[]> {
  try {
    const { data, error } = await supabase
      .from("whatsapp_connections")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching WhatsApp connections:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching WhatsApp connections:", error)
    return []
  }
}

export async function getWhatsAppConnectionById(connectionId: string): Promise<WhatsAppConnection | null> {
  try {
    const { data, error } = await supabase.from("whatsapp_connections").select("*").eq("id", connectionId).single()

    if (error) {
      console.error("Error fetching WhatsApp connection:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error fetching WhatsApp connection:", error)
    return null
  }
}

export async function updateWhatsAppConnectionStatus(
  connectionId: string,
  status: WhatsAppConnection["status"],
  additionalData?: Partial<WhatsAppConnection>,
): Promise<boolean> {
  try {
    const updateData = {
      status,
      updated_at: new Date().toISOString(),
      ...additionalData,
    }

    const { error } = await supabase.from("whatsapp_connections").update(updateData).eq("id", connectionId)

    if (error) {
      console.error("Error updating WhatsApp connection status:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error updating WhatsApp connection status:", error)
    return false
  }
}
