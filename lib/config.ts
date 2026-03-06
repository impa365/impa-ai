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

  // SEGURANÇA: No servidor, ler diretamente das variáveis de ambiente
  if (typeof window === "undefined") {
    const config = {
      databaseUrl: process.env.DATABASE_URL || "",
      nextAuthUrl: process.env.NEXTAUTH_URL || "http://localhost:3000",
      customKey: process.env.CUSTOM_KEY || "",
    };

    console.log("🔧 Server config loaded:");
    console.log("Database URL:", config.databaseUrl ? "✅ Defined" : "❌ Not defined");
    console.log("NextAuth URL:", config.nextAuthUrl);
    console.log(
      "Custom Key:",
      config.customKey ? "✅ Defined" : "❌ Not defined"
    );

    return config;
  }

  // SEGURANÇA: No cliente, SEMPRE buscar da API (nunca process.env)
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
    console.log("NextAuth URL:", config.nextAuthUrl);

    return config;
  } catch (error) {
    console.error("❌ Failed to load config from /api/config:", error);

    // SEGURANÇA: Fallback apenas para desenvolvimento local
    if (
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || 
       window.location.hostname === "127.0.0.1" ||
       window.location.hostname.includes("localhost"))
    ) {
      const fallbackConfig = {
        nextAuthUrl: "http://localhost:3000",
        customKey: "",
      };
      console.log("🔧 Using localhost fallback config");
      configCache = fallbackConfig;
      cacheTimestamp = now;
      return fallbackConfig;
    }

    // SEGURANÇA: Em produção, não usar fallback - deixar falhar para forçar correção
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
  if (!config.databaseUrl) {
    console.error("❌ DATABASE_URL not defined");
    return false;
  }

  if (!config.nextAuthUrl || config.nextAuthUrl.includes("placeholder")) {
    console.error("❌ Invalid NextAuth URL:", config.nextAuthUrl);
    return false;
  }

  return true;
}
