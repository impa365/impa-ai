// Cache para as configurações
let configCache: any = null
let cacheTimestamp = 0
const CACHE_DURATION = 30000 // 30 segundos

// Função para obter configurações do servidor
export async function getConfig() {
  // Se já temos cache válido e estamos no cliente, usar cache
  const now = Date.now()
  if (configCache && typeof window !== "undefined" && now - cacheTimestamp < CACHE_DURATION) {
    console.log("🔧 Using cached client config")
    return configCache
  }

  // No servidor, ler diretamente das variáveis de ambiente (SEM NEXT_PUBLIC_)
  if (typeof window === "undefined") {
    const config = {
      supabaseUrl: process.env.SUPABASE_URL || "http://localhost:54321",
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "dummy-key",
      nextAuthUrl: process.env.NEXTAUTH_URL || "http://localhost:3000",
      customKey: process.env.CUSTOM_KEY || "",
    }

    console.log("🔧 Server config loaded:")
    console.log("Supabase URL:", config.supabaseUrl)
    console.log("NextAuth URL:", config.nextAuthUrl)
    console.log("Custom Key:", config.customKey ? "✅ Defined" : "❌ Not defined")

    return config
  }

  // No cliente, buscar da API
  try {
    console.log("🌐 Client fetching config from /api/config...")
    const response = await fetch("/api/config", {
      cache: "no-store", // Sempre buscar dados frescos
      headers: {
        "Cache-Control": "no-cache",
      },
    })

    if (!response.ok) {
      console.error(`❌ Failed to fetch config: ${response.status} ${response.statusText}`)
      throw new Error(`Failed to fetch config: ${response.status}`)
    }

    const config = await response.json()

    // Cache no cliente
    configCache = config
    cacheTimestamp = now

    console.log("🔧 Client config loaded from /api/config:")
    console.log("Supabase URL:", config.supabaseUrl)
    console.log("NextAuth URL:", config.nextAuthUrl)

    return config
  } catch (error) {
    console.error("❌ Failed to load config from /api/config:", error)

    // Fallback apenas para desenvolvimento local
    if (typeof window !== "undefined" && window.location.hostname === "localhost") {
      const fallbackConfig = {
        // Removido: supabaseUrl: "http://localhost:54321",
        // Removido: supabaseAnonKey: "dummy-key",
        nextAuthUrl: "http://localhost:3000", // Mantenha se for útil
        customKey: "", // Mantenha se for útil
      }
      console.warn("🔧 Using localhost fallback for non-Supabase config from /api/config")
      configCache = fallbackConfig // Este cache agora NÃO contém chaves Supabase
      cacheTimestamp = now
      return fallbackConfig
    }

    // Em produção, não usar fallback - deixar falhar para debug
    throw error
  }
}

// Função para limpar cache (útil para testes)
export function clearConfigCache() {
  configCache = null
  cacheTimestamp = 0
  console.log("🧹 Config cache cleared")
}

// Função para verificar se as configurações estão válidas
export function validateConfig(config: any): boolean {
  // nextAuthUrl pode ser importante para o cliente
  if (!config.nextAuthUrl || config.nextAuthUrl.includes("placeholder")) {
    console.error("❌ Invalid NextAuth URL in fetched config:", config.nextAuthUrl)
    // Decida se isso deve retornar false ou apenas logar um aviso.
    // Se o cliente NextAuth depende disso, pode ser um erro.
    // return false;
  }

  // Adicione outras validações para chaves públicas se necessário

  return true
}
