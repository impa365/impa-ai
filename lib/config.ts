// Cache para as configurações
let configCache: any = null

// Função para obter configurações do servidor
export async function getConfig() {
  // Se já temos cache e estamos no cliente, usar cache
  if (configCache && typeof window !== "undefined") {
    console.log("🔧 Using cached client config:", configCache)
    return configCache
  }

  // No servidor, ler diretamente das variáveis de ambiente (SEM NEXT_PUBLIC_)
  if (typeof window === "undefined") {
    const config = {
      supabaseUrl: process.env.SUPABASE_URL || "http://localhost:54321",
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "dummy-key",
      nextAuthUrl: process.env.NEXTAUTH_URL || "http://localhost:3000",
    }

    console.log("🔧 Server config loaded:")
    console.log("Supabase URL:", config.supabaseUrl)
    console.log("NextAuth URL:", config.nextAuthUrl)

    return config
  }

  // No cliente, buscar da API
  try {
    console.log("🌐 Client fetching config from /api/config...")
    const response = await fetch("/api/config")
    if (!response.ok) {
      // Log the status and statusText for more details on HTTP errors
      console.error(`❌ Failed to fetch config from /api/config: ${response.status} ${response.statusText}`)
      throw new Error(`Failed to fetch config: ${response.status} ${response.statusText}`)
    }

    const config = await response.json()
    configCache = config // Cache no cliente

    console.log("🔧 Client config loaded from /api/config:")
    console.log("Supabase URL:", config.supabaseUrl)

    return config
  } catch (error) {
    // This catch block handles network errors from fetch (like TypeError: Failed to fetch)
    // or the error thrown above if response.ok is false.
    console.error("❌ Failed to load config from /api/config, using fallback. Error details:", error)

    // Fallback para desenvolvimento
    const fallbackConfig = {
      supabaseUrl: "http://localhost:54321",
      supabaseAnonKey: "dummy-key", // Ensure fallback has a key, even if dummy
      nextAuthUrl: "http://localhost:3000",
    }
    console.log("🔧 Using fallback config:", fallbackConfig)
    configCache = fallbackConfig // Cache the fallback to prevent repeated failed fetches
    return fallbackConfig
  }
}

// Função para limpar cache (útil para testes)
export function clearConfigCache() {
  configCache = null
  console.log("🧹 Config cache cleared.")
}
