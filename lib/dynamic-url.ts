/**
 * Função para obter a URL base dinamicamente do Docker stack
 * Falha se NEXTAUTH_URL não estiver definida (sem fallbacks)
 */
export function getBaseUrl(): string {
  const baseUrl = process.env.NEXTAUTH_URL
  
  if (!baseUrl) {
    throw new Error(
      'NEXTAUTH_URL não está definida. ' +
      'Esta variável é obrigatória para o funcionamento do sistema no Docker Swarm.'
    )
  }
  
  // Remove trailing slash se existir
  return baseUrl.replace(/\/$/, '')
}

/**
 * Função para obter a URL base de forma segura (para client-side)
 * Retorna undefined se não estiver disponível
 */
export function getBaseUrlSafe(): string | undefined {
  if (typeof window !== 'undefined') {
    // Client-side: usar window.location
    return window.location.origin
  }
  
  // Server-side: usar variável de ambiente
  return process.env.NEXTAUTH_URL?.replace(/\/$/, '')
}

/**
 * Função para validar se a URL está configurada corretamente
 */
export function validateBaseUrl(): boolean {
  try {
    const url = getBaseUrl()
    return url.startsWith('https://') || url.startsWith('http://')
  } catch {
    return false
  }
} 