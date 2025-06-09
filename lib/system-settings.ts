import { supabase } from "@/lib/supabase"

// Cache para evitar múltiplas consultas ao banco
let settingsCache: Record<string, any> = {}
let lastFetchTime = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

export async function getSystemSetting(key: string, defaultValue: any = null): Promise<any> {
  // Verificar se precisamos atualizar o cache
  const now = Date.now()
  if (now - lastFetchTime > CACHE_TTL) {
    await refreshSettingsCache()
  }

  // Retornar do cache ou valor padrão
  return settingsCache[key] !== undefined ? settingsCache[key] : defaultValue
}

export async function refreshSettingsCache(): Promise<void> {
  try {
    const { data, error } = await supabase.from("system_settings").select("setting_key, setting_value")

    if (error) {
      console.error("Erro ao buscar configurações do sistema:", error)
      return
    }

    // Atualizar o cache
    const newCache: Record<string, any> = {}
    data?.forEach((item) => {
      newCache[item.setting_key] = item.setting_value
    })

    settingsCache = newCache
    lastFetchTime = Date.now()
  } catch (error) {
    console.error("Erro ao atualizar cache de configurações:", error)
  }
}

// Valores padrão para limites
export async function getDefaultWhatsAppLimit(): Promise<number> {
  const limit = await getSystemSetting("default_whatsapp_connections_limit", 1)
  return typeof limit === "number" ? limit : Number(limit) || 1
}

export async function getDefaultAgentsLimit(): Promise<number> {
  const limit = await getSystemSetting("default_agents_limit", 2)
  return typeof limit === "number" ? limit : Number(limit) || 2
}
