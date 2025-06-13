// Sistema de logs para debug das variáveis
function logEnvDebug(context: string, key: string, value: string | undefined) {
  const isPlaceholder = value?.includes("placeholder") || value === "placeholder-anon-key"
  const status = !value ? "❌ UNDEFINED" : isPlaceholder ? "⚠️ PLACEHOLDER" : "✅ VALID"

  console.log(`[${context}] ${status} ${key}: ${value ? (key.includes("KEY") ? "***HIDDEN***" : value) : "undefined"}`)

  return { value, isValid: !isPlaceholder && !!value }
}

// Função auxiliar para obter a configuração correta
function getConfigValue(key: string, placeholder: string): string {
  const context = typeof window === "undefined" ? "SERVER" : "CLIENT"

  // No lado do servidor, sempre usa process.env
  if (typeof window === "undefined") {
    const serverValue = process.env[key]
    const debug = logEnvDebug("SERVER", key, serverValue)

    if (!debug.isValid) {
      console.error(`🚨 ERRO CRÍTICO [SERVER]: ${key} não está configurada corretamente!`)
      console.error(`   Valor recebido: "${serverValue}"`)
      console.error(`   Esperado: URL válida do Supabase (não placeholder)`)

      if (process.env.NODE_ENV === "production") {
        throw new Error(`${key} não está configurada corretamente no ambiente de produção`)
      }
    }

    return serverValue || placeholder
  }

  // No lado do cliente, tenta window.__RUNTIME_CONFIG__ primeiro
  // @ts-ignore A propriedade __RUNTIME_CONFIG__ é injetada via script
  if (window.__RUNTIME_CONFIG__ && window.__RUNTIME_CONFIG__[key]) {
    // @ts-ignore
    const runtimeValue = window.__RUNTIME_CONFIG__[key]
    const debug = logEnvDebug("CLIENT-RUNTIME", key, runtimeValue)

    if (debug.isValid) {
      return runtimeValue
    }
  }

  // Fallback para process.env (valores do build)
  const buildValue = process.env[key]
  const debug = logEnvDebug("CLIENT-BUILD", key, buildValue)

  if (!debug.isValid) {
    console.error(`🚨 ERRO CRÍTICO [CLIENT]: ${key} não foi carregada corretamente!`)
    console.error(`   Runtime config: ${window.__RUNTIME_CONFIG__ ? "Existe" : "Não existe"}`)
    console.error(`   Build value: "${buildValue}"`)
    console.error(`   Isso indica que as variáveis do Portainer não estão chegando ao cliente`)
  }

  return buildValue || placeholder
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

export async function validateSupabaseConnection() {
  try {
    console.log("🔍 Validando conexão com Supabase...")

    const url = supabaseConfig.url
    const anonKey = supabaseConfig.anonKey

    if (url.includes("placeholder") || anonKey.includes("placeholder")) {
      throw new Error(`Conexão falhou: URL ou Anon Key são placeholders. URL: ${url}`)
    }

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
