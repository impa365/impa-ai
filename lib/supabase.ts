// IMPORTANTE: Este arquivo agora usa apenas APIs internas
// NUNCA acessa Supabase diretamente no cliente
// Todas as operações passam pelas APIs do Next.js

import { apiClient } from "./api-client"

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

// AVISO: Estas funções são mantidas apenas para compatibilidade
// TODO: Remover quando todo o código migrar para APIs

// Cliente "fake" que redireciona para APIs
export async function getSupabase() {
  console.warn("⚠️ getSupabase() is deprecated. Use API endpoints instead.")

  // Retorna um objeto que simula o cliente Supabase
  // mas todas as operações passam pelas APIs
  return {
    from: (table: string) => ({
      select: (columns = "*") => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            console.warn(`❌ Direct Supabase access attempted for table: ${table}`)
            console.warn("Use API endpoints instead")
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

// Função para servidor (API routes) - esta SIM pode acessar Supabase diretamente
export function getSupabaseServer() {
  // Esta função só deve ser usada em API routes do servidor
  if (typeof window !== "undefined") {
    throw new Error("getSupabaseServer should only be used in API routes")
  }

  // Importar apenas quando necessário (servidor)
  const { getSupabaseServer: getServerClient } = require("./supabase-config")
  return getServerClient()
}

// Função auxiliar para acessar tabelas via API
export async function getTable(tableName: string) {
  console.warn(`❌ Direct table access attempted for: ${tableName}`)
  console.warn("Use specific API endpoints instead")
  return null
}

// DEPRECATED: Manter compatibilidade com código existente mas redirecionar para APIs
export const supabase = {
  from: async (table: string) => {
    console.warn(`❌ Direct Supabase access attempted for table: ${table}`)
    console.warn("Use API endpoints instead")
    return {
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: { message: "Use API endpoints instead" } }),
        }),
      }),
    }
  },
}

// DEPRECATED: Todas essas funções agora redirecionam para APIs
export const db = {
  // Todas essas funções agora redirecionam para APIs
  users: async () => {
    console.warn("❌ Direct DB access deprecated. Use apiClient.getUsers() instead")
    const result = await apiClient.getAdminDashboard()
    return {
      select: () => ({
        order: () => result.data?.users || [],
      }),
    }
  },
  agents: async () => {
    console.warn("❌ Direct DB access deprecated. Use apiClient.getAgents() instead")
    const result = await apiClient.getAdminDashboard()
    return {
      select: () => ({
        order: () => result.data?.agents || [],
      }),
    }
  },
  whatsappConnections: async () => {
    console.warn("❌ Direct DB access deprecated. Use apiClient.getWhatsAppConnections() instead")
    const result = await apiClient.getAdminDashboard()
    return {
      select: () => ({
        order: () => result.data?.whatsappConnections || [],
      }),
    }
  },
  systemSettings: async () => {
    console.warn("❌ Direct DB access deprecated. Use apiClient.getSystemSettings() instead")
    const result = await apiClient.getAdminDashboard()
    return {
      select: () => ({
        eq: () => ({
          single: async () => ({ data: result.data?.systemLimits }),
        }),
      }),
    }
  },
  // Outros métodos redirecionam para console.warn
  activityLogs: () => console.warn("❌ Use API endpoints instead of direct DB access"),
  userSettings: () => console.warn("❌ Use API endpoints instead of direct DB access"),
  themes: () => console.warn("❌ Use API endpoints instead of direct DB access"),
  integrations: () => console.warn("❌ Use API endpoints instead of direct DB access"),
  vectorStores: () => console.warn("❌ Use API endpoints instead of direct DB access"),
  vectorDocuments: () => console.warn("❌ Use API endpoints instead of direct DB access"),
  apiKeys: () => console.warn("❌ Use API endpoints instead of direct DB access"),
  organizations: () => console.warn("❌ Use API endpoints instead of direct DB access"),
  dailyMetrics: () => console.warn("❌ Use API endpoints instead of direct DB access"),
}
