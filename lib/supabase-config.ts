// Função auxiliar para obter a configuração correta
function getConfigValue(key: string, placeholder: string): string {
  // LADO DO SERVIDOR: Sempre usa process.env
  if (typeof window === "undefined") {
    const serverValue = process.env[key]
    if (!serverValue || serverValue === placeholder) {
      // Durante o build, é normal ter placeholders. Em runtime no servidor, não.
      if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
        console.warn(
          `[Servidor] ⚠️ ${key} está usando placeholder ou não definida: "${serverValue}". Esperado valor de runtime.`,
        )
      }
    }
    return serverValue || placeholder
  }

  // LADO DO CLIENTE:
  // @ts-ignore
  const runtimeConfig = window.__RUNTIME_CONFIG__
  if (runtimeConfig && typeof runtimeConfig === "object" && runtimeConfig[key]) {
    const clientRuntimeValue = runtimeConfig[key]
    if (clientRuntimeValue && clientRuntimeValue !== placeholder) {
      // console.log(`[Cliente] ✅ ${key} carregada de window.__RUNTIME_CONFIG__: "${clientRuntimeValue}"`);
      return clientRuntimeValue
    } else {
      console.warn(`[Cliente] ⚠️ ${key} em window.__RUNTIME_CONFIG__ é placeholder ou inválida: "${clientRuntimeValue}"`)
    }
  } else {
    // console.warn(`[Cliente] ℹ️ window.__RUNTIME_CONFIG__ ou ${key} não encontrado. Tentando fallback.`);
  }

  // Fallback para process.env (valores congelados do build) no cliente
  const buildTimeValue = process.env[key]
  if (!buildTimeValue || buildTimeValue === placeholder) {
    console.error(
      `[Cliente] ❌ ${key} está usando placeholder do build: "${buildTimeValue}". A injeção de runtime falhou ou não foi configurada corretamente na stack.`,
    )
  } else {
    // console.log(`[Cliente] ℹ️ ${key} usando valor do build (process.env): "${buildTimeValue}"`);
  }
  return buildTimeValue || placeholder
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
    // console.log("🔍 Validando conexão com Supabase (validateSupabaseConnection)...");
    const url = supabaseConfig.url // Isso vai triggar os getters com os logs
    const anonKey = supabaseConfig.anonKey

    if (url.includes("placeholder") || anonKey.includes("placeholder")) {
      throw new Error(`Conexão falhou: URL ou Anon Key são placeholders. URL: ${url}`)
    }

    const response = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    })
    if (!response.ok) {
      throw new Error(`Erro na conexão HTTP: ${response.status} ${response.statusText}`)
    }
    // console.log("✅ Conexão com Supabase (validateSupabaseConnection) estabelecida com sucesso!");
    return true
  } catch (error) {
    console.error("❌ Erro em validateSupabaseConnection:", error)
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
