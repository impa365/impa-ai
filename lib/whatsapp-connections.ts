import { supabase } from "./supabase"

export interface WhatsAppConnection {
  id: string
  user_id: string
  connection_name: string
  phone_number?: string | null
  // Add other relevant fields from your whatsapp_connections table
}

export async function fetchWhatsAppConnections(userId: string): Promise<WhatsAppConnection[]> {
  if (!userId) {
    console.warn("fetchWhatsAppConnections called without userId")
    return []
  }

  try {
    const { data, error } = await supabase
      .from("whatsapp_connections") // Ensure this table name matches your Supabase schema
      .select("id, user_id, connection_name, phone_number") // Adjust columns as needed
      .eq("user_id", userId)

    if (error) {
      console.error("Error fetching WhatsApp connections:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Exception in fetchWhatsAppConnections:", error)
    return []
  }
}
