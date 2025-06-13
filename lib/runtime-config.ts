interface RuntimeConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  nextAuthUrl?: string
  nodeEnv?: string
}

let cachedConfig: RuntimeConfig | null = null

export async function getRuntimeConfig(): Promise<RuntimeConfig> {
  // Se já temos a config cached, retorna
  if (cachedConfig) {
    return cachedConfig
  }

  try {
    console.log("[getRuntimeConfig] Fetching runtime config from /api/config...")
    const response = await fetch("/api/config", {
      cache: "no-store", // Sempre buscar a config mais recente
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.status}`)
    }

    const config = await response.json()

    // Validar se a config é válida
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      throw new Error("Invalid config received from /api/config")
    }

    if (config.supabaseUrl.includes("placeholder-build") || config.supabaseAnonKey.includes("placeholder-build")) {
      throw new Error("Config still contains placeholders!")
    }

    console.log("[getRuntimeConfig] ✅ Valid runtime config received")
    cachedConfig = config
    return config
  } catch (error) {
    console.error("[getRuntimeConfig] ❌ Failed to get runtime config:", error)

    // Fallback para as variáveis embutidas (que podem ser placeholders)
    console.warn("[getRuntimeConfig] ⚠️ Falling back to build-time variables (may be placeholders)")
    const fallbackConfig = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      nextAuthUrl: process.env.NEXTAUTH_URL,
      nodeEnv: process.env.NODE_ENV,
    }

    return fallbackConfig
  }
}
