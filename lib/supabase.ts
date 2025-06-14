import { createClient } from "@supabase/supabase-js"

// Função para obter configuração do servidor
async function getServerConfig() {
  if (typeof window === "undefined") {
    // No servidor, usar variáveis de ambiente diretamente (SEM NEXT_PUBLIC_)
    return {
      supabaseUrl: process.env.SUPABASE_URL || "http://localhost:54321",
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "dummy-key",
    }
  } else {
    // No cliente, fazer fetch para a API
    try {
      const response = await fetch("/api/config")
      const config = await response.json()
      return {
        supabaseUrl: config.supabaseUrl,
        supabaseAnonKey: config.supabaseAnonKey,
      }
    } catch (error) {
      console.error("Erro ao carregar configuração:", error)
      return {
        supabaseUrl: "http://localhost:54321",
        supabaseAnonKey: "dummy-key",
      }
    }
  }
}

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Define db and initializeSupabase here to resolve the "undeclared variables" error
let db: any // Define db with a type, e.g., 'any' or a more specific type if known
const initializeSupabase = async () => {
  const config = await getServerConfig()
  const supabaseUrl = config.supabaseUrl
  const supabaseAnonKey = config.supabaseAnonKey
  db = createClient(supabaseUrl, supabaseAnonKey)
  return db // Or return the initialized db object
}

export const supabase = await initializeSupabase()

// Export para compatibilidade

// Exports adicionais para compatibilidade
// export { db, getSupabase } from './supabase' // Removed to avoid circular dependencies and undeclared variables

// Se não existirem, criar aqui:
export const getSupabase = async () => {
  return await initializeSupabase()
}

// Export do db que já existe
// export { db } // Removed to avoid circular dependencies and undeclared variables

export { db, initializeSupabase }
