// Cliente para APIs do WhatsApp - SEM acesso direto ao Supabase

interface CreateInstanceResponse {
  success: boolean
  data?: any
  error?: string
}

interface InstanceDetailsResponse {
  success: boolean
  data?: any
  error?: string
}

interface QRCodeResponse {
  success: boolean
  qrCode?: string
  error?: string
}

interface DeleteInstanceResponse {
  success: boolean
  error?: string
}

// Função para criar instância via API
export async function createEvolutionInstance(connectionName: string, userId: string): Promise<CreateInstanceResponse> {
  try {
    const response = await fetch("/api/whatsapp/create-instance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        connectionName,
        userId,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Erro ${response.status}`,
      }
    }

    return data
  } catch (error: any) {
    console.error("Erro ao criar instância:", error)
    return {
      success: false,
      error: `Erro de conexão: ${error.message || "Erro desconhecido"}`,
    }
  }
}

// Função para buscar detalhes da instância via API
export async function fetchInstanceDetails(instanceName: string): Promise<InstanceDetailsResponse> {
  try {
    const response = await fetch(`/api/whatsapp/instance-details/${instanceName}`)
    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Erro ${response.status}`,
      }
    }

    return data
  } catch (error: any) {
    console.error("Erro ao buscar detalhes da instância:", error)
    return {
      success: false,
      error: `Erro de conexão: ${error.message || "Erro desconhecido"}`,
    }
  }
}

// Função para buscar QR Code via API
export async function getInstanceQRCode(instanceName: string): Promise<QRCodeResponse> {
  try {
    const response = await fetch(`/api/whatsapp/qr/${instanceName}`)
    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Erro ${response.status}`,
      }
    }

    return data
  } catch (error: any) {
    console.error("Erro ao buscar QR Code:", error)
    return {
      success: false,
      error: `Erro de conexão: ${error.message || "Erro desconhecido"}`,
    }
  }
}

// Função para deletar instância via API
export async function deleteEvolutionInstance(instanceName: string): Promise<DeleteInstanceResponse> {
  try {
    const response = await fetch(`/api/whatsapp/delete-instance/${instanceName}`, {
      method: "DELETE",
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Erro ${response.status}`,
      }
    }

    return data
  } catch (error: any) {
    console.error("Erro ao deletar instância:", error)
    return {
      success: false,
      error: `Erro de conexão: ${error.message || "Erro desconhecido"}`,
    }
  }
}
