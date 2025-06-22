import { createClient } from "@supabase/supabase-js";

// Singleton para garantir uma única instância do cliente Supabase
let supabaseInstance: ReturnType<typeof createClient> | null = null;

// Função para criar/obter a instância única do Supabase (servidor)
export function getSupabaseServer() {
  // Esta função só deve ser usada em API routes do servidor
  if (typeof window !== "undefined") {
    throw new Error("getSupabaseServer should only be used on the server side");
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  // Sempre criar nova instância no servidor (não há problema de múltiplas instâncias)
  return createClient(supabaseUrl, supabaseAnonKey, {
    db: { schema: "impaai" },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Função para criar/obter a instância única do Supabase (cliente)
export function getSupabaseClient() {
  // Esta função só deve ser usada no lado do cliente
  if (typeof window === "undefined") {
    throw new Error("getSupabaseClient should only be used on the client side");
  }

  // Se já existe uma instância, retornar ela (singleton)
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing public Supabase environment variables");
  }

  // Criar nova instância apenas se não existir (singleton)
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    db: { schema: "impaai" },
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      storageKey: "impaai-auth-token", // Chave única para evitar conflitos
    },
  });

  return supabaseInstance;
}

// Função para resetar a instância (útil para testes ou logout)
export function resetSupabaseInstance() {
  if (typeof window !== "undefined") {
    supabaseInstance = null;
  }
}

// Configurações padrão
export const supabaseConfig = {
  schema: "impaai",
  storageKey: "impaai-auth-token",
};
