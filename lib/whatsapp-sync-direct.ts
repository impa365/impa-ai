// REMOVIDO: import { supabase } from "./supabase" 
// MOTIVO: Vulnerabilidade de segurança - uso direto do Supabase no cliente

// Função segura que usa API ao invés de acesso direto ao Supabase
export async function syncInstanceStatusDirect(connectionId: string) {
  try {
    console.log(`[SYNC-DIRECT] Iniciando sincronização segura via API para: ${connectionId}`)

    // SEGURANÇA: Usar API ao invés de acesso direto ao banco
    const response = await fetch('/api/whatsapp/sync-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        connectionId: connectionId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[SYNC-DIRECT] Erro na API:", errorData);
      return { 
        success: false, 
        error: errorData.error || `Erro HTTP ${response.status}` 
      };
    }

    const result = await response.json();
    console.log("[SYNC-DIRECT] Sincronização via API executada com sucesso:", result);
    
    return { 
      success: true, 
      updated: true, 
      method: "api",
      data: result 
    };

  } catch (error) {
    console.error("Erro na sincronização via API:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erro interno" 
    };
  }
}

// Função alternativa para compatibilidade (deprecated)
// Use syncInstanceStatusDirect() diretamente
export const syncConnectionStatus = syncInstanceStatusDirect;
