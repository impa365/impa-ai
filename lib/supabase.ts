import { createClient } from "@supabase/supabase-js"

// Configurações do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://supa.impa365.com"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0.cVmHXTXMMB09PuXEMevVuGxV5_ZR4yJly6pF0uab7fA"
const schemaName = "impaai"

// Criar cliente Supabase com headers para o schema correto
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: schemaName,
  },
  global: {
    headers: {
      "Accept-Profile": schemaName,
      "Content-Profile": schemaName,
    },
  },
})

// Função para acessar qualquer tabela no schema correto
export function getTable(tableName: string) {
  return supabase.from(tableName)
}

// Funções específicas para cada tabela
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
  apiKeys: () => getTable("api_keys"),
  organizations: () => getTable("organizations"),
}

export default supabase
