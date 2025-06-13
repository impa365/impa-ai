/**
 * Configuração do Supabase.
 * Em runtime (servidor e cliente via /api/config), usa as variáveis injetadas pelo Portainer.
 * Durante o build, usa os placeholders definidos no Dockerfile.
 */

const PLACEHOLDER_URL = "http://placeholder-build.supabase.co"
const PLACEHOLDER_KEY = "placeholder-build-anon-key"

// Função para obter variáveis de ambiente, usada principalmente pelo servidor
// ou pelo cliente quando os valores são embutidos (o que não é o caso aqui para runtime)
function getSupabaseEnvVar(envVarName: string, buildTimePlaceholder: string, isSecret = false): string {
  const runtimeValue = process.env[envVarName]

  if (typeof window === "undefined") {
    // Lógica do lado do servidor / build
    if (runtimeValue && runtimeValue !== buildTimePlaceholder) {
      // Valor de runtime real (do Portainer)
      console.log(`[ENV_CONFIG_SERVER] ✅ Usando ${envVarName} de runtime: ${isSecret ? "***OCULTO***" : runtimeValue}`)
      return runtimeValue
    } else if (runtimeValue === buildTimePlaceholder) {
      // Valor do placeholder do build detectado em runtime
      // console.warn( // Log já acontece no start.js e na validação de conexão
      //   `[ENV_CONFIG_SERVER] ⚠️ ATENÇÃO: ${envVarName} está usando o valor placeholder do BUILD ('${buildTimePlaceholder}') em runtime.`,
      // )
      // Em produção, o start.js já deve ter falhado se isso acontecer.
      // Se chegou aqui em produção com placeholder, é um problema sério na validação do start.js.
      if (process.env.NODE_ENV === "production") {
        // Esta verificação é uma segunda camada de segurança.
        // O script start.js deve ser a primeira barreira.
        throw new Error(
          `ERRO CRÍTICO (supabase-config): ${envVarName} está usando placeholder do build em ambiente de produção. Verifique a injeção de variáveis do Portainer e o script start.js.`,
        )
      }
      return runtimeValue // Permite placeholder em dev/build
    } else {
      // Variável não definida
      // console.error(`[ENV_CONFIG_SERVER] 🚨 ERRO: ${envVarName} não está definida!`)
      // Durante o build, o Next.js pode tentar acessar isso. Se não estiver definido (e não for placeholder), pode causar erro no build.
      // O Dockerfile agora SEMPRE define os placeholders para o build, então este caso (undefined) não deveria ocorrer no build.
      // Se ocorrer em runtime, o start.js já deveria ter falhado.
      if (process.env.NODE_ENV === "production" && !runtimeValue) {
        throw new Error(`ERRO CRÍTICO (supabase-config): ${envVarName} não definida no ambiente de produção.`)
      }
      // Para o build, se por algum motivo o placeholder não foi pego, retornar o placeholder explicitamente
      // para evitar que o build quebre se o código tentar usar um 'undefined'.
      // No entanto, o Dockerfile deve garantir que process.env[envVarName] seja o placeholder no build.
      return buildTimePlaceholder
    }
  } else {
    // Lógica do lado do cliente
    // O cliente DEVE obter a configuração via RuntimeConfigProvider -> /api/config.
    // Se este código for chamado no cliente, é um erro de design, pois process.env
    // aqui conteria os valores embutidos no build (placeholders).
    console.warn(
      `[ENV_CONFIG_CLIENT] ⚠️ Tentativa de ler ${envVarName} diretamente no cliente via supabase-config. O cliente deve usar useRuntimeConfig().`,
    )
    // Retorna o valor que foi embutido no build (placeholder) para evitar quebrar, mas isso não é o ideal.
    return runtimeValue || buildTimePlaceholder
  }
}

export const supabaseConfig = {
  // Estes getters são usados pelo SERVIDOR e durante o BUILD.
  // O cliente usará RuntimeConfigProvider.
  get url(): string {
    // Simplificado: usa apenas NEXT_PUBLIC_SUPABASE_URL ou o placeholder.
    return getSupabaseEnvVar("NEXT_PUBLIC_SUPABASE_URL", PLACEHOLDER_URL)
  },
  get anonKey(): string {
    // Simplificado: usa apenas NEXT_PUBLIC_SUPABASE_ANON_KEY ou o placeholder.
    return getSupabaseEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY", PLACEHOLDER_KEY, true)
  },
  get serviceRoleKey(): string {
    // Esta variável é apenas para o servidor e não tem placeholder de build.
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!key && typeof window === "undefined" && process.env.NODE_ENV === "production") {
      // console.warn("[ENV_CONFIG_SERVER] SUPABASE_SERVICE_ROLE_KEY não definida (opcional).")
    }
    return key || ""
  },
  schema: "impaai",
}

// Tabelas do banco de dados (sem alteração)
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

// URLs da API REST do Supabase (sem alteração, usam supabaseConfig.url)
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

// Headers padrão para requisições (sem alteração, usam supabaseConfig.anonKey)
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

// Função para validar conexão com Supabase (sem alteração na lógica principal)
export async function validateSupabaseConnection() {
  console.log("🔍 Validando conexão com Supabase (usando supabaseConfig)...")
  const url = supabaseConfig.url // Usa o getter simplificado
  const anonKey = supabaseConfig.anonKey // Usa o getter simplificado

  // A lógica de getSupabaseEnvVar já trata placeholders e produção.
  // Se url ou anonKey forem placeholders em produção, um erro já teria sido lançado.
  // Se não estiverem definidos (o que não deveria acontecer devido ao Dockerfile e start.js),
  // getSupabaseEnvVar retornaria o placeholder ou lançaria erro.

  if (!url || url === PLACEHOLDER_URL || !anonKey || anonKey === PLACEHOLDER_KEY) {
    // Esta verificação adicional é para o caso de algo ter passado pelas checagens anteriores
    // ou se estivermos em um ambiente de desenvolvimento onde placeholders são permitidos.
    const errorMsg = `❌ Configurações do Supabase inválidas ou placeholders detectados em validateSupabaseConnection. URL: '${url}', Key: '${anonKey ? "definida" : "NÃO DEFINIDA"}'.`
    console.error(errorMsg)
    // Em produção, o start.js ou getSupabaseEnvVar já deveriam ter impedido isso.
    // Mas se chegou aqui, é melhor falhar.
    if (process.env.NODE_ENV === "production" && (url === PLACEHOLDER_URL || anonKey === PLACEHOLDER_KEY)) {
      throw new Error(errorMsg + " Placeholders não são permitidos em produção aqui.")
    }
    // Se não for produção, ou se as vars não estiverem definidas (o que é um erro de config), não prosseguir.
    if (!url || !anonKey) throw new Error(errorMsg + " URL ou Chave Anon não definidas.")
    // Se for dev e forem placeholders, podemos optar por não validar ou validar sabendo que são placeholders.
    // Por agora, vamos lançar erro se forem placeholders para sermos estritos.
    if (url === PLACEHOLDER_URL || anonKey === PLACEHOLDER_KEY) {
      console.warn("Tentando validar conexão com placeholders. Isso não funcionará com um Supabase real.")
      // throw new Error(errorMsg + " Não é possível validar conexão real com placeholders.");
      // Ou podemos permitir que a tentativa de fetch falhe naturalmente.
    }
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
    // Se o erro for por causa de placeholders, o log acima já indicou.
    throw error
  }
}

// validateSupabaseTables (sem alteração na lógica principal, usará supabaseConfig atualizado)
export async function validateSupabaseTables() {
  console.log("🔍 Validando tabelas do banco (usando supabaseConfig)...")
  const url = supabaseConfig.url
  const anonKey = supabaseConfig.anonKey

  if (!url || url === PLACEHOLDER_URL || !anonKey || anonKey === PLACEHOLDER_KEY) {
    const errorMsg = `❌ Configurações do Supabase inválidas ou placeholders para validar tabelas. URL: '${url}'`
    console.error(errorMsg)
    if (process.env.NODE_ENV === "production" && (url === PLACEHOLDER_URL || anonKey === PLACEHOLDER_KEY)) {
      throw new Error(errorMsg + " Placeholders não são permitidos em produção aqui.")
    }
    if (!url || !anonKey) throw new Error(errorMsg + " URL ou Chave Anon não definidas.")
    if (url === PLACEHOLDER_URL || anonKey === PLACEHOLDER_KEY) {
      console.warn("Tentando validar tabelas com placeholders.")
      // throw new Error(errorMsg + " Não é possível validar tabelas reais com placeholders.");
    }
  }
  // ... (resto da lógica de fetch para tabelas)
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

  if (successCount === 0 && tablesToCheck.length > 0 && url !== PLACEHOLDER_URL && anonKey !== PLACEHOLDER_KEY) {
    // Só lança erro se não estivermos usando placeholders e nenhuma tabela for encontrada.
    throw new Error("Nenhuma tabela principal foi encontrada ou está acessível.")
  }
  return results
}

export type TableName = keyof typeof TABLES
export type TableValue = (typeof TABLES)[TableName]
