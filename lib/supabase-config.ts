// Função para obter variáveis de ambiente em runtime
function getRuntimeEnv(key: string): string {
  // No servidor, usa process.env
  if (typeof window === "undefined") {
    return process.env[key] || ""
  }

  // No cliente, usa window.__RUNTIME_ENV__ se disponível, senão usa process.env
  const runtimeEnv = (window as any).__RUNTIME_ENV__
  if (runtimeEnv && runtimeEnv[key]) {
    return runtimeEnv[key]
  }

  // Fallback para process.env (valores do build)
  return (process.env as any)[key] || ""
}

// Configurações centralizadas do Supabase
export const supabaseConfig = {
  get url() {
    const url = getRuntimeEnv("NEXT_PUBLIC_SUPABASE_URL")
    if (!url || url.includes("placeholder")) {
      console.warn("⚠️ NEXT_PUBLIC_SUPABASE_URL não está configurada corretamente")
      return "https://placeholder.supabase.co"
    }
    return url
  },

  get anonKey() {
    const key = getRuntimeEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    if (!key || key.includes("placeholder")) {
      console.warn("⚠️ NEXT_PUBLIC_SUPABASE_ANON_KEY não está configurada corretamente")
      return "placeholder-anon-key"
    }
    return key
  },

  get serviceRoleKey() {
    return process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  },

  schema: "impaai",

  // Configurações padrão
  defaultConfig: {
    db: { schema: "impaai" },
    auth: {
      persistSession: typeof window !== "undefined",
      autoRefreshToken: typeof window !== "undefined",
    },
    global: {
      headers: {
        "Accept-Profile": "impaai",
        "Content-Profile": "impaai",
      },
    },
  },
}

// Nomes das tabelas do banco de dados
export const TABLES = {
  USER_PROFILES: "user_profiles",
  AGENTS: "agents",
  WHATSAPP_CONNECTIONS: "whatsapp_connections",
  ACTIVITY_LOGS: "activity_logs",
  USER_SETTINGS: "user_settings",
  SYSTEM_SETTINGS: "system_settings",
  THEMES: "themes",
  INTEGRATIONS: "integrations",
  USER_API_KEYS: "user_api_keys",
  AGENT_LOGS: "agent_logs",
  AGENT_STATS: "agent_stats",
  WHATSAPP_INSTANCES: "whatsapp_instances",
  WHATSAPP_MESSAGES: "whatsapp_messages",
  USER_SESSIONS: "user_sessions",
  SYSTEM_LOGS: "system_logs",
} as const

// URLs das APIs REST (usando getters para serem dinâmicas)
export const restApiUrls = {
  get base() {
    return `${supabaseConfig.url}/rest/v1`
  },
  get users() {
    return `${supabaseConfig.url}/rest/v1/${TABLES.USER_PROFILES}`
  },
  get agents() {
    return `${supabaseConfig.url}/rest/v1/${TABLES.AGENTS}`
  },
  get whatsappConnections() {
    return `${supabaseConfig.url}/rest/v1/${TABLES.WHATSAPP_CONNECTIONS}`
  },
  get activityLogs() {
    return `${supabaseConfig.url}/rest/v1/${TABLES.ACTIVITY_LOGS}`
  },
  get userSettings() {
    return `${supabaseConfig.url}/rest/v1/${TABLES.USER_SETTINGS}`
  },
  get systemSettings() {
    return `${supabaseConfig.url}/rest/v1/${TABLES.SYSTEM_SETTINGS}`
  },
  get themes() {
    return `${supabaseConfig.url}/rest/v1/${TABLES.THEMES}`
  },
  get integrations() {
    return `${supabaseConfig.url}/rest/v1/${TABLES.INTEGRATIONS}`
  },
  get apiKeys() {
    return `${supabaseConfig.url}/rest/v1/${TABLES.USER_API_KEYS}`
  },
}

// Headers padrão para requisições REST (usando getter para ser dinâmico)
export const getDefaultHeaders = () => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  "Accept-Profile": supabaseConfig.schema,
  "Content-Profile": supabaseConfig.schema,
  apikey: supabaseConfig.anonKey,
})

// Função para validar se todas as variáveis necessárias estão definidas
export function validateSupabaseConfig() {
  try {
    const url = supabaseConfig.url
    const anonKey = supabaseConfig.anonKey

    // Não validar durante o build
    if (typeof window === "undefined" && (url.includes("placeholder") || anonKey.includes("placeholder"))) {
      console.log("⚠️ Usando configuração placeholder durante o build")
      return true
    }

    console.log("✅ Configuração do Supabase validada com sucesso")
    console.log(`📍 URL: ${new URL(url).hostname}`)
    console.log(`🔑 Anon Key: ${anonKey ? "Definida" : "Não definida"}`)

    return true
  } catch (error) {
    console.error("❌ Erro na configuração do Supabase:", error)
    return false
  }
}

// Tipos para TypeScript
export type TableName = keyof typeof TABLES
export type TableValue = (typeof TABLES)[TableName]
