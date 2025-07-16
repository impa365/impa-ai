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

// REMOVIDO: getSupabaseClient() - VULNERABILIDADE DE SEGURANÇA
// REMOVIDO: getSupabaseClientSafe() - NÃO UTILIZADA E POTENCIAL RISCO
//
// SOLUÇÃO SEGURA: Use APENAS APIs do servidor ao invés de cliente Supabase direto
// Exemplos:
// - await fetch('/api/user/profile')
// - await publicApi.getAgents()
// - await fetch('/api/dashboard/stats')
//
// ⚠️ IMPORTANTE: Não criar clientes Supabase no frontend.
// Todas as operações devem passar pelas APIs do servidor.

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
