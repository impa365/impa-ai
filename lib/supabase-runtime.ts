import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { getRuntimeConfig } from "./runtime-config"

// Variável para armazenar a instância do cliente
let supabaseInstance: SupabaseClient | null = null

// Função que cria o cliente usando configuração runtime
export async function getSupabaseClient(): Promise<SupabaseClient> {
  // Se já existe uma instância, retorna ela
  if (supabaseInstance) {
    return supabaseInstance
  }

  console.log("--- Creating Supabase Client with Runtime Config ---")

  try {
    // Buscar configuração real do runtime
    const config = await getRuntimeConfig()

    console.log("Runtime config received:", {
      url: config.supabaseUrl,
      key: config.supabaseAnonKey ? "***HIDDEN***" : "NOT SET",
    })

    // Criar cliente com configuração runtime
    supabaseInstance = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      db: { schema: "impaai" },
      global: { headers: { "Accept-Profile": "impaai", "Content-Profile": "impaai" } },
    })

    console.log(`✅ Supabase client created with runtime config for: ${new URL(config.supabaseUrl).hostname}`)
  } catch (error) {
    console.error("❌ Failed to create Supabase client with runtime config:", error)
    throw error
  }

  return supabaseInstance
}

// Função para resetar o cliente (útil para testes)
export function resetSupabaseClient() {
  supabaseInstance = null
}

// Objeto db para facilitar o uso (agora assíncrono)
export const createDb = async () => {
  const supabase = await getSupabaseClient()
  return {
    users: () => supabase.from("user_profiles"),
    agents: () => supabase.from("ai_agents"),
    whatsappConnections: () => supabase.from("whatsapp_connections"),
    activityLogs: () => supabase.from("agent_activity_logs"),
    userSettings: () => supabase.from("user_settings"),
    systemSettings: () => supabase.from("system_settings"),
    themes: () => supabase.from("system_themes"),
    integrations: () => supabase.from("integrations"),
    vectorStores: () => supabase.from("vector_stores"),
    vectorDocuments: () => supabase.from("vector_documents"),
    apiKeys: () => supabase.from("user_api_keys"),
    organizations: () => supabase.from("organizations"),
    dailyMetrics: () => supabase.from("daily_metrics"),
    rpc: (functionName: string, params?: any) => supabase.rpc(functionName, params),
  }
}
