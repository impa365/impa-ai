export interface WhatsappConnection {
  id: string
  name: string
  status: "connected" | "disconnected" | "connecting" | "error"
  phone_number?: string
  created_at: string
  updated_at: string
}
