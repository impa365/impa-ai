// Função auxiliar para obter a configuração correta
function getConfigValue(key: string, placeholder: string): string {
  // No lado do servidor, sempre usa process.env
  if (typeof window === "undefined") {
    return process.env[key] || placeholder
  }

  // No lado do cliente, tenta window.__RUNTIME_CONFIG__ primeiro
  // @ts-ignore A propriedade __RUNTIME_CONFIG__ é injetada via script
  if (window.__RUNTIME_CONFIG__ && window.__RUNTIME_CONFIG__[key]) {
    // @ts-ignore
    return window.__RUNTIME_CONFIG__[key]
  }

  // Fallback para process.env (valores do build) se window.__RUNTIME_CONFIG__ não estiver disponível
  // Isso é útil para desenvolvimento local fora do Docker
  return process.env[key] || placeholder
}

export const supabaseConfig = {
  get url() {
    const url = getConfigValue("NEXT_PUBLIC_SUPABASE_URL", "https://placeholder.supabase.co")
    if (url === "https://placeholder.supabase.co" && typeof window !== "undefined") {
      console.warn("⚠️ Supabase URL está usando placeholder no cliente. Verifique a injeção de runtime config.")
    }
    return url
  },

  get anonKey() {
    const key = getConfigValue("NEXT_PUBLIC_SUPABASE_ANON_KEY", "placeholder-anon-key")
    if (key === "placeholder-anon-key" && typeof window !== "undefined") {
      console.warn("⚠️ Supabase Anon Key está usando placeholder no cliente. Verifique a injeção de runtime config.")
    }
    return key
  },

  get serviceRoleKey() {
    // Service role key é usada apenas no servidor, então process.env é seguro
    return process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  },

  schema: "impaai",

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

export const getDefaultHeaders = () => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  "Accept-Profile": supabaseConfig.schema,
  "Content-Profile": supabaseConfig.schema,
  apikey: supabaseConfig.anonKey,
})

export function validateSupabaseConfig() {
  try {
    const url = supabaseConfig.url
    const anonKey = supabaseConfig.anonKey

    if (url.includes("placeholder") || anonKey.includes("placeholder")) {
      // Não lançar erro, apenas logar, pois pode ser build time ou cliente ainda não carregou
      console.warn("⚠️ Configuração do Supabase está usando valores placeholder.")
      if (typeof window !== "undefined") {
        // @ts-ignore
        console.log("Cliente: window.__RUNTIME_CONFIG__:", window.__RUNTIME_CONFIG__)
      }
      return false // Indica que a validação falhou ou está incompleta
    }

    console.log("✅ Configuração do Supabase validada com sucesso (runtime)")
    console.log(`📍 URL: ${new URL(url).hostname}`)
    console.log(`🔑 Anon Key: ${anonKey ? "***definida***" : "Não definida"}`)
    return true
  } catch (error) {
    console.error("❌ Erro na validação da configuração do Supabase:", error)
    return false
  }
}

export type TableName = keyof typeof TABLES
export type TableValue = (typeof TABLES)[TableName]
