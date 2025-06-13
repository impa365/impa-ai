/**
 * Configuração do Supabase
 * Prioriza variáveis de ambiente de runtime.
 * Alerta se estiver usando placeholders do build.
 */

const PLACEHOLDER_URL = "http://placeholder-build.supabase.co"
const PLACEHOLDER_KEY = "placeholder-build-anon-key"

function getSupabaseEnvVar(envVarName: string, buildTimePlaceholder: string): string {
  const runtimeValue = process.env[envVarName]

  if (typeof window === "undefined") {
    // Lógica do lado do servidor / build / startup
    if (runtimeValue && runtimeValue !== buildTimePlaceholder) {
      console.log(
        `[ENV_CONFIG] ✅ Usando ${envVarName} de runtime: ${envVarName.includes("KEY") ? "***OCULTO***" : runtimeValue}`,
      )
      return runtimeValue
    } else if (runtimeValue === buildTimePlaceholder) {
      // Isso pode acontecer se o Portainer não injetar a variável, e o valor do build "vazar" para o runtime.
      console.warn(
        `[ENV_CONFIG] ⚠️ ATENÇÃO: ${envVarName} está usando o valor placeholder do BUILD ('${buildTimePlaceholder}').`,
      )
      console.warn(`   Verifique se a variável está corretamente definida no seu ambiente de runtime (Portainer).`)
      // Em produção, você pode querer falhar aqui se a variável real não for fornecida.
      if (process.env.NODE_ENV === "production") {
        throw new Error(
          `ERRO CRÍTICO: ${envVarName} não foi fornecida pelo ambiente de runtime e está usando placeholder do build.`,
        )
      }
      return runtimeValue // Retorna o placeholder do build, mas com aviso.
    } else {
      // Variável não definida nem em runtime nem como placeholder (não deveria acontecer com o Dockerfile atual)
      console.error(`[ENV_CONFIG] 🚨 ERRO: ${envVarName} não está definida!`)
      if (process.env.NODE_ENV === "production") {
        throw new Error(`ERRO CRÍTICO: ${envVarName} não definida no ambiente.`)
      }
      return "" // Fallback de emergência, mas o erro já foi logado.
    }
  } else {
    // Lógica do lado do cliente
    // No cliente, process.env.NEXT_PUBLIC_* já terá o valor embutido pelo Next.js durante o build.
    // Se o valor embutido for o placeholder, isso significa que as variáveis de runtime não foram passadas corretamente
    // para o cliente (o que é um cenário mais complexo de resolver sem recarregar a página ou usar APIs).
    // A estratégia principal é garantir que o SERVIDOR tenha as variáveis corretas.
    if (runtimeValue === buildTimePlaceholder) {
      console.warn(
        `[CLIENT_ENV_CONFIG] ⚠️ Cliente está vendo placeholder do build para ${envVarName}. Isso pode indicar problemas na passagem de variáveis de runtime para o cliente.`,
      )
    }
    return runtimeValue || "" // Retorna o que foi embutido no build.
  }
}

export const supabaseConfig = {
  get url(): string {
    return getSupabaseEnvVar("NEXT_PUBLIC_SUPABASE_URL", PLACEHOLDER_URL)
  },
  get anonKey(): string {
    return getSupabaseEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY", PLACEHOLDER_KEY)
  },
  get serviceRoleKey(): string {
    // SUPABASE_SERVICE_ROLE_KEY não é prefixado com NEXT_PUBLIC_, então é apenas de servidor
    // e não precisa de placeholder de build.
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!key && typeof window === "undefined" && process.env.NODE_ENV === "production") {
      // Opcional: pode ser necessário apenas para algumas operações de admin.
      // console.warn("[ENV_CONFIG] SUPABASE_SERVICE_ROLE_KEY não definida.")
    }
    return key || ""
  },
  schema: "impaai",
}

// O restante do arquivo (TABLES, restApiUrls, getDefaultHeaders, validações) permanece o mesmo,
// pois eles dependerão dos getters de supabaseConfig.url e supabaseConfig.anonKey.

// ... (TABLES, restApiUrls, getDefaultHeaders, validateSupabaseConnection, validateSupabaseTables, TableName, TableValue)
// Copie o restante do arquivo da resposta anterior, pois não precisa de alteração.

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
    if (!supabaseConfig.url) throw new Error("Supabase URL não configurada para restApiUrls.base")
    return `${supabaseConfig.url}/rest/v1`
  },
  get users() {
    if (!supabaseConfig.url) throw new Error("Supabase URL não configurada para restApiUrls.users")
    return `${supabaseConfig.url}/rest/v1/${TABLES.USER_PROFILES}`
  },
  // ... adicione verificações para todas as URLs se desejar ser extra seguro
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

// Headers padrão para requisições
export const getDefaultHeaders = () => {
  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    throw new Error("Supabase URL ou Anon Key não configurados ao tentar gerar headers.")
  }
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "Accept-Profile": supabaseConfig.schema,
    "Content-Profile": supabaseConfig.schema,
    apikey: supabaseConfig.anonKey,
  }
}

// Função para validar conexão com Supabase
export async function validateSupabaseConnection() {
  console.log("🔍 Validando conexão com Supabase...")
  const url = supabaseConfig.url // Usa o getter
  const anonKey = supabaseConfig.anonKey // Usa o getter

  if (!url || url === PLACEHOLDER_URL || !anonKey || anonKey === PLACEHOLDER_KEY) {
    const errorMsg = `❌ Configurações do Supabase inválidas ou placeholders. URL: '${url}', Key: '${anonKey ? "definida" : "NÃO DEFINIDA"}'. Impossível validar conexão.`
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

  if (!url || url === PLACEHOLDER_URL || !anonKey || anonKey === PLACEHOLDER_KEY) {
    const errorMsg = `❌ Configurações do Supabase inválidas ou placeholders para validar tabelas. URL: '${url}'`
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
