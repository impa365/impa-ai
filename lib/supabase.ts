// lib/supabase.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

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
      db: { schema: "impaai" },
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
    db: { schema: "impaai" },
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
  users: async () => {
    const client = await getSupabase()
    return client.from("user_profiles")
  },
  agents: async () => {
    const client = await getSupabase()
    return client.from("ai_agents")
  },
  whatsappConnections: async () => {
    const client = await getSupabase()
    return client.from("whatsapp_connections")
  },
  activityLogs: async () => {
    const client = await getSupabase()
    return client.from("agent_activity_logs")
  },
  userSettings: async () => {
    const client = await getSupabase()
    return client.from("user_settings")
  },
  systemSettings: async () => {
    const client = await getSupabase()
    return client.from("system_settings")
  },
  themes: async () => {
    const client = await getSupabase()
    return client.from("system_themes")
  },
  integrations: async () => {
    const client = await getSupabase()
    return client.from("integrations")
  },
  vectorStores: async () => {
    const client = await getSupabase()
    return client.from("vector_stores")
  },
  vectorDocuments: async () => {
    const client = await getSupabase()
    return client.from("vector_documents")
  },
  userApiKeys: async () => {
    const client = await getSupabase()
    return client.from("user_api_keys")
  },
  organizations: async () => {
    const client = await getSupabase()
    return client.from("organizations")
  },
  dailyMetrics: async () => {
    const client = await getSupabase()
    return client.from("daily_metrics")
  },
  rpc: supabase.rpc,
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
