import { createClient } from "@supabase/supabase-js"

// Verificar se as variáveis de ambiente estão definidas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Log para debug (apenas no desenvolvimento)
if (process.env.NODE_ENV === "development") {
  console.log("🔧 Supabase Configuration Debug:")
  console.log("URL:", supabaseUrl)
  console.log("Key:", supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : "❌ Missing")
}

// Validação das variáveis
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = `
    ❌ ERRO DE CONFIGURAÇÃO DO SUPABASE:
    - URL: ${supabaseUrl || "NÃO DEFINIDA"}
    - Key: ${supabaseAnonKey ? "DEFINIDA" : "NÃO DEFINIDA"}
    
    Verifique:
    1. Variáveis no Portainer Stack
    2. Script de substituição no Docker
    3. Build da imagem
  `

  console.error(errorMessage)

  // Em produção, usar fallback com aviso
  if (process.env.NODE_ENV === "production") {
    console.warn("⚠️ Usando configuração de fallback - verifique as variáveis de ambiente!")
  }
}

// Criar cliente Supabase
export const supabase = createClient(supabaseUrl || "http://localhost:54321", supabaseAnonKey || "dummy-key", {
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

// Função para acessar qualquer tabela no schema correto
export function getTable(tableName: string) {
  return supabase.from(tableName)
}

// Funções específicas para cada tabela - USANDO A NOVA ESTRUTURA
export const db = {
  users: () => getTable("user_profiles"),
  agents: () => getTable("ai_agents"),
  whatsappConnections: () => getTable("whatsapp_connections"),
  activityLogs: () => getTable("agent_activity_logs"),
  userSettings: () => getTable("user_settings"),
  systemSettings: () => getTable("system_settings"),
  themes: () => getTable("system_themes"),
  integrations: () => getTable("integrations"),
  vectorStores: () => getTable("vector_stores"),
  vectorDocuments: () => getTable("vector_documents"),
  apiKeys: () => getTable("user_api_keys"),
  organizations: () => getTable("organizations"),
  dailyMetrics: () => getTable("daily_metrics"),

  // Função para executar queries SQL diretas
  rpc: (functionName: string, params?: any) => supabase.rpc(functionName, params),
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
