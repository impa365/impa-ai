// IMPORTANTE: Este arquivo agora usa apenas APIs internas
// NUNCA acessa Supabase diretamente no cliente
// Todas as operações passam pelas APIs do Next.js

import { apiClient } from "./api-client"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { supabaseConfig } from "./supabase-config"

const clientInstance: SupabaseClient | null = null
let serverClientInstance: SupabaseClient | null = null

// Para compatibilidade com código existente, mantemos as interfaces
export interface UserProfile {
  id: string
  full_name: string | null
  email: string
  role: "user" | "admin" | "moderator"
  status: "active" | "inactive" | "suspended" | "hibernated"
  organization_id?: string | null
  last_login_at?: string | null
  created_at: string
  updated_at: string
  api_key?: string
  avatar_url?: string
  theme_settings?: any
  preferences?: any
}

// Cliente "fake" que redireciona para APIs
export async function getSupabase() {
  // Retorna um objeto que simula o cliente Supabase
  // mas todas as operações passam pelas APIs
  return {
    from: (table: string) => ({
      select: (columns = "*") => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            // Redirecionar para API apropriada baseada na tabela
            console.warn(`Direct Supabase access attempted for table: ${table}`)
            console.warn("This should be replaced with proper API calls")
            return { data: null, error: { message: "Use API endpoints instead" } }
          },
        }),
      }),
    }),
    auth: {
      getUser: async () => {
        const result = await apiClient.getCurrentUser()
        return {
          data: { user: result.data?.user || null },
          error: result.error ? { message: result.error } : null,
        }
      },
    },
  }
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

// Manter compatibilidade com código existente
export const supabase = {
  from: async (table: string) => {
    const client = await getSupabase()
    return client.from(table)
  },
}

export const db = {
  // Todas essas funções agora devem usar APIs
  users: () => console.warn("Use API endpoints instead of direct DB access"),
  agents: () => console.warn("Use API endpoints instead of direct DB access"),
  whatsappConnections: () => console.warn("Use API endpoints instead of direct DB access"),
  activityLogs: () => console.warn("Use API endpoints instead of direct DB access"),
  userSettings: () => console.warn("Use API endpoints instead of direct DB access"),
  systemSettings: () => console.warn("Use API endpoints instead of direct DB access"),
  themes: () => console.warn("Use API endpoints instead of direct DB access"),
  integrations: () => console.warn("Use API endpoints instead of direct DB access"),
  vectorStores: () => console.warn("Use API endpoints instead of direct DB access"),
  vectorDocuments: () => console.warn("Use API endpoints instead of direct DB access"),
  apiKeys: () => console.warn("Use API endpoints instead of direct DB access"),
  organizations: () => console.warn("Use API endpoints instead of direct DB access"),
  dailyMetrics: () => console.warn("Use API endpoints instead of direct DB access"),
  rpc: supabase.rpc,
}

// Função para servidor (API routes) - esta SIM pode acessar Supabase diretamente
export function getSupabaseServer() {
  const { createClient } = require("@supabase/supabase-js")

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase configuration missing on server")
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    db: { schema: "impaai" },
  })
}
