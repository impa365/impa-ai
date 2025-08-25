import crypto from "crypto";

// Configurações de segurança
const SECURITY_CONFIG = {
  MAX_ATTEMPTS_PER_IP: 5, // Máximo de tentativas por IP
  BLOCK_DURATION_MINUTES: 15, // Duração do bloqueio em minutos
  TOKEN_ENTROPY_BYTES: 32, // Bytes de entropia para tokens
  PASSWORD_MIN_LENGTH: 6,
  SESSION_TIMEOUT_MINUTES: 30,
  RATE_LIMIT_WINDOW_MINUTES: 1,
  MAX_REQUESTS_PER_MINUTE: 10
};

// Store para rate limiting e bloqueios (em produção, usar Redis)
const securityStore = new Map<string, any>();

interface SecurityAttempt {
  count: number;
  lastAttempt: number;
  blockedUntil?: number;
}

interface RateLimitData {
  requests: number[];
  lastReset: number;
}

// Gerar token ultra-seguro
export function generateUltraSecureToken(): string {
  // Usar múltiplas fontes de entropia
  const randomBytes = crypto.randomBytes(SECURITY_CONFIG.TOKEN_ENTROPY_BYTES);
  const timestamp = Date.now();
  const nonce = crypto.randomUUID();
  
  // Combinar e hash
  const combined = `${randomBytes.toString('hex')}_${timestamp}_${nonce}`;
  const hash = crypto.createHash('sha256').update(combined).digest('hex');
  
  // Usar apenas parte do hash para evitar tokens muito longos
  return hash.substring(0, 40) + timestamp.toString(36);
}

// Verificar força da senha
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!password || password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
    errors.push(`Senha deve ter pelo menos ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} caracteres`);
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Senha deve conter pelo menos uma letra minúscula");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Senha deve conter pelo menos uma letra maiúscula");
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push("Senha deve conter pelo menos um número");
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Hash de senha super seguro
export function hashPasswordSecure(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(64).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 310000, 128, 'sha512').toString('hex');
  return { hash, salt };
}

// Verificar senha com timing-safe comparison
export function verifyPasswordSecure(password: string, hash: string, salt: string): boolean {
  try {
    const testHash = crypto.pbkdf2Sync(password, salt, 310000, 128, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(testHash, 'hex'));
  } catch {
    return false;
  }
}

// Rate limiting por IP
export function checkRateLimit(ip: string): { allowed: boolean; resetTime?: number } {
  const key = `rate_${ip}`;
  const now = Date.now();
  
  let data: RateLimitData = securityStore.get(key) || {
    requests: [],
    lastReset: now
  };
  
  // Reset a cada minuto
  if (now - data.lastReset > SECURITY_CONFIG.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000) {
    data = { requests: [], lastReset: now };
  }
  
  // Remover requests antigos
  const windowStart = now - (SECURITY_CONFIG.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
  data.requests = data.requests.filter(timestamp => timestamp > windowStart);
  
  // Verificar limite
  if (data.requests.length >= SECURITY_CONFIG.MAX_REQUESTS_PER_MINUTE) {
    securityStore.set(key, data);
    return { 
      allowed: false, 
      resetTime: data.lastReset + (SECURITY_CONFIG.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000)
    };
  }
  
  // Adicionar request atual
  data.requests.push(now);
  securityStore.set(key, data);
  
  return { allowed: true };
}

// Verificar tentativas de login falhadas
export function checkFailedAttempts(ip: string): { allowed: boolean; blockedUntil?: number } {
  const key = `attempts_${ip}`;
  const now = Date.now();
  
  const attempts: SecurityAttempt = securityStore.get(key) || {
    count: 0,
    lastAttempt: 0
  };
  
  // Verificar se ainda está bloqueado
  if (attempts.blockedUntil && now < attempts.blockedUntil) {
    return { allowed: false, blockedUntil: attempts.blockedUntil };
  }
  
  // Reset do contador se passou muito tempo
  if (now - attempts.lastAttempt > SECURITY_CONFIG.BLOCK_DURATION_MINUTES * 60 * 1000) {
    attempts.count = 0;
    attempts.blockedUntil = undefined;
  }
  
  return { allowed: attempts.count < SECURITY_CONFIG.MAX_ATTEMPTS_PER_IP };
}

// Registrar tentativa falhada
export function recordFailedAttempt(ip: string): void {
  const key = `attempts_${ip}`;
  const now = Date.now();
  
  const attempts: SecurityAttempt = securityStore.get(key) || {
    count: 0,
    lastAttempt: 0
  };
  
  attempts.count++;
  attempts.lastAttempt = now;
  
  // Bloquear se atingiu o limite
  if (attempts.count >= SECURITY_CONFIG.MAX_ATTEMPTS_PER_IP) {
    attempts.blockedUntil = now + (SECURITY_CONFIG.BLOCK_DURATION_MINUTES * 60 * 1000);
  }
  
  securityStore.set(key, attempts);
}

// Limpar tentativas após sucesso
export function clearFailedAttempts(ip: string): void {
  const key = `attempts_${ip}`;
  securityStore.delete(key);
}

// Validar token format
export function validateTokenFormat(token: string): boolean {
  // Token deve ter pelo menos 20 caracteres e formato alfanumérico válido
  // Aceitar diferentes formatos: hex, base64url, etc.
  const tokenRegex = /^[a-zA-Z0-9_-]{20,}$/;
  return tokenRegex.test(token) && token.length >= 20 && token.length <= 100;
}

// Sanitizar IP
export function sanitizeIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  let ip = forwarded?.split(',')[0]?.trim() || realIP || 'unknown';
  
  // Remover IPv6 prefix se presente
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  
  // Validar formato de IP
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Regex.test(ip) && ip !== 'unknown') {
    ip = 'unknown';
  }
  
  return ip;
}

// Gerar headers de segurança
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  };
}

// Log de segurança estruturado
export function logSecurityEvent(event: {
  type: 'ACCESS_ATTEMPT' | 'FAILED_AUTH' | 'RATE_LIMIT' | 'SUSPICIOUS_ACTIVITY';
  ip: string;
  userAgent?: string;
  token?: string;
  details?: any;
}): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...event,
    // Mascarar token para logs
    token: event.token ? `${event.token.substring(0, 8)}...` : undefined
  };
  
  console.log(`🔒 [SECURITY] ${JSON.stringify(logEntry)}`);
  
  // Em produção, enviar para sistema de monitoramento
  // await sendToSecurityMonitoring(logEntry);
}

export { SECURITY_CONFIG }; 