import { createClient } from "@supabase/supabase-js"
import { SUPABASE_CONFIG } from "./supabase-config"

// Cliente Supabase com configuração centralizada
export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
  db: {
    schema: SUPABASE_CONFIG.schema,
  },
  global: {
    headers: {
      "Accept-Profile": SUPABASE_CONFIG.schema,
    },
  },
})

// Função para fazer requisições REST diretas
export async function fetchRest(
  table: string,
  options: {
    select?: string
    filters?: Record<string, any>
    limit?: number
    offset?: number
    order?: { column: string; ascending?: boolean }
  } = {},
) {
  const { select = "*", filters = {}, limit, offset, order } = options

  let url = `${SUPABASE_CONFIG.url}/rest/v1/${table}?select=${select}`

  // Adicionar filtros
  Object.entries(filters).forEach(([key, value]) => {
    url += `&${key}=eq.${value}`
  })

  // Adicionar limit
  if (limit) {
    url += `&limit=${limit}`
  }

  // Adicionar offset
  if (offset) {
    url += `&offset=${offset}`
  }

  // Adicionar ordenação
  if (order) {
    url += `&order=${order.column}.${order.ascending !== false ? "asc" : "desc"}`
  }

  const response = await fetch(url, {
    headers: {
      "Accept-Profile": SUPABASE_CONFIG.schema,
      "Content-Profile": SUPABASE_CONFIG.schema,
      apikey: SUPABASE_CONFIG.anonKey,
      Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

// Funções de acesso às tabelas com schema correto
export const db = {
  // Usuários
  users: () => supabase.from("user_profiles"),

  // Agentes
  agents: () => supabase.from("agents"),

  // Conexões WhatsApp
  whatsappConnections: () => supabase.from("whatsapp_connections"),

  // Logs de atividade
  activityLogs: () => supabase.from("activity_logs"),

  // Configurações do usuário
  userSettings: () => supabase.from("user_settings"),

  // Configurações do sistema
  systemSettings: () => supabase.from("system_settings"),

  // Temas
  themes: () => supabase.from("themes"),

  // Integrações
  integrations: () => supabase.from("integrations"),

  // Chaves de API
  apiKeys: () => supabase.from("api_keys"),

  // Vector Stores
  vectorStores: () => supabase.from("vector_stores"),

  // Função REST genérica
  fetchRest,
}
