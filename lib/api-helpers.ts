// import type { NextRequest } from "next/server" // No longer needed for API key auth

// AuthResult interface and authenticateApiKey function have been removed

export async function getDefaultModel(): Promise<string | null> {
  try {
    // Importar diretamente o createClient
    const { createClient } = await import("@supabase/supabase-js")

    // Usar as variáveis de ambiente diretamente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Supabase config missing for getDefaultModel")
      return null
    }

    // Criar cliente direto
    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: "impaai" },
    })

    console.log("🔍 Buscando default_model da tabela system_settings...")

    // Query direta e simples
    const { data, error } = await supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "default_model")
      .single()

    if (error) {
      console.error("❌ Erro ao buscar default_model:", error)
      return null
    }

    if (!data || !data.setting_value) {
      console.error("❌ default_model não encontrado ou vazio")
      return null
    }

    const defaultModel = data.setting_value.toString().trim()
    console.log("✅ Default model encontrado:", defaultModel)

    return defaultModel
  } catch (error: any) {
    console.error("❌ Erro na função getDefaultModel:", error.message)
    return null
  }
}

// Helper para parsear JSON de forma segura
export function safeParseJson(jsonString: string | null | undefined, defaultValue: any = null): any {
  if (!jsonString) return defaultValue
  try {
    return JSON.parse(jsonString)
  } catch (e) {
    return defaultValue
  }
}
