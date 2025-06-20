// Interfaces para compatibilidade
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

// TODAS essas funções redirecionam para APIs SEGURAS
export async function getSupabase() {
  throw new Error("❌ getSupabase() is deprecated. Use API endpoints instead.")
}

export function getSupabaseServer() {
  // Esta função só deve ser usada em API routes do servidor
  if (typeof window !== "undefined") {
    throw new Error("❌ getSupabaseServer should only be used in API routes")
  }

  // Importar apenas quando necessário (servidor)
  const { getSupabaseServer: getServerClient } = require("./supabase-config")
  return getServerClient()
}

// DEPRECATED: Todas essas funções redirecionam para APIs
export const supabase = {
  from: () => {
    throw new Error("❌ Direct Supabase access is deprecated. Use API endpoints instead.")
  },
}

export const db = {
  users: () => {
    throw new Error("❌ Direct DB access deprecated. Use apiClient.getUsers() instead")
  },
  agents: () => {
    throw new Error("❌ Direct DB access deprecated. Use apiClient.getAgents() instead")
  },
  whatsappConnections: () => {
    throw new Error("❌ Direct DB access deprecated. Use apiClient.getWhatsAppConnections() instead")
  },
  systemSettings: () => {
    throw new Error("❌ Direct DB access deprecated. Use apiClient.getSystemSettings() instead")
  },
  activityLogs: () => {
    throw new Error("❌ Use API endpoints instead of direct DB access")
  },
  userSettings: () => {
    throw new Error("❌ Use API endpoints instead of direct DB access")
  },
  themes: () => {
    throw new Error("❌ Use API endpoints instead of direct DB access")
  },
  integrations: () => {
    throw new Error("❌ Use API endpoints instead of direct DB access")
  },
  vectorStores: () => {
    throw new Error("❌ Use API endpoints instead of direct DB access")
  },
  vectorDocuments: () => {
    throw new Error("❌ Use API endpoints instead of direct DB access")
  },
  apiKeys: () => {
    throw new Error("❌ Use API endpoints instead of direct DB access")
  },
  organizations: () => {
    throw new Error("❌ Use API endpoints instead of direct DB access")
  },
  dailyMetrics: () => {
    throw new Error("❌ Use API endpoints instead of direct DB access")
  },
}
