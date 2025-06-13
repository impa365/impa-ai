import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// Variável para armazenar a instância do cliente
let supabaseInstance: SupabaseClient | null = null

// Função que cria o cliente apenas quando necessário
function getSupabaseClient(): SupabaseClient {
  // Se já existe uma instância, retorna ela
  if (supabaseInstance) {
    return supabaseInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // LOGS DE DEPURAÇÃO TEMPORÁRIOS - REMOVA APÓS VERIFICAR NO PORTAINER
  console.log("--- DEBUG Supabase Client Initialization ---")
  console.log("Attempting to read NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl)
  console.log(
    "Attempting to read NEXT_PUBLIC_SUPABASE_ANON_KEY:",
    supabaseAnonKey ? "Exists (key hidden)" : "MISSING or EMPTY",
  )
  console.log("------------------------------------------")

  if (!supabaseUrl || supabaseUrl.trim() === "" || supabaseUrl.includes("localhost")) {
    const errorMsg = `CRITICAL ERROR: NEXT_PUBLIC_SUPABASE_URL is not correctly configured. Value received: '${supabaseUrl}'. It must be a valid URL and not 'localhost'.`
    console.error(errorMsg)
    throw new Error(errorMsg)
  }

  if (!supabaseAnonKey || supabaseAnonKey.trim() === "") {
    const errorMsg = `CRITICAL ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY is not correctly configured. It's missing or empty.`
    console.error(errorMsg)
    throw new Error(errorMsg)
  }

  // Cria a instância
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: "impaai" },
      global: { headers: { "Accept-Profile": "impaai", "Content-Profile": "impaai" } },
    })
    console.log(
      `Supabase client successfully initialized for URL (domain only for security): ${new URL(supabaseUrl).hostname}`,
    )
  } catch (e: any) {
    console.error("Failed to create Supabase client instance:", e.message)
    throw new Error(`Failed to create Supabase client instance: ${e.message}`)
  }

  return supabaseInstance
}

// Exporta o cliente
export const supabase = getSupabaseClient()

// Objeto db para facilitar o uso
export const db = {
  users: () => supabase.from("user_profiles"),
  agents: () => supabase.from("ai_agents"),
  whatsappConnections: () => supabase.from("whatsapp_connections"),
  activityLogs: () => supabase.from("agent_activity_logs"),
  userSettings: () => supabase.from("user_settings"),
  systemSettings: () => supabase.from("system_settings"),
  themes: () => supabase.from("system_themes"),
  integrations: () => supabase.from("integrations"),
  vectorStores: () => supabase.from("vector_stores"),
  vectorDocuments: () => supabase.from("vector_documents"),
  apiKeys: () => supabase.from("user_api_keys"),
  organizations: () => supabase.from("organizations"),
  dailyMetrics: () => supabase.from("daily_metrics"),
  rpc: (functionName: string, params?: any) => supabase.rpc(functionName, params),
}

// Tipos (permanecem os mesmos)
export interface UserProfile {
  id: string
  full_name: string | null
  email: string
  role: "user" | "admin" | "moderator"
  status: "active" | "inactive" | "suspended" | "hibernated"
  password?: string
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

export interface Integration {
  id: string
  name: string
  type: string
  config: any
  is_active: boolean
  created_at: string
  updated_at: string
}

export default supabase
