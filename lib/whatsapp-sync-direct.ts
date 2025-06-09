import { supabase } from "./supabase"

// Função alternativa que usa SQL direto para contornar problemas de cache
export async function syncInstanceStatusDirect(connectionId: string) {
  try {
    console.log(`[SYNC-DIRECT] Iniciando sincronização direta para: ${connectionId}`)

    // Usar SQL direto para atualizar
    const { data, error } = await supabase.rpc("update_connection_sync", {
      connection_id: connectionId,
    })

    if (error) {
      console.error("Erro na função RPC:", error)

      // Fallback: usar query SQL direta
      const currentTime = new Date().toISOString()
      const { data: updateData, error: updateError } = await supabase
        .from("whatsapp_connections")
        .update({
          updated_at: currentTime,
        })
        .eq("id", connectionId)
        .select()

      if (updateError) {
        console.error("Erro no fallback SQL:", updateError)
        return { success: false, error: updateError.message }
      }

      console.log("[SYNC-DIRECT] Fallback executado com sucesso")
      return { success: true, updated: true, method: "fallback" }
    }

    console.log("[SYNC-DIRECT] RPC executado com sucesso:", data)
    return { success: true, updated: true, method: "rpc" }
  } catch (error) {
    console.error("Erro na sincronização direta:", error)
    return { success: false, error: "Erro interno" }
  }
}
