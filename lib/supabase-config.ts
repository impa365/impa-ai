// Configurações centralizadas do Supabase
export const SUPABASE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  schema: "impaai", // Schema específico

  // Headers padrão para todas as requisições
  defaultHeaders: {
    "Accept-Profile": "impaai",
    "Content-Profile": "impaai",
  },
}

// Validação das variáveis de ambiente
if (!SUPABASE_CONFIG.url) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
}

if (!SUPABASE_CONFIG.anonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
}
