/**
 * JWT para Edge Runtime
 * Usa Web Crypto API ao invés de Node.js crypto
 */

export interface JWTPayload {
  id: string
  email: string
  role: 'admin' | 'user'
  full_name: string
  iat?: number
  exp?: number
}

/**
 * Decodifica JWT sem validar (para extrair payload)
 * Compatível com Edge Runtime
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payload = parts[1]
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8')
    return JSON.parse(decoded) as JWTPayload
  } catch (error) {
    console.error('❌ Erro ao decodificar JWT:', error)
    return null
  }
}

/**
 * Verifica se o token está expirado
 * Compatível com Edge Runtime
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token)
  if (!payload || !payload.exp) return true

  const now = Math.floor(Date.now() / 1000)
  return payload.exp < now
}

/**
 * Extrai token do header Authorization
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null
  
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  return null
}
