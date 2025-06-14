import { db } from "@/lib/supabase" // Usando a nova estrutura do supabase.ts
import type { NextRequest } from "next/server"

export interface AuthResult {
  userId: string | null
  isAdmin: boolean
  error?: string
  status?: number
}

export async function authenticateApiKey(req: NextRequest): Promise<AuthResult> {
  const apiKey = req.headers.get("apikey")

  if (!apiKey) {
    return { userId: null, isAdmin: false, error: "API Key não fornecida.", status: 401 }
  }

  try {
    const userApiKeysTable = await db.userApiKeys()
    const { data: keyData, error: keyError } = await userApiKeysTable
      .select("user_id, is_admin_key, is_active, expires_at")
      .eq("api_key", apiKey)
      .single() // API keys devem ser únicas

    if (keyError || !keyData) {
      console.error("Erro ao buscar API key ou chave não encontrada:", keyError?.message)
      return { userId: null, isAdmin: false, error: "API Key inválida ou não encontrada.", status: 403 }
    }

    if (!keyData.is_active) {
      return { userId: null, isAdmin: false, error: "API Key inativa.", status: 403 }
    }

    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return { userId: null, isAdmin: false, error: "API Key expirada.", status: 403 }
    }

    return { userId: keyData.user_id, isAdmin: keyData.is_admin_key === true, error: undefined, status: 200 }
  } catch (error: any) {
    console.error("Erro interno ao autenticar API key:", error.message)
    return { userId: null, isAdmin: false, error: "Erro interno do servidor ao validar API Key.", status: 500 }
  }
}

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
