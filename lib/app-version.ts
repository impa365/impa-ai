// import { supabase } from "@/lib/supabase" // Remove this
import { getSupabase } from "@/lib/supabase" // Import getSupabase directly

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
    const client = await getSupabase() // Get client directly
    // Buscar versão do banco de dados
    const { data, error } = await client // Use client directly
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "app_version")
      .single()

    if (error) {
      console.error("Erro ao buscar versão da aplicação:", error)
      return "1.0.0" // Versão padrão
    }

    const version = data?.setting_value || "1.0.0"

    // Atualizar cache
    versionCache = version
    lastVersionFetch = now

    return version
  } catch (error) {
    // This catch block will now primarily catch errors from getSupabase() itself
    // or unexpected errors not caught by the inner if(error)
    console.error("Erro crítico ao buscar versão da aplicação:", error)
    return "1.0.0" // Versão padrão
  }
}

export async function updateAppVersion(newVersion: string): Promise<boolean> {
  try {
    const client = await getSupabase() // Get client directly

    // Verificar se já existe uma configuração de versão
    const { data: existingSetting, error: fetchError } = await client // Use client directly
      .from("system_settings")
      .select("id")
      .eq("setting_key", "app_version")
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116: 'single' row not found, which is fine if creating new
      console.error("Erro ao verificar configuração de versão existente:", fetchError)
      // Potentially return false or throw, depending on desired behavior for non-PGRST116 errors
    }

    const settingData = {
      setting_key: "app_version",
      setting_value: newVersion,
      category: "general",
      description: "Versão atual da aplicação",
      is_public: true,
      requires_restart: false,
    }

    if (existingSetting) {
      // Atualizar configuração existente
      const { error: updateError } = await client // Use client directly
        .from("system_settings")
        .update({
          setting_value: newVersion,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSetting.id)

      if (updateError) {
        console.error("Erro ao atualizar versão da aplicação:", updateError)
        return false
      }
    } else {
      // Criar nova configuração
      const { error: insertError } = await client.from("system_settings").insert(settingData) // Use client directly

      if (insertError) {
        console.error("Erro ao inserir versão da aplicação:", insertError)
        return false
      }
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
