import { db } from "@/lib/supabase" // Usando a nova estrutura do supabase.ts
// import type { NextRequest } from "next/server" // No longer needed for API key auth

// AuthResult interface and authenticateApiKey function have been removed

export async function getDefaultModel(): Promise<string | null> {
  try {
    const systemSettingsTable = await db.systemSettings()
    const { data: modelSetting, error: settingError } = await systemSettingsTable
      .select("setting_value")
      .eq("setting_key", "default_model")
      .single()

    if (settingError || !modelSetting) {
      console.warn("Configuração 'default_model' não encontrada:", settingError?.message)
      return null // Ou um valor padrão como 'gpt-3.5-turbo'
    }
    return modelSetting.setting_value as string
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
