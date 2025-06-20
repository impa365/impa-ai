/**
 * Cliente WhatsApp Settings - Versão que usa apenas APIs HTTP
 * Substitui o acesso direto ao Supabase por chamadas de API seguras
 */

// Função para sincronizar status de uma instância específica
export async function syncInstanceStatus(
  connectionId: string,
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log(`🔄 Sincronizando status da conexão: ${connectionId}`)

    const response = await fetch(`/api/whatsapp/sync/${connectionId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Incluir cookies para autenticação
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("❌ Erro ao sincronizar:", errorData)
      return {
        success: false,
        error: errorData.error || "Erro ao sincronizar status",
      }
    }

    const data = await response.json()
    console.log("✅ Status sincronizado:", data)

    return {
      success: true,
      data: data.data,
    }
  } catch (error: any) {
    console.error("💥 Erro na sincronização:", error)
    return {
      success: false,
      error: "Erro de conexão durante sincronização",
    }
  }
}

// Função para desconectar uma instância
export async function disconnectInstance(
  instanceName: string,
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log(`🔌 Desconectando instância: ${instanceName}`)

    const response = await fetch(`/api/whatsapp/disconnect/${instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Incluir cookies para autenticação
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("❌ Erro ao desconectar:", errorData)
      return {
        success: false,
        error: errorData.error || "Erro ao desconectar instância",
      }
    }

    const data = await response.json()
    console.log("✅ Instância desconectada:", data)

    return {
      success: true,
      data: data.data,
    }
  } catch (error: any) {
    console.error("💥 Erro ao desconectar:", error)
    return {
      success: false,
      error: "Erro de conexão durante desconexão",
    }
  }
}

// Função para verificar status de uma instância
export async function checkInstanceStatus(
  instanceName: string,
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log(`📊 Verificando status da instância: ${instanceName}`)

    const response = await fetch(`/api/whatsapp/status/${instanceName}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Incluir cookies para autenticação
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("❌ Erro ao verificar status:", errorData)
      return {
        success: false,
        error: errorData.error || "Erro ao verificar status",
      }
    }

    const data = await response.json()
    console.log("✅ Status verificado:", data)

    return {
      success: true,
      data: data.data,
    }
  } catch (error: any) {
    console.error("💥 Erro ao verificar status:", error)
    return {
      success: false,
      error: "Erro de conexão durante verificação",
    }
  }
}

// Função para obter informações detalhadas de uma instância
export async function getInstanceInfo(instanceName: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log(`ℹ️ Buscando informações da instância: ${instanceName}`)

    const response = await fetch(`/api/whatsapp/info/${instanceName}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Incluir cookies para autenticação
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("❌ Erro ao buscar informações:", errorData)
      return {
        success: false,
        error: errorData.error || "Erro ao buscar informações",
      }
    }

    const data = await response.json()
    console.log("✅ Informações obtidas:", data)

    return {
      success: true,
      data: data.data,
    }
  } catch (error: any) {
    console.error("💥 Erro ao buscar informações:", error)
    return {
      success: false,
      error: "Erro de conexão durante busca",
    }
  }
}

// Função para obter QR Code de uma instância
export async function getInstanceQRCode(
  instanceName: string,
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log(`📱 Buscando QR Code da instância: ${instanceName}`)

    const response = await fetch(`/api/whatsapp/qr/${instanceName}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Incluir cookies para autenticação
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("❌ Erro ao buscar QR Code:", errorData)
      return {
        success: false,
        error: errorData.error || "Erro ao buscar QR Code",
      }
    }

    const data = await response.json()
    console.log("✅ QR Code obtido")

    return {
      success: true,
      data: data.data,
    }
  } catch (error: any) {
    console.error("💥 Erro ao buscar QR Code:", error)
    return {
      success: false,
      error: "Erro de conexão durante busca do QR Code",
    }
  }
}

// Função para sincronizar todas as conexões do usuário
export async function syncAllUserConnections(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log("🔄 Sincronizando todas as conexões do usuário...")

    const response = await fetch("/api/whatsapp/sync-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Incluir cookies para autenticação
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("❌ Erro na sincronização em lote:", errorData)
      return {
        success: false,
        error: errorData.error || "Erro na sincronização em lote",
      }
    }

    const data = await response.json()
    console.log("✅ Sincronização em lote concluída:", data)

    return {
      success: true,
      data: data.data,
    }
  } catch (error: any) {
    console.error("💥 Erro na sincronização em lote:", error)
    return {
      success: false,
      error: "Erro de conexão durante sincronização em lote",
    }
  }
}
