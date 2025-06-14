import { createClient } from "@supabase/supabase-js"
import { getConfig } from "./config"

// Cliente Supabase singleton
let supabaseClient: any = null
let configPromise: Promise<any> | null = null

// Função para obter o cliente Supabase configurado
export async function getSupabase() {
  if (supabaseClient) {
    return supabaseClient
  }

  if (!configPromise) {
    configPromise = getConfig()
  }

  const config = await configPromise

  // Add a check for valid configuration
  if (!config || !config.supabaseUrl || !config.supabaseAnonKey) {
    console.error("Supabase configuration is invalid. URL or Anon Key is missing.", config)
    // Throw an error to make the failure explicit and prevent creating a faulty client
    throw new Error("Supabase configuration is invalid. Cannot create client.")
  }

  console.log("🔧 Creating Supabase client with config:")
  console.log("URL:", config.supabaseUrl)
  console.log("Key:", config.supabaseAnonKey ? `${config.supabaseAnonKey.substring(0, 20)}...` : "❌ Missing")

  supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    db: {
      schema: "impaai",
    },
    // global headers removed
  })

  return supabaseClient
}

// Para compatibilidade com código existente - VERSÃO SIMPLIFICADA
export const supabase = {
  from: async (table: string) => {
    const client = await getSupabase()
    return client.from(table)
  },
  rpc: async (functionName: string, params?: any) => {
    const client = await getSupabase()
    return client.rpc(functionName, params)
  },
  auth: {
    getUser: async () => {
      const client = await getSupabase()
      return client.auth.getUser()
    },
    signInWithPassword: async (credentials: any) => {
      const client = await getSupabase()
      return client.auth.signInWithPassword(credentials)
    },
    signUp: async (credentials: any) => {
      const client = await getSupabase()
      return client.auth.signUp(credentials)
    },
    signOut: async () => {
      const client = await getSupabase()
      return client.auth.signOut()
    },
  },
}

// Função para acessar qualquer tabela no schema correto
export async function getTable(tableName: string) {
  const client = await getSupabase()
  return client.from(tableName)
}

// Funções específicas para cada tabela - USANDO A NOVA ESTRUTURA
export const db = {
  users: async () => await getTable("user_profiles"),
  agents: async () => await getTable("ai_agents"),
  whatsappConnections: async () => await getTable("whatsapp_connections"),
  activityLogs: async () => await getTable("agent_activity_logs"),
  userSettings: async () => await getTable("user_settings"),
  systemSettings: async () => await getTable("system_settings"),
  themes: async () => await getTable("system_themes"),
  integrations: async () => await getTable("integrations"),
  vectorStores: async () => await getTable("vector_stores"),
  vectorDocuments: async () => await getTable("vector_documents"),
  apiKeys: async () => await getTable("user_api_keys"),
  organizations: async () => await getTable("organizations"),
  dailyMetrics: async () => await getTable("daily_metrics"),

  // Função para executar queries SQL diretas
  rpc: async (functionName: string, params?: any) => {
    const client = await getSupabase()
    return client.rpc(functionName, params)
  },
}

// Tipos para o banco de dados - NOVA ESTRUTURA
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
