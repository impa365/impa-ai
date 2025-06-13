/**
 * Configuração do Supabase - Foco em Variáveis de Ambiente
 *
 * Remove todos os valores padrão e placeholders.
 * A aplicação dependerá exclusivamente das variáveis de ambiente.
 */

// Função para obter variáveis de ambiente obrigatórias
function getRequiredEnvVar(key: string): string {
  const value = process.env[key]
  if (!value) {
    console.error(`🚨 ERRO CRÍTICO: Variável de ambiente ${key} não definida!`)
    console.error("   A aplicação não pode iniciar sem esta variável.")
    console.error("   Verifique a configuração do seu ambiente (ex: stack do Portainer).")
    // Em um ambiente de produção real, você pode querer lançar um erro aqui
    // ou ter um mecanismo de fallback mais robusto se apropriado,
    // mas para o objetivo de depender 100% do env, vamos retornar string vazia
    // e deixar as validações posteriores pegarem isso.
    // No entanto, o console.error acima já alerta sobre o problema crítico.
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Variável de ambiente obrigatória ${key} não definida.`)
    }
    return "" // Retorna string vazia para evitar quebrar a tipagem, mas o erro já foi logado.
  }
  if (typeof window === "undefined") {
    // Log apenas no servidor
    console.log(`[ENV] ✅ ${key}: ${key.includes("KEY") ? "***OCULTO***" : value}`)
  }
  return value
}

// Configuração básica do Supabase usando variáveis de ambiente
export const supabaseConfig = {
  url: getRequiredEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
  anonKey: getRequiredEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "", // Pode ser opcional dependendo do uso
  schema: "impaai", // Esquema é fixo
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

// URLs da API REST do Supabase
// Usam getters para garantir que supabaseConfig.url seja avaliado em runtime
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

// Headers padrão para requisições
export const getDefaultHeaders = () => {
  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    console.error("🚨 ERRO: Tentando gerar headers sem URL ou Anon Key do Supabase configurados.")
    // Retorna headers vazios ou lança erro, dependendo da estratégia de erro.
    // Lançar erro é mais seguro para pegar o problema cedo.
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
  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    const errorMsg = "❌ Configurações do Supabase (URL ou Anon Key) não definidas. Impossível validar conexão."
    console.error(errorMsg)
    throw new Error(errorMsg)
  }

  try {
    const response = await fetch(`${supabaseConfig.url}/rest/v1/`, {
      headers: {
        apikey: supabaseConfig.anonKey,
        Authorization: `Bearer ${supabaseConfig.anonKey}`,
        "Accept-Profile": supabaseConfig.schema,
        "Content-Profile": supabaseConfig.schema,
      },
    })

    if (!response.ok) {
      throw new Error(`Erro na conexão: ${response.status} ${response.statusText}. URL: ${supabaseConfig.url}`)
    }

    console.log("✅ Conexão com Supabase estabelecida com sucesso!")
    return true
  } catch (error) {
    console.error("❌ Erro na conexão com Supabase:", error)
    throw error
  }
}

// Função para validar tabelas do banco
export async function validateSupabaseTables() {
  console.log("🔍 Validando tabelas do banco...")
  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    const errorMsg = "❌ Configurações do Supabase (URL ou Anon Key) não definidas. Impossível validar tabelas."
    console.error(errorMsg)
    throw new Error(errorMsg)
  }

  const tablesToCheck = [TABLES.USER_PROFILES, TABLES.AGENTS, TABLES.SYSTEM_SETTINGS]
  const results = []

  for (const table of tablesToCheck) {
    try {
      const response = await fetch(`${restApiUrls.base}/${table}?limit=1`, {
        // Usa o getter
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

// Tipos TypeScript
export type TableName = keyof typeof TABLES
export type TableValue = (typeof TABLES)[TableName]
