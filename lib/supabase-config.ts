// Função auxiliar para obter a configuração correta
function getConfigValue(key: string, placeholder: string): string {
  // No lado do servidor, sempre usa process.env
  if (typeof window === "undefined") {
    const value = process.env[key]
    if (!value || value === placeholder) {
      console.error(`❌ ERRO CRÍTICO: ${key} não está configurada ou está usando placeholder!`)
      console.error(`Valor recebido: "${value}"`)
      console.error(`Placeholder: "${placeholder}"`)
      throw new Error(`${key} não está configurada corretamente`)
    }
    return value
  }

  // No lado do cliente, tenta window.__RUNTIME_CONFIG__ primeiro
  // @ts-ignore A propriedade __RUNTIME_CONFIG__ é injetada via script
  if (window.__RUNTIME_CONFIG__ && window.__RUNTIME_CONFIG__[key]) {
    // @ts-ignore
    const value = window.__RUNTIME_CONFIG__[key]
    if (value && value !== placeholder) {
      return value
    }
  }

  // Fallback para process.env (valores do build)
  const fallbackValue = process.env[key] || placeholder
  if (fallbackValue === placeholder) {
    console.warn(`⚠️ ${key} está usando placeholder no cliente`)
  }
  return fallbackValue
}

export const supabaseConfig = {
  get url() {
    return getConfigValue("NEXT_PUBLIC_SUPABASE_URL", "https://placeholder.supabase.co")
  },

  get anonKey() {
    return getConfigValue("NEXT_PUBLIC_SUPABASE_ANON_KEY", "placeholder-anon-key")
  },

  get serviceRoleKey() {
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

// Função para validar conexão com Supabase
export async function validateSupabaseConnection() {
  try {
    console.log("🔍 Validando conexão com Supabase...")

    const url = supabaseConfig.url
    const anonKey = supabaseConfig.anonKey

    console.log(`📍 URL: ${url}`)
    console.log(`🔑 Anon Key: ${anonKey ? "***definida***" : "❌ NÃO DEFINIDA"}`)

    // Testa conexão básica
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Accept-Profile": supabaseConfig.schema,
        "Content-Profile": supabaseConfig.schema,
      },
    })

    if (!response.ok) {
      throw new Error(`Erro na conexão: ${response.status} ${response.statusText}`)
    }

    console.log("✅ Conexão com Supabase estabelecida com sucesso!")
    return true
  } catch (error) {
    console.error("❌ Erro na conexão com Supabase:", error)
    throw error
  }
}

// Função para validar tabelas específicas
export async function validateSupabaseTables() {
  try {
    console.log("🔍 Validando tabelas do banco...")

    const tablesToCheck = [TABLES.USER_PROFILES, TABLES.AGENTS, TABLES.SYSTEM_SETTINGS]
    const results = []

    for (const table of tablesToCheck) {
      try {
        const response = await fetch(`${restApiUrls.base}/${table}?limit=1`, {
          headers: getDefaultHeaders(),
        })

        if (response.ok) {
          console.log(`✅ Tabela ${table}: OK`)
          results.push({ table, status: "ok" })
        } else {
          console.log(`❌ Tabela ${table}: Erro ${response.status}`)
          results.push({ table, status: "error", error: response.status })
        }
      } catch (error) {
        console.log(`❌ Tabela ${table}: Erro de conexão`)
        results.push({ table, status: "error", error: error.message })
      }
    }

    const successCount = results.filter((r) => r.status === "ok").length
    console.log(`📊 Tabelas validadas: ${successCount}/${tablesToCheck.length}`)

    if (successCount === 0) {
      throw new Error("Nenhuma tabela foi encontrada ou está acessível")
    }

    return results
  } catch (error) {
    console.error("❌ Erro na validação das tabelas:", error)
    throw error
  }
}

export function validateSupabaseConfig() {
  try {
    const url = supabaseConfig.url
    const anonKey = supabaseConfig.anonKey

    console.log("✅ Configuração do Supabase validada com sucesso")
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
