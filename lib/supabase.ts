import { createClient } from "@supabase/supabase-js"
import { SUPABASE_URL, SUPABASE_ANON_KEY, SCHEMA_NAME, TABLES } from "./supabase-config"

// Opções para o cliente Supabase
const options = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      "Accept-Profile": SCHEMA_NAME,
    },
  },
}

// Criar cliente Supabase com headers para o schema correto
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, options)

// Exportar createClient como named export
export { createClient }

// Função para acessar qualquer tabela no schema correto
export function getTable(tableName: string) {
  return supabase.from(tableName)
}

// Funções específicas para cada tabela
export const db = {
  users: () => getTable(TABLES.USER_PROFILES),
  agents: () => getTable(TABLES.AI_AGENTS),
  whatsappConnections: () => getTable(TABLES.WHATSAPP_CONNECTIONS),
  activityLogs: () => getTable(TABLES.AGENT_ACTIVITY_LOGS),
  userSettings: () => getTable(TABLES.USER_SETTINGS),
  systemSettings: () => getTable(TABLES.SYSTEM_SETTINGS),
  themes: () => getTable(TABLES.SYSTEM_THEMES),
  integrations: () => getTable(TABLES.INTEGRATIONS),
  vectorStores: () => getTable(TABLES.VECTOR_STORES),
  vectorDocuments: () => getTable(TABLES.VECTOR_DOCUMENTS),
  apiKeys: () => getTable(TABLES.API_KEYS),
  organizations: () => getTable(TABLES.ORGANIZATIONS),

  // Função para executar queries SQL diretas
  rpc: (functionName: string, params?: any) => supabase.rpc(functionName, params),

  // Função para fazer fetch via REST API
  fetchRest: async (
    tableName: string,
    options: {
      select?: string
      filters?: Record<string, any>
      limit?: number
      order?: { column: string; ascending?: boolean }
    } = {},
  ) => {
    const { select = "*", filters = {}, limit, order } = options

    let url = `${SUPABASE_URL}/rest/v1/${tableName}?select=${select}`

    // Adicionar filtros
    Object.entries(filters).forEach(([key, value]) => {
      url += `&${key}=eq.${value}`
    })

    // Adicionar limite
    if (limit) {
      url += `&limit=${limit}`
    }

    // Adicionar ordenação
    if (order) {
      const direction = order.ascending === false ? "desc" : "asc"
      url += `&order=${order.column}.${direction}`
    }

    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Accept-Profile": SCHEMA_NAME,
        "Content-Type": "application/json",
      },
    })

    return response.json()
  },
}

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

// Outros tipos permanecem iguais...
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
