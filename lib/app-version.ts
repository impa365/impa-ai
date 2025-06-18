// import { supabase } from "@/lib/supabase" // Remove this
import { apiClient } from "@/lib/api-client" // Import apiClient directly

// Cache para a versão da aplicação
let versionCache: string | null = null
let lastVersionFetch = 0
const VERSION_CACHE_TTL = 10 * 60 * 1000 // 10 minutos

export async function getAppVersion(): Promise<string> {
  const now = Date.now()

  // Verificar se temos cache válido
  if (versionCache && now - lastVersionFetch < VERSION_CACHE_TTL) {
    return versionCache
  }

  try {
    // Usar API client ao invés de Supabase direto
    const result = await apiClient.makeRequest("/api/system/version")

    if (result.error) {
      console.error("Erro ao buscar versão da aplicação:", result.error)
      return "1.0.0" // Versão padrão
    }

    const version = result.data?.version || "1.0.0"

    // Atualizar cache
    versionCache = version
    lastVersionFetch = now

    return version
  } catch (error) {
    console.error("Erro crítico ao buscar versão da aplicação:", error)
    return "1.0.0" // Versão padrão
  }
}

export async function updateAppVersion(newVersion: string): Promise<boolean> {
  try {
    const result = await apiClient.makeRequest("/api/system/version", {
      method: "POST",
      body: JSON.stringify({ version: newVersion }),
    })

    if (result.error) {
      console.error("Erro ao atualizar versão da aplicação:", result.error)
      return false
    }

    // Limpar cache para forçar nova busca
    versionCache = null
    lastVersionFetch = 0

    console.log(`Versão da aplicação atualizada para: ${newVersion}`)
    return true
  } catch (error) {
    console.error("Erro crítico ao atualizar versão da aplicação:", error)
    return false
  }
}
