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

// ❌ NUNCA usar estas funções no cliente - apenas para compatibilidade
export async function getSupabase() {
  throw new Error("❌ getSupabase() não deve ser usado. Use APIs do Next.js!")
}

// ✅ Função para servidor (API routes) - APENAS no servidor
export function getSupabaseServer() {
  // Verificar se está no servidor
  if (typeof window !== "undefined") {
    throw new Error("❌ getSupabaseServer deve ser usado APENAS em API routes do servidor!")
  }

  // Importar apenas quando necessário (servidor)
  const { getSupabaseServer: getServerClient } = require("./supabase-config")
  return getServerClient()
}

// ❌ DEPRECATED - Não usar
export async function getTable(tableName: string) {
  throw new Error(`❌ Acesso direto à tabela ${tableName} não permitido. Use APIs!`)
}

// ❌ DEPRECATED - Todas essas funções são inseguras no cliente
export const supabase = {
  from: () => {
    throw new Error("❌ Acesso direto ao Supabase não permitido no cliente!")
  },
}

export const db = {
  users: () => {
    throw new Error("❌ Use apiClient.getUsers() em vez de acesso direto ao DB!")
  },
  agents: () => {
    throw new Error("❌ Use apiClient.getAgents() em vez de acesso direto ao DB!")
  },
  whatsappConnections: () => {
    throw new Error("❌ Use apiClient.getWhatsAppConnections() em vez de acesso direto ao DB!")
  },
  systemSettings: () => {
    throw new Error("❌ Use apiClient.getSystemSettings() em vez de acesso direto ao DB!")
  },
  activityLogs: () => {
    throw new Error("❌ Use APIs em vez de acesso direto ao DB!")
  },
  userSettings: () => {
    throw new Error("❌ Use APIs em vez de acesso direto ao DB!")
  },
  themes: () => {
    throw new Error("❌ Use APIs em vez de acesso direto ao DB!")
  },
  integrations: () => {
    throw new Error("❌ Use APIs em vez de acesso direto ao DB!")
  },
  vectorStores: () => {
    throw new Error("❌ Use APIs em vez de acesso direto ao DB!")
  },
  vectorDocuments: () => {
    throw new Error("❌ Use APIs em vez de acesso direto ao DB!")
  },
  apiKeys: () => {
    throw new Error("❌ Use APIs em vez de acesso direto ao DB!")
  },
  organizations: () => {
    throw new Error("❌ Use APIs em vez de acesso direto ao DB!")
  },
  dailyMetrics: () => {
    throw new Error("❌ Use APIs em vez de acesso direto ao DB!")
  },
}
