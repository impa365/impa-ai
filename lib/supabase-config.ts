/**
 * Configuração do Supabase
 * Assume que as variáveis de ambiente NEXT_PUBLIC_* são definidas
 * corretamente durante o build (via ARGs) e podem ser sobrescritas em runtime.
 */

function getEnvVar(varName: string, isSecret = false): string {
  const value = process.env[varName]

  if (typeof window === "undefined") {
    // Lado do servidor ou build
    if (!value) {
      console.error(`[ENV_CONFIG] 🚨 ERRO: Variável de ambiente ${varName} não está definida!`)
      // Em produção, é crucial que estas variáveis estejam definidas.
      if (process.env.NODE_ENV === "production") {
        throw new Error(`ERRO CRÍTICO: Variável de ambiente obrigatória ${varName} não definida.`)
      }
      return "" // Retorna string vazia em dev para não quebrar, mas o erro foi logado.
    }
    console.log(`[ENV_CONFIG] ✅ ${varName}: ${isSecret ? "***OCULTO***" : value}`)
  } else {
    // Lado do cliente
    // No cliente, o valor já foi embutido pelo Next.js durante o build.
    // Se estiver vazio aqui, significa que não foi definido no build.
    if (!value) {
      console.warn(`[CLIENT_ENV_CONFIG] ⚠️ ${varName} não foi definida durante o build e está vazia no cliente.`)
    }
  }
  return value || ""
}

export const supabaseConfig = {
  get url(): string {
    return getEnvVar("NEXT_PUBLIC_SUPABASE_URL")
  },
  get anonKey(): string {
    return getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY", true)
  },
  get serviceRoleKey(): string {
    // Esta é apenas de servidor, não precisa ser NEXT_PUBLIC_
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (typeof window === "undefined" && !key && process.env.NODE_ENV === "production") {
      // console.warn("[ENV_CONFIG] SUPABASE_SERVICE_ROLE_KEY não definida (opcional).")
    }
    return key || ""
  },
  schema: "impaai",
}

// O restante do arquivo (TABLES, restApiUrls, etc.) permanece o mesmo,
// pois eles usarão os getters de supabaseConfig.

// Tabelas do banco de dados
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

// URLs da API REST do Supabase
export const restApiUrls = {
  get base() {
    const url = supabaseConfig.url
    if (!url) throw new Error("Supabase URL não configurada para restApiUrls.base")
    return `${url}/rest/v1`
  },
  get users() {
    const url = supabaseConfig.url
    if (!url) throw new Error("Supabase URL não configurada para restApiUrls.users")
    return `${url}/rest/v1/${TABLES.USER_PROFILES}`
  },
  get agents() {
    const url = supabaseConfig.url
    if (!url) throw new Error("Supabase URL não configurada para restApiUrls.agents")
    return `${url}/rest/v1/${TABLES.AGENTS}`
  },
  get whatsappConnections() {
    const url = supabaseConfig.url
    if (!url) throw new Error("Supabase URL não configurada para restApiUrls.whatsappConnections")
    return `${url}/rest/v1/${TABLES.WHATSAPP_CONNECTIONS}`
  },
  get activityLogs() {
    const url = supabaseConfig.url
    if (!url) throw new Error("Supabase URL não configurada para restApiUrls.activityLogs")
    return `${url}/rest/v1/${TABLES.ACTIVITY_LOGS}`
  },
  get userSettings() {
    const url = supabaseConfig.url
    if (!url) throw new Error("Supabase URL não configurada para restApiUrls.userSettings")
    return `${url}/rest/v1/${TABLES.USER_SETTINGS}`
  },
  get systemSettings() {
    const url = supabaseConfig.url
    if (!url) throw new Error("Supabase URL não configurada para restApiUrls.systemSettings")
    return `${url}/rest/v1/${TABLES.SYSTEM_SETTINGS}`
  },
  get themes() {
    const url = supabaseConfig.url
    if (!url) throw new Error("Supabase URL não configurada para restApiUrls.themes")
    return `${url}/rest/v1/${TABLES.THEMES}`
  },
  get integrations() {
    const url = supabaseConfig.url
    if (!url) throw new Error("Supabase URL não configurada para restApiUrls.integrations")
    return `${url}/rest/v1/${TABLES.INTEGRATIONS}`
  },
  get apiKeys() {
    const url = supabaseConfig.url
    if (!url) throw new Error("Supabase URL não configurada para restApiUrls.apiKeys")
    return `${url}/rest/v1/${TABLES.USER_API_KEYS}`
  },
}

// Headers padrão para requisições
export const getDefaultHeaders = () => {
  const url = supabaseConfig.url
  const anonKey = supabaseConfig.anonKey
  if (!url || !anonKey) {
    throw new Error("Supabase URL ou Anon Key não configurados ao tentar gerar headers.")
  }
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "Accept-Profile": supabaseConfig.schema,
    "Content-Profile": supabaseConfig.schema,
    apikey: anonKey,
  }
}

// Função para validar conexão com Supabase
export async function validateSupabaseConnection() {
  console.log("🔍 Validando conexão com Supabase...")
  const url = supabaseConfig.url // Usa o getter
  const anonKey = supabaseConfig.anonKey // Usa o getter

  if (!url || !anonKey) {
    const errorMsg = `❌ Configurações do Supabase inválidas. URL: '${url}', Key: '${anonKey ? "definida" : "NÃO DEFINIDA"}'. Impossível validar conexão.`
    console.error(errorMsg)
    throw new Error(errorMsg)
  }

  try {
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Accept-Profile": supabaseConfig.schema,
        "Content-Profile": supabaseConfig.schema,
      },
    })

    if (!response.ok) {
      throw new Error(`Erro na conexão: ${response.status} ${response.statusText}. URL: ${url}`)
    }

    console.log("✅ Conexão com Supabase estabelecida com sucesso!")
    return true
  } catch (error) {
    console.error("❌ Erro na conexão com Supabase:", error)
    throw error
  }
}

export async function validateSupabaseTables() {
  console.log("🔍 Validando tabelas do banco...")
  const url = supabaseConfig.url
  const anonKey = supabaseConfig.anonKey

  if (!url || !anonKey) {
    const errorMsg = `❌ Configurações do Supabase inválidas para validar tabelas. URL: '${url}'`
    console.error(errorMsg)
    throw new Error(errorMsg)
  }

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
      console.log(`❌ Tabela ${table}: Erro de conexão`, error.message)
      results.push({ table, status: "error", error: error.message })
    }
  }

  const successCount = results.filter((r) => r.status === "ok").length
  console.log(`📊 Tabelas validadas: ${successCount}/${tablesToCheck.length}`)

  if (successCount === 0 && tablesToCheck.length > 0) {
    throw new Error("Nenhuma tabela principal foi encontrada ou está acessível.")
  }
  return results
}

export type TableName = keyof typeof TABLES
export type TableValue = (typeof TABLES)[TableName]
