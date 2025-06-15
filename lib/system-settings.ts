import { getSupabaseServer } from "@/lib/supabase"

// Cache para evitar múltiplas consultas ao banco
let settingsCache: Record<string, any> = {}
let lastFetchTime = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

export async function getSystemSetting(key: string, defaultValue: any = null): Promise<any> {
  // Verificar se precisamos atualizar o cache
  const now = Date.now()
  if (now - lastFetchTime > CACHE_TTL || Object.keys(settingsCache).length === 0) {
    await refreshSettingsCache()
  }

  // Retornar do cache ou valor padrão
  return settingsCache[key] !== undefined ? settingsCache[key] : defaultValue
}

export async function refreshSettingsCache(): Promise<void> {
  try {
    console.log("🔄 Refreshing system settings cache...")
    const client = await getSupabaseServer()
    const { data, error } = await client.from("system_settings").select("setting_key, setting_value")

    if (error) {
      console.error("❌ Erro ao buscar configurações do sistema:", error)
      settingsCache = {}
      lastFetchTime = 0
      return
    }

    // Atualizar o cache
    const newCache: Record<string, any> = {}
    data?.forEach((item) => {
      newCache[item.setting_key] = item.setting_value
    })

    settingsCache = newCache
    lastFetchTime = Date.now()
    console.log("✅ Cache de configurações do sistema atualizado:", Object.keys(settingsCache))
  } catch (error) {
    console.error("❌ Erro ao atualizar cache de configurações:", error)
    settingsCache = {}
    lastFetchTime = 0
  }
}

export async function getSystemSettings(): Promise<Record<string, any>> {
  const now = Date.now()
  if (now - lastFetchTime > CACHE_TTL || Object.keys(settingsCache).length === 0) {
    await refreshSettingsCache()
  }
  return { ...settingsCache }
}

export async function updateSystemSettings(settingsToUpdate: Record<string, any>): Promise<void> {
  try {
    console.log("💾 Updating system settings:", Object.keys(settingsToUpdate))
    const client = await getSupabaseServer()

    const upsertPromises = Object.entries(settingsToUpdate).map(([key, value]) => {
      const description = settingsCache[key]?.description || `Configuração do sistema para a chave ${key}`
      const category = settingsCache[key]?.category || "general"

      return client.from("system_settings").upsert(
        {
          setting_key: key,
          setting_value: value,
          description: description,
          category: category,
          is_public: settingsCache[key]?.is_public || false,
          requires_restart: settingsCache[key]?.requires_restart || false,
        },
        { onConflict: "setting_key" },
      )
    })

    const results = await Promise.allSettled(upsertPromises)

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`❌ Erro ao salvar configuração ${Object.keys(settingsToUpdate)[index]}:`, result.reason)
      }
    })

    // Forçar atualização do cache após salvar
    await refreshSettingsCache()
    console.log("✅ System settings updated successfully")
  } catch (error) {
    console.error("❌ Error updating system settings:", error)
    throw error
  }
}

export async function getDefaultWhatsAppLimit(): Promise<number> {
  const limit = await getSystemSetting("default_whatsapp_connections_limit", 1)
  return typeof limit === "number" ? limit : Number(limit) || 1
}

export async function getDefaultAgentsLimit(): Promise<number> {
  const limit = await getSystemSetting("default_agents_limit", 2)
  return typeof limit === "number" ? limit : Number(limit) || 2
}
