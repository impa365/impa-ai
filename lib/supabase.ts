// lib/supabase.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { supabaseConfig, TABLES } from "./supabase-config"
import { getConfig } from "./config"

const IS_SERVER = typeof window === "undefined"

let clientInstance: SupabaseClient | null = null
let serverClientInstance: SupabaseClient | null = null

// Cliente para uso no browser (usa NEXT_PUBLIC_ vars) e fallback para config API
export async function getSupabase(): Promise<SupabaseClient> {
  if (clientInstance) {
    return clientInstance
  }

  let supabaseUrl: string | undefined
  let supabaseAnonKey: string | undefined

  if (!IS_SERVER) {
    // No cliente, priorizar variáveis NEXT_PUBLIC_
    supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    console.log("🔧 Client: Attempting to use NEXT_PUBLIC Supabase vars.")
    console.log("🔧 Client: NEXT_PUBLIC_SUPABASE_URL available:", !!supabaseUrl)
    console.log("🔧 Client: NEXT_PUBLIC_SUPABASE_ANON_KEY available:", !!supabaseAnonKey)
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      IS_SERVER
        ? "Server: Supabase URL/Key not directly available, fetching from config API."
        : "Client: NEXT_PUBLIC Supabase vars not found, falling back to /api/config.",
    )
    try {
      // Fallback para buscar configuração dinamicamente (seja no server ou client sem NEXT_PUBLIC vars)
      const config = await getConfig() // getConfig ainda pode ser útil para OUTRAS configs

      supabaseUrl = config.supabaseUrl
      supabaseAnonKey = config.supabaseAnonKey

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase configuration is missing from /api/config fallback.")
      }
      console.log("🔧 Fetched Supabase config from /api/config successfully.")
    } catch (error) {
      console.error("❌ Error fetching Supabase config from /api/config:", error)
      // Se falhar em obter do /api/config, e as NEXT_PUBLIC_ também não estiverem lá, lançar erro.
      // Isso é crucial para o cliente. No servidor, o getSupabaseAdmin deveria ser usado.
      if (!IS_SERVER) {
        console.error(
          "❌ CRITICAL: Client-side Supabase initialization failed. NEXT_PUBLIC_ vars and /api/config fallback failed.",
        )
      }
      throw new Error(`Failed to initialize Supabase client. ${error.message}`)
    }
  } else if (!IS_SERVER) {
    console.log("🔧 Client: Using NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.")
  }

  clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
    db: { schema: supabaseConfig.schema || "impaai" }, // Garanta que o schema está correto
    global: { headers: supabaseConfig.headers || {} },
  })

  return clientInstance
}

// Cliente admin para uso no servidor (lê variáveis diretamente)
export function getSupabaseAdmin(): SupabaseClient {
  if (serverClientInstance) {
    return serverClientInstance
  }

  // No servidor, ler diretamente das variáveis de ambiente
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("❌ Missing Supabase admin configuration")
    throw new Error("Supabase admin configuration is missing")
  }

  console.log("🔧 Creating Supabase admin client")

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
  },
}

// Export 'db' para acesso tipado às tabelas
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
  rpc: supabase.rpc,
}

// Função para criar cliente Supabase no servidor (para API routes)
export async function getSupabaseServer(): Promise<SupabaseClient> {
  const config = await getConfig()

  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error("Supabase server configuration is missing")
  }

  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    db: { schema: "impaai" }, // Garantir que está usando o schema correto
    global: { headers: supabaseConfig.headers || {} },
  })
}

// Tipos
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
