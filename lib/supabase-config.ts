/**
 * Configuração do Supabase - Versão Simplificada
 *
 * Esta versão não faz validações complexas que podem causar
 * problemas de hidratação entre servidor e cliente
 */

// Configuração básica do Supabase
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
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

// URLs da API REST do Supabase
export const restApiUrls = {
  base: `${supabaseConfig.url}/rest/v1`,
  users: `${supabaseConfig.url}/rest/v1/${TABLES.USER_PROFILES}`,
  agents: `${supabaseConfig.url}/rest/v1/${TABLES.AGENTS}`,
  whatsappConnections: `${supabaseConfig.url}/rest/v1/${TABLES.WHATSAPP_CONNECTIONS}`,
  activityLogs: `${supabaseConfig.url}/rest/v1/${TABLES.ACTIVITY_LOGS}`,
  userSettings: `${supabaseConfig.url}/rest/v1/${TABLES.USER_SETTINGS}`,
  systemSettings: `${supabaseConfig.url}/rest/v1/${TABLES.SYSTEM_SETTINGS}`,
  themes: `${supabaseConfig.url}/rest/v1/${TABLES.THEMES}`,
  integrations: `${supabaseConfig.url}/rest/v1/${TABLES.INTEGRATIONS}`,
  apiKeys: `${supabaseConfig.url}/rest/v1/${TABLES.USER_API_KEYS}`,
}

// Headers padrão para requisições
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

    if (!supabaseConfig.url || !supabaseConfig.anonKey) {
      throw new Error("Configurações do Supabase não encontradas")
    }

    const response = await fetch(`${supabaseConfig.url}/rest/v1/`, {
      headers: {
        apikey: supabaseConfig.anonKey,
        Authorization: `Bearer ${supabaseConfig.anonKey}`,
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

// Função para validar tabelas do banco
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

// Tipos TypeScript
export type TableName = keyof typeof TABLES
export type TableValue = (typeof TABLES)[TableName]
