// lib/supabase.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { supabaseConfig, TABLES } from "./supabase-config" // Importar TABLES

let clientInstance: SupabaseClient | null = null
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function getSupabase(): Promise<SupabaseClient> {
  if (clientInstance) {
    return clientInstance
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL or Anon Key is missing. Check environment variables.")
    throw new Error("Supabase URL or Anon Key is not configured.")
  }

  try {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: supabaseConfig.schema || "public" },
      global: { headers: supabaseConfig.headers || {} },
    })
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    throw error
  }

  return clientInstance
}

let serverClientInstance: SupabaseClient | null = null
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export function getSupabaseAdmin(): SupabaseClient {
  if (serverClientInstance) {
    return serverClientInstance
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Supabase URL or Service Role Key is missing for admin client.")
    throw new Error("Supabase URL or Service Role Key is not configured for admin client.")
  }

  serverClientInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
    db: { schema: supabaseConfig.schema || "public" },
    global: { headers: supabaseConfig.headers || {} },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  return serverClientInstance
}

// Função auxiliar para acessar tabelas
export async function getTable(tableName: string) {
  const client = await getSupabase()
  return client.from(tableName)
}

// Export 'supabase' para compatibilidade e uso geral
export const supabase = {
  from: async (table: string) => {
    const client = await getSupabase()
    return client.from(table)
  },
  rpc: async (fn: string, params?: object, options?: { head?: boolean; count?: "exact" | "planned" | "estimated" }) => {
    const client = await getSupabase()
    return client.rpc(fn, params, options)
  },
  auth: {
    getUser: async () => {
      const client = await getSupabase()
      return client.auth.getUser()
    },
    signInWithPassword: async (credentials: Parameters<SupabaseClient["auth"]["signInWithPassword"]>[0]) => {
      const client = await getSupabase()
      return client.auth.signInWithPassword(credentials)
    },
    signUp: async (credentials: Parameters<SupabaseClient["auth"]["signUp"]>[0]) => {
      const client = await getSupabase()
      return client.auth.signUp(credentials)
    },
    signOut: async () => {
      const client = await getSupabase()
      return client.auth.signOut()
    },
    // Adicione outras funções de auth conforme necessário
  },
}

// Export 'db' para acesso tipado às tabelas (exemplo)
export const db = {
  users: async () => getTable(TABLES.USER_PROFILES),
  agents: async () => getTable(TABLES.AI_AGENTS),
  whatsappConnections: async () => getTable(TABLES.WHATSAPP_CONNECTIONS),
  activityLogs: async () => getTable(TABLES.AGENT_ACTIVITY_LOGS),
  userSettings: async () => getTable(TABLES.USER_SETTINGS),
  systemSettings: async () => getTable(TABLES.SYSTEM_SETTINGS),
  themes: async () => getTable(TABLES.SYSTEM_THEMES),
  integrations: async () => getTable(TABLES.INTEGRATIONS),
  vectorStores: async () => getTable(TABLES.VECTOR_STORES),
  vectorDocuments: async () => getTable(TABLES.VECTOR_DOCUMENTS),
  apiKeys: async () => getTable(TABLES.USER_API_KEYS),
  organizations: async () => getTable(TABLES.ORGANIZATIONS),
  dailyMetrics: async () => getTable(TABLES.DAILY_METRICS),
  // Adicione outras tabelas conforme o objeto TABLES
  rpc: supabase.rpc, // Reutilizar a função rpc do objeto supabase
}

// Tipos (mantenha ou ajuste conforme sua estrutura original)
export interface UserProfile {
  id: string
  full_name: string | null
  email: string
  role: "user" | "admin" | "moderator"
  status: "active" | "inactive" | "suspended" | "hibernated"
  password?: string // Geralmente não armazenado diretamente no perfil do cliente
  organization_id?: string | null
  last_login_at?: string | null
  created_at: string
  updated_at: string
  api_key?: string
  avatar_url?: string
  theme_settings?: any
  preferences?: any
}

// Adicione outras interfaces (Organization, AIAgent, etc.) se elas estavam neste arquivo
// ou certifique-se de que estão corretamente importadas/exportadas de onde vêm.
// Se os tipos estavam aqui, você precisará adicioná-los de volta.
// Por exemplo:
// export interface Organization { /* ... */ }
// export interface AIAgent { /* ... */ }
// ... e assim por diante para todos os tipos que estavam definidos aqui.

// Se você tinha um export default supabase, remova-o, pois agora estamos usando named exports.
// export default supabase; // REMOVA ESTA LINHA SE EXISTIR
