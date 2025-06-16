// import type { NextRequest } from "next/server" // No longer needed for API key auth

// AuthResult interface and authenticateApiKey function have been removed

export async function getDefaultModel(): Promise<string | null> {
  try {
    const { getSupabaseServer } = await import("@/lib/supabase")
    const supabase = getSupabaseServer()

    // Buscar da tabela system_settings no schema impaai
    const { data: modelSetting, error: settingError } = await supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "default_model")
      .single()

    if (settingError) {
      console.error("Erro ao buscar default_model:", settingError.message)
      return null
    }

    if (!modelSetting || !modelSetting.setting_value) {
      console.error("Configuração 'default_model' não encontrada ou vazia")
      return null
    }

    // O setting_value já é uma string simples, não precisa de parsing JSON
    const defaultModel = modelSetting.setting_value.trim()
    console.log("Default model encontrado:", defaultModel)

    return defaultModel || null
  } catch (error: any) {
    console.error("Erro ao buscar default_model:", error.message)
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
