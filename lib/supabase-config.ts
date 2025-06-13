/**
 * Configuração do Supabase para o SERVIDOR.
 * Lê diretamente das variáveis de ambiente de runtime.
 * O cliente obterá a configuração via RuntimeConfigProvider -> /api/config.
 */

function getRequiredServerEnvVar(envVarName: string, isSecret = false): string {
  const value = process.env[envVarName]

  if (typeof window !== "undefined") {
    // Esta função é apenas para o servidor.
    throw new Error(`[ENV_CONFIG_SERVER] Tentativa de ler variável de servidor (${envVarName}) no cliente.`)
  }

  if (!value) {
    console.error(`[ENV_CONFIG_SERVER] 🚨 ERRO: Variável de ambiente de servidor ${envVarName} não está definida!`)
    // Em produção, é crucial que estas variáveis estejam definidas.
    if (process.env.NODE_ENV === "production") {
      throw new Error(`ERRO CRÍTICO: Variável de ambiente de servidor obrigatória ${envVarName} não definida.`)
    }
    return "" // Retorna string vazia em dev para não quebrar, mas o erro foi logado.
  }

  console.log(`[ENV_CONFIG_SERVER] ✅ ${envVarName}: ${isSecret ? "***OCULTO***" : value}`)
  return value
}

export const supabaseConfig = {
  // Estes são para o SERVIDOR. O cliente usará /api/config.
  get url(): string {
    // No servidor, podemos usar NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_URL
    // Dando prioridade a SUPABASE_URL se existir, caso contrário NEXT_PUBLIC_SUPABASE_URL
    return process.env.SUPABASE_URL || getRequiredServerEnvVar("NEXT_PUBLIC_SUPABASE_URL")
  },
  get anonKey(): string {
    return process.env.SUPABASE_ANON_KEY || getRequiredServerEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY", true)
  },
  get serviceRoleKey(): string {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!key && typeof window === "undefined" && process.env.NODE_ENV === "production") {
      // console.warn("[ENV_CONFIG_SERVER] SUPABASE_SERVICE_ROLE_KEY não definida (opcional).")
    }
    return key || ""
  },
  schema: "impaai",
}

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

// URLs da API REST do Supabase (usado pelo servidor)
export const restApiUrls = {
  get base() {
    if (!supabaseConfig.url) throw new Error("Supabase URL (servidor) não configurada para restApiUrls.base")
    return `${supabaseConfig.url}/rest/v1`
  },
  get users() {
    if (!supabaseConfig.url) throw new Error("Supabase URL (servidor) não configurada para restApiUrls.users")
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

// Headers padrão para requisições (usado pelo servidor)
export const getDefaultHeaders = () => {
  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    throw new Error("Supabase URL ou Anon Key (servidor) não configurados ao tentar gerar headers.")
  }
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "Accept-Profile": supabaseConfig.schema,
    "Content-Profile": supabaseConfig.schema,
    apikey: supabaseConfig.anonKey,
  }
}

// Funções de validação permanecem úteis para o servidor
export async function validateSupabaseConnection() {
  // ... (lógica de validação, pode precisar de ajuste se chamada no startup)
  console.log("🔍 Validando conexão com Supabase (servidor)...")
  const url = supabaseConfig.url
  const anonKey = supabaseConfig.anonKey

  if (!url || !anonKey) {
    const errorMsg = `❌ Configurações do Supabase (servidor) inválidas. URL: '${url}', Key: '${anonKey ? "definida" : "NÃO DEFINIDA"}'.`
    console.error(errorMsg)
    throw new Error(errorMsg)
  }
  // ... (resto da lógica de fetch)
  try {
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Accept-Profile": supabaseConfig.schema,
        "Content-Profile": supabaseConfig.schema,
      },
    })
    if (!response.ok) throw new Error(`Erro na conexão: ${response.status} ${response.statusText}. URL: ${url}`)
    console.log("✅ Conexão com Supabase (servidor) estabelecida com sucesso!")
    return true
  } catch (error) {
    console.error("❌ Erro na conexão com Supabase (servidor):", error)
    throw error
  }
}

export async function validateSupabaseTables() {
  // ... (lógica de validação de tabelas para o servidor)
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
