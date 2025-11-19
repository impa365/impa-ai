/**
 * Rate Limiting para APIs
 * Previne abuso e ataques de força bruta
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// Armazenamento em memória (para produção, usar Redis)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Limpar entradas expiradas a cada 5 minutos
setInterval(() => {
  const now = Date.now()
  rateLimitStore.forEach((entry, key) => {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  })
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  windowMs: number // Janela de tempo em ms
  maxRequests: number // Máximo de requisições na janela
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

/**
 * Verifica rate limit para um identificador
 * @param identifier - IP ou user ID
 * @param config - Configuração do rate limit
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  // Se não existe ou expirou, criar nova entrada
  if (!entry || now > entry.resetTime) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    }
    rateLimitStore.set(identifier, newEntry)

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
    }
  }

  // Incrementar contador
  entry.count++

  // Verificar se excedeu o limite
  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000), // em segundos
    }
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  }
}

/**
 * Extrai identificador da requisição (IP ou user ID)
 */
export function getRequestIdentifier(request: Request, userId?: string): string {
  // Priorizar user ID se disponível
  if (userId) {
    return `user:${userId}`
  }

  // Tentar pegar IP real (considerando proxies)
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  const ip = forwarded?.split(",")[0] || realIp || "unknown"

  return `ip:${ip}`
}

/**
 * Presets de rate limiting por tipo de operação
 */
export const RATE_LIMITS = {
  // Autenticação - mais restritivo
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 5, // 5 tentativas
  },
  
  // APIs de leitura - moderado
  READ: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    maxRequests: 60, // 60 requisições por minuto
  },
  
  // APIs de escrita - mais restritivo
  WRITE: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    maxRequests: 10, // 10 requisições por minuto
  },
  
  // Operações sensíveis - muito restritivo
  SENSITIVE: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    maxRequests: 3, // 3 requisições por minuto
  },
} as const
