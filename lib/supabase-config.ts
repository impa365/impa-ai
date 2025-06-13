// Configurações centralizadas do Supabase
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  schema: "impaai",
  headers: {
    "Accept-Profile": "impaai",
    "Content-Profile": "impaai",
  },
}

// URLs das APIs REST
export const restApiUrls = {
  base: `${supabaseConfig.url}/rest/v1`,
  users: `${supabaseConfig.url}/rest/v1/user_profiles`,
  agents: `${supabaseConfig.url}/rest/v1/agents`,
  whatsappConnections: `${supabaseConfig.url}/rest/v1/whatsapp_connections`,
  activityLogs: `${supabaseConfig.url}/rest/v1/activity_logs`,
  userSettings: `${supabaseConfig.url}/rest/v1/user_settings`,
  systemSettings: `${supabaseConfig.url}/rest/v1/system_settings`,
  themes: `${supabaseConfig.url}/rest/v1/themes`,
  integrations: `${supabaseConfig.url}/rest/v1/integrations`,
  apiKeys: `${supabaseConfig.url}/rest/v1/user_api_keys`,
}

// Headers padrão para requisições REST
export const defaultHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json",
  "Accept-Profile": supabaseConfig.schema,
  "Content-Profile": supabaseConfig.schema,
  apikey: supabaseConfig.anonKey,
}
