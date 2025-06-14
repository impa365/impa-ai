import { supabase } from "@/lib/supabase"

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
    const { data, error } = await supabase.from("system_settings").select("setting_key, setting_value")

    if (error) {
      console.error("Erro ao buscar configurações do sistema:", error)
      // Limpar cache em caso de erro para forçar nova tentativa
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
    // Tenta encontrar uma descrição padrão, se não existir, usa uma genérica
    const description = settingsCache[key]?.description || `Configuração do sistema para a chave ${key}`
    const category = settingsCache[key]?.category || "general" // Categoria padrão

    return supabase.from("system_settings").upsert(
      {
        setting_key: key,
        setting_value: value,
        description: description, // Adiciona descrição
        category: category, // Adiciona categoria
        is_public: settingsCache[key]?.is_public || false, // Mantém is_public se existir, senão false
        requires_restart: settingsCache[key]?.requires_restart || false, // Mantém se existir, senão false
      },
      { onConflict: "setting_key" },
    )
  })

  const results = await Promise.allSettled(upsertPromises)

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(`Erro ao salvar configuração ${Object.keys(settingsToUpdate)[index]}:`, result.reason)
      // Considerar lançar um erro aqui ou retornar um status de falha
    }
  })

  // Forçar atualização do cache após salvar
  await refreshSettingsCache()
}

// Valores padrão para limites (mantidos para compatibilidade, mas getSystemSettings é preferível)
export async function getDefaultWhatsAppLimit(): Promise<number> {
  const limit = await getSystemSetting("default_whatsapp_connections_limit", 1)
  return typeof limit === "number" ? limit : Number(limit) || 1
}

export async function getDefaultAgentsLimit(): Promise<number> {
  const limit = await getSystemSetting("default_agents_limit", 2)
  return typeof limit === "number" ? limit : Number(limit) || 2
}
