import { supabase } from "./supabase" // Assuming supabase client is in lib/supabase.ts

export interface WhatsAppConnection {
  id: string
  user_id: string
  connection_name: string
  instance_name: string
  phone_number?: string | null
  status: "connected" | "disconnected" | "connecting" | "error" | "paused"
  // Add other relevant fields from your whatsapp_connections table
}

export async function fetchWhatsAppConnections(userId: string): Promise<WhatsAppConnection[]> {
  if (!userId) {
    console.warn("fetchWhatsAppConnections: userId is undefined or null.")
    return []
  }

  try {
    const { data, error } = await supabase.from("whatsapp_connections").select("*").eq("user_id", userId)

    if (error) {
      console.error("Error fetching WhatsApp connections:", error)
      return []
    }
    return data as WhatsAppConnection[]
  } catch (err) {
    console.error("Unexpected error in fetchWhatsAppConnections:", err)
    return []
  }
}
