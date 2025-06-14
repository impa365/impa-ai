import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Export para compatibilidade

// Exports adicionais para compatibilidade
// export { db, getSupabase } from './supabase' // Removed to avoid circular dependencies and undeclared variables

// Se não existirem, criar aqui:
export const getSupabase = async () => {
  return await initializeSupabase()
}

// Export do db que já existe
// export { db } // Removed to avoid circular dependencies and undeclared variables

// Define db and initializeSupabase here to resolve the "undeclared variables" error
let db: any // Define db with a type, e.g., 'any' or a more specific type if known
const initializeSupabase = async () => {
  // Add your Supabase initialization logic here
  // For example:
  // db = await createClient(supabaseUrl, supabaseAnonKey);
  return supabase // Or return the initialized db object
}

export { db, initializeSupabase }
