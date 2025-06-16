import { db } from "@/lib/supabase" // Usando a nova estrutura do supabase.ts
// import type { NextRequest } from "next/server" // No longer needed for API key auth

// AuthResult interface and authenticateApiKey function have been removed

export async function getDefaultModel(): Promise<string | null> {
  try {
    const supabase = await db.supabase()
    const { data: modelSetting, error: settingError } = await supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "default_model")
      .single()

    if (settingError || !modelSetting) {
      console.warn("Configuração 'default_model' não encontrada:", settingError?.message)
      return "gpt-4o-mini" // Valor padrão
    }
    return modelSetting.setting_value as string
  } catch (error: any) {
    console.error("Erro ao buscar default_model:", error.message)
    return "gpt-4o-mini" // Valor padrão
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
