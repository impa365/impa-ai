import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para o banco de dados
export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: "user" | "admin"
  status: "active" | "inactive" | "suspended" | "hibernated"
  organization_id: string | null
  last_login: string | null
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  name: string
  email: string
  admin_user_id: string | null
  created_at: string
  updated_at: string
}

export interface AIAgent {
  id: string
  organization_id: string
  name: string
  type: "vendas" | "suporte" | "marketing" | "geral"
  description: string | null
  status: "active" | "inactive" | "training"
  model_config: any
  prompt_template: string | null
  created_at: string
  updated_at: string
}

// Adicionar novos tipos para WhatsApp e configurações
export interface WhatsAppConnection {
  id: string
  user_id: string
  connection_name: string
  instance_name: string
  instance_id: string | null
  instance_token: string
  status: "connected" | "disconnected" | "connecting" | "error"
  qr_code: string | null
  phone_number: string | null
  created_at: string
  updated_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  whatsapp_connections_limit: number
  created_at: string
  updated_at: string
}

export interface SystemSettings {
  id: string
  setting_key: string
  setting_value: any
  created_at: string
  updated_at: string
}
