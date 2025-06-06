import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: "impaai",
  },
  global: {
    headers: {
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
    },
  },
})

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: "admin" | "user"
  status: "active" | "inactive"
  created_at: string
  updated_at: string
  last_login_at?: string
  password_hash?: string
}

export interface Agent {
  id: string
  user_id: string
  name: string
  description?: string
  instructions?: string
  model: string
  temperature: number
  max_tokens: number
  status: "active" | "inactive"
  created_at: string
  updated_at: string
}

export interface WhatsAppConnection {
  id: string
  user_id: string
  instance_name: string
  phone_number?: string
  status: "connected" | "disconnected" | "connecting"
  qr_code?: string
  created_at: string
  updated_at: string
}
