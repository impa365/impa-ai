// lib/system-settings.ts

import { supabase } from "./supabaseClient"

export async function getSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase.from("system_settings").select("value").eq("key", key).single()

  if (error) {
    console.error("Error fetching setting:", error)
    return null
  }

  return data ? data.value : null
}

export async function setSetting(key: string, value: string): Promise<boolean> {
  const { error } = await supabase.from("system_settings").upsert({ key: key, value: value }, { onConflict: "key" })

  if (error) {
    console.error("Error setting setting:", error)
    return false
  }

  return true
}

export async function getAllSettings(): Promise<{ key: string; value: string }[] | null> {
  const { data, error } = await supabase.from("system_settings").select("key, value")

  if (error) {
    console.error("Error fetching all settings:", error)
    return null
  }

  return data
}

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
    const { data, error } = await supabase.from("system_settings").select("key, value")

    if (error) {
      console.error("Erro ao buscar configurações do sistema:", error)
      settingsCache = {}
      lastFetchTime = 0
      return
    }

    // Atualizar o cache
    const newCache: Record<string, any> = {}
    data?.forEach((item) => {
      newCache[item.key] = item.value
    })

    settingsCache = newCache
    lastFetchTime = Date.now()
    console.log("Cache de configurações do sistema atualizado:", settingsCache)
  } catch (error) {
    console.error("Erro ao atualizar cache de configurações:", error)
    settingsCache = {}
    lastFetchTime = 0
  }
}

// Nova função para buscar todas as configurações do sistema
export async function getSystemSettings(): Promise<Record<string, any>> {
  const now = Date.now()
  if (now - lastFetchTime > CACHE_TTL || Object.keys(settingsCache).length === 0) {
    await refreshSettingsCache()
  }
  return { ...settingsCache } // Retorna uma cópia do cache
}

export async function updateSystemSettings(settingsToUpdate: Record<string, any>): Promise<void> {
  const upsertPromises = Object.entries(settingsToUpdate).map(([key, value]) => {
    return supabase.from("system_settings").upsert(
      {
        key: key,
        value: value,
        category: "general",
        is_public: false,
        is_active: true,
      },
      { onConflict: "key" },
    )
  })

  const results = await Promise.allSettled(upsertPromises)

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(`Erro ao salvar configuração ${Object.keys(settingsToUpdate)[index]}:`, result.reason)
    }
  })

  // Forçar atualização do cache após salvar
  await refreshSettingsCache()
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
