// Cache para as configurações
let configCache: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30000; // 30 segundos

// Função para obter configurações do servidor
export async function getConfig() {
  // Se já temos cache válido e estamos no cliente, usar cache
  const now = Date.now();
  if (
    configCache &&
    typeof window !== "undefined" &&
    now - cacheTimestamp < CACHE_DURATION
  ) {
    console.log("🔧 Using cached client config");
    return configCache;
  }

  // No servidor, ler diretamente das variáveis de ambiente (SEM )
  if (typeof window === "undefined") {
    const config = {
      supabaseUrl: process.env.SUPABASE_URL || "http://localhost:54321",
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "dummy-key",
      nextAuthUrl: process.env.NEXTAUTH_URL || "http://localhost:3000",
      customKey: process.env.CUSTOM_KEY || "",
    };

    console.log("🔧 Server config loaded:");
    console.log("Supabase URL:", config.supabaseUrl);
    console.log("NextAuth URL:", config.nextAuthUrl);
    console.log(
      "Custom Key:",
      config.customKey ? "✅ Defined" : "❌ Not defined"
    );

    return config;
  }

  // No cliente, buscar da API
  try {
    console.log("🌐 Client fetching config from /api/config...");
    const response = await fetch("/api/config", {
      cache: "no-store", // Sempre buscar dados frescos
      headers: {
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) {
      console.error(
        `❌ Failed to fetch config: ${response.status} ${response.statusText}`
      );
      throw new Error(`Failed to fetch config: ${response.status}`);
    }

    const config = await response.json();

    // Cache no cliente
    configCache = config;
    cacheTimestamp = now;

    console.log("🔧 Client config loaded from /api/config:");
    console.log("Supabase URL:", config.supabaseUrl);
    console.log("NextAuth URL:", config.nextAuthUrl);

    return config;
  } catch (error) {
    console.error("❌ Failed to load config from /api/config:", error);

    // Fallback apenas para desenvolvimento local
    if (
      typeof window !== "undefined" &&
      window.location.hostname === "localhost"
    ) {
      const fallbackConfig = {
        supabaseUrl: "http://localhost:54321",
        supabaseAnonKey: "dummy-key",
        nextAuthUrl: "http://localhost:3000",
        customKey: "",
      };
      console.log("🔧 Using localhost fallback config");
      configCache = fallbackConfig;
      cacheTimestamp = now;
      return fallbackConfig;
    }

    // Em produção, não usar fallback - deixar falhar para debug
    throw error;
  }
}

// Função para limpar cache (útil para testes)
export function clearConfigCache() {
  configCache = null;
  cacheTimestamp = 0;
  console.log("🧹 Config cache cleared");
}

// Função para verificar se as configurações estão válidas
export function validateConfig(config: any): boolean {
  if (!config.supabaseUrl || config.supabaseUrl.includes("placeholder")) {
    console.error("❌ Invalid Supabase URL:", config.supabaseUrl);
    return false;
  }

  if (!config.supabaseAnonKey || config.supabaseAnonKey === "dummy-key") {
    console.error("❌ Invalid Supabase Anon Key");
    return false;
  }

  if (!config.nextAuthUrl || config.nextAuthUrl.includes("placeholder")) {
    console.error("❌ Invalid NextAuth URL:", config.nextAuthUrl);
    return false;
  }

  return true;
}
