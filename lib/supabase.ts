import { createClient } from "@supabase/supabase-js"

// Função para obter configuração do servidor
async function getServerConfig() {
  if (typeof window === "undefined") {
    // No servidor, usar variáveis de ambiente diretamente
    return {
      supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321",
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-key",
    }
  } else {
    // No cliente, fazer fetch para a API
    try {
      const response = await fetch("/api/config")
      const config = await response.json()
      return {
        supabaseUrl: config.supabaseUrl,
        supabaseAnonKey: config.supabaseAnonKey,
      }
    } catch (error) {
      console.error("Erro ao carregar configuração:", error)
      return {
        supabaseUrl: "http://localhost:54321",
        supabaseAnonKey: "dummy-key",
      }
    }
  }
}

// Cliente Supabase singleton
let supabaseClient: any = null
let isInitializing = false
let initPromise: Promise<any> | null = null

// Função para inicializar o cliente Supabase
async function initializeSupabase() {
  if (supabaseClient) return supabaseClient

  if (isInitializing && initPromise) {
    return await initPromise
  }

  isInitializing = true
  initPromise = (async () => {
    const config = await getServerConfig()

    console.log("🔧 Creating Supabase client with config:")
    console.log("URL:", config.supabaseUrl)
    console.log("Key:", config.supabaseAnonKey ? `${config.supabaseAnonKey.substring(0, 20)}...` : "❌ Missing")

    supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey, {
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

    isInitializing = false
    return supabaseClient
  })()

  return await initPromise
}

// Função principal para obter o cliente
export async function getSupabase() {
  return await initializeSupabase()
}

// Cliente Supabase com inicialização lazy - VERSÃO DIRETA
export const supabase = {
  from: (table: string) => {
    return {
      select: async (columns?: string) => {
        const client = await getSupabase()
        return client.from(table).select(columns)
      },
      insert: async (data: any) => {
        const client = await getSupabase()
        return client.from(table).insert(data)
      },
      update: async (data: any) => {
        const client = await getSupabase()
        return client.from(table).update(data)
      },
      delete: async () => {
        const client = await getSupabase()
        return client.from(table).delete()
      },
      eq: (column: string, value: any) => {
        return {
          select: async (columns?: string) => {
            const client = await getSupabase()
            return client.from(table).select(columns).eq(column, value)
          },
          update: async (data: any) => {
            const client = await getSupabase()
            return client.from(table).update(data).eq(column, value)
          },
          delete: async () => {
            const client = await getSupabase()
            return client.from(table).delete().eq(column, value)
          },
        }
      },
    }
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
