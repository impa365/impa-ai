import { createClient } from "@supabase/supabase-js"
import { supabaseConfig, defaultHeaders, restApiUrls } from "./supabase-config"

// Cliente Supabase com configurações corretas
export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
  db: {
    schema: supabaseConfig.schema,
  },
  global: {
    headers: supabaseConfig.headers,
  },
})

// Cliente para operações administrativas
export const supabaseAdmin = createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey, {
  db: {
    schema: supabaseConfig.schema,
  },
  global: {
    headers: supabaseConfig.headers,
  },
})

// Interface para filtros REST
interface RestFilters {
  [key: string]: any
}

interface RestOptions {
  select?: string
  filters?: RestFilters
  limit?: number
  offset?: number
  order?: string
}

// Função genérica para fazer requisições REST
async function fetchRest(endpoint: string, options: RestOptions = {}) {
  const { select = "*", filters = {}, limit, offset, order } = options

  let url = `${endpoint}?select=${select}`

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

  // Adicionar order
  if (order) {
    url += `&order=${order}`
  }

  const response = await fetch(url, {
    headers: defaultHeaders,
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
  apiKeys: () => supabase.from("user_api_keys"),

  // Função REST genérica
  fetchRest: (table: string, options?: RestOptions) => {
    const endpoint = `${restApiUrls.base}/${table}`
    return fetchRest(endpoint, options)
  },
}

// Exportar cliente padrão
export default supabase
