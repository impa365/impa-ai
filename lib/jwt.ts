import jwt from 'jsonwebtoken'

// Interface para o payload do JWT
export interface JWTPayload {
  id: string
  email: string
  role: 'admin' | 'user'
  full_name: string
  iat?: number
  exp?: number
}

// Interface para tokens
export interface TokenPair {
  accessToken: string
  refreshToken: string
}

// Configurações JWT
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'your-super-secret-access-key-change-in-production'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production'
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m' // 15 minutos
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d' // 7 dias

/**
 * Gerar Access Token JWT
 */
export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  try {
    return jwt.sign(payload, JWT_ACCESS_SECRET, {
      expiresIn: JWT_ACCESS_EXPIRES_IN,
      issuer: 'impa-ai',
      audience: 'impa-ai-users',
    })
  } catch (error) {
    console.error('❌ Erro ao gerar access token:', error)
    throw new Error('Erro ao gerar token de acesso')
  }
}

/**
 * Gerar Refresh Token JWT
 */
export function generateRefreshToken(payload: Pick<JWTPayload, 'id' | 'email'>): string {
  try {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: 'impa-ai',
      audience: 'impa-ai-users',
    })
  } catch (error) {
    console.error('❌ Erro ao gerar refresh token:', error)
    throw new Error('Erro ao gerar token de atualização')
  }
}

/**
 * Gerar par de tokens (access + refresh)
 */
export function generateTokenPair(user: Omit<JWTPayload, 'iat' | 'exp'>): TokenPair {
  const accessToken = generateAccessToken(user)
  const refreshToken = generateRefreshToken({
    id: user.id,
    email: user.email,
  })

  return {
    accessToken,
    refreshToken,
  }
}

/**
 * Validar Access Token
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET, {
      issuer: 'impa-ai',
      audience: 'impa-ai-users',
    }) as JWTPayload

    return decoded
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expirado')
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Token inválido')
    }
    console.error('❌ Erro ao verificar access token:', error)
    throw new Error('Erro na validação do token')
  }
}

/**
 * Validar Refresh Token
 */
export function verifyRefreshToken(token: string): Pick<JWTPayload, 'id' | 'email'> {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'impa-ai',
      audience: 'impa-ai-users',
    }) as Pick<JWTPayload, 'id' | 'email'>

    return decoded
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token de atualização expirado')
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Token de atualização inválido')
    }
    console.error('❌ Erro ao verificar refresh token:', error)
    throw new Error('Erro na validação do token de atualização')
  }
}

/**
 * Extrair token do header Authorization
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null
  
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  return null
}

/**
 * Decodificar token sem validar (para debug)
 */
export function decodeTokenWithoutVerification(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload
  } catch (error) {
    console.error('❌ Erro ao decodificar token:', error)
    return null
  }
}

/**
 * Verificar se token está próximo do vencimento (para refresh automático)
 */
export function isTokenNearExpiry(token: string, thresholdMinutes: number = 5): boolean {
  try {
    const decoded = jwt.decode(token) as JWTPayload
    if (!decoded || !decoded.exp) return true

    const now = Math.floor(Date.now() / 1000)
    const timeUntilExpiry = decoded.exp - now
    const thresholdSeconds = thresholdMinutes * 60

    return timeUntilExpiry <= thresholdSeconds
  } catch (error) {
    return true // Se não conseguir decodificar, considerar como próximo do vencimento
  }
}

/**
 * Utilitário para logs de auditoria JWT
 */
export function logJWTOperation(operation: string, email: string, success: boolean, details?: string) {
  const timestamp = new Date().toISOString()
  const status = success ? '✅' : '❌'
  
  console.log(`${status} [JWT-${operation}] ${timestamp} - ${email} ${details ? `- ${details}` : ''}`)
} 