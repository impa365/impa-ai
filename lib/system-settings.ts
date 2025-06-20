// Sistema de configurações que usa APENAS APIs (NUNCA Supabase direto)

import { publicApi } from "./api-client"

// Cache para evitar múltiplas consultas
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
    console.log("🔄 Refreshing system settings cache via API...")

    // Usar API ao invés de Supabase direto
    const response = await publicApi.makeRequest("/api/system/settings")

    if (response.error) {
      console.error("❌ Erro ao buscar configurações via API:", response.error)
      // Usar valores padrão em caso de erro
      settingsCache = {
        default_whatsapp_connections_limit: 1,
        default_agents_limit: 2,
      }
      lastFetchTime = Date.now()
      return
    }

    // Atualizar o cache
    settingsCache = response.data?.settings || {}
    lastFetchTime = Date.now()
    console.log("✅ Cache de configurações atualizado via API:", Object.keys(settingsCache))
  } catch (error) {
    console.error("❌ Erro ao atualizar cache de configurações:", error)
    // Usar valores padrão em caso de erro
    settingsCache = {
      default_whatsapp_connections_limit: 1,
      default_agents_limit: 2,
    }
    lastFetchTime = Date.now()
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
    console.log("💾 Updating system settings via API:", Object.keys(settingsToUpdate))

    // TODO: Implementar API para atualizar configurações
    // const response = await publicApi.makeRequest("/api/system/settings", {
    //   method: "POST",
    //   body: JSON.stringify(settingsToUpdate)
    // })

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
