// Configurações centralizadas do Supabase
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://supa.impa365.com"
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0.cVmHXTXMMB09PuXEMevVuGxV5_ZR4yJly6pF0uab7fA"
export const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
export const SCHEMA_NAME = "impaai"

// Lista de tabelas disponíveis no schema impaai
export const TABLES = {
  USER_PROFILES: "user_profiles",
  AI_AGENTS: "ai_agents",
  WHATSAPP_CONNECTIONS: "whatsapp_connections",
  AGENT_ACTIVITY_LOGS: "agent_activity_logs",
  USER_SETTINGS: "user_settings",
  SYSTEM_SETTINGS: "system_settings",
  SYSTEM_THEMES: "system_themes",
  INTEGRATIONS: "integrations",
  VECTOR_STORES: "vector_stores",
  VECTOR_DOCUMENTS: "vector_documents",
  API_KEYS: "api_keys",
  ORGANIZATIONS: "organizations",
}
