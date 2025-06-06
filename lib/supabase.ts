import { createClient } from "@supabase/supabase-js"

// Obter variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://supa.impa365.com"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0.cVmHXTXMMB09PuXEMevVuGxV5_ZR4yJly6pF0uab7fA"

// Criar cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: "impaai", // Definir schema padrão como impaai
  },
})

// Função para obter o cliente com schema específico
export function getSupabaseClient(schema = "impaai") {
  return createClient(supabaseUrl, supabaseAnonKey, {
    db: {
      schema: schema,
    },
  })
}

// Exportar createClient como named export
export { createClient }

// Tipos para o banco de dados
export interface UserProfile {
  id: string
  full_name: string | null
  email: string
  role: "user" | "admin" | "moderator"
  status: "active" | "inactive" | "suspended" | "hibernated"
  password_hash?: string
  organization_id?: string | null
  last_login_at?: string | null
  created_at: string
  updated_at: string
  api_key?: string
  avatar_url?: string
  theme_settings?: any
  preferences?: any
}

export interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  logo_url?: string
  website?: string
  admin_user_id?: string
  settings?: any
  plan?: string
  status?: string
  created_at: string
  updated_at: string
}

export interface AIAgent {
  id: string
  user_id: string
  organization_id?: string
  whatsapp_connection_id?: string
  name: string
  description?: string
  avatar_url?: string
  identity_description?: string
  training_prompt: string
  voice_tone?: string
  main_function?: string
  model?: string
  temperature?: number
  max_tokens?: number
  model_config?: any
  transcribe_audio?: boolean
  understand_images?: boolean
  voice_response_enabled?: boolean
  voice_provider?: string
  voice_api_key?: string
  voice_id?: string
  calendar_integration?: boolean
  calendar_api_key?: string
  calendar_meeting_id?: string
  chatnode_integration?: boolean
  chatnode_api_key?: string
  chatnode_bot_id?: string
  orimon_integration?: boolean
  orimon_api_key?: string
  orimon_bot_id?: string
  is_default?: boolean
  status?: string
  created_at: string
  updated_at: string
}

export interface WhatsAppConnection {
  id: string
  user_id: string
  organization_id?: string
  connection_name: string
  instance_name: string
  instance_id?: string
  instance_token: string
  status: "connected" | "disconnected" | "connecting" | "error" | "banned"
  qr_code?: string
  phone_number?: string
  created_at: string
  updated_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  agents_limit?: number
  transcribe_audio_enabled?: boolean
  understand_images_enabled?: boolean
  voice_response_enabled?: boolean
  calendar_integration_enabled?: boolean
  vector_store_enabled?: boolean
  created_at: string
  updated_at: string
}

export interface SystemSettings {
  id: string
  setting_key: string
  setting_value: any
  category?: string
  description?: string
  is_public?: boolean
  requires_restart?: boolean
  created_at: string
  updated_at: string
}

export interface SystemTheme {
  id: string
  name: string
  display_name: string
  description?: string
  colors: any
  fonts?: any
  spacing?: any
  borders?: any
  shadows?: any
  is_default?: boolean
  is_active?: boolean
  preview_image_url?: string
  created_by?: string
  created_at: string
  updated_at: string
}
