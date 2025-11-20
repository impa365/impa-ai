/**
 * Sistema de Auditoria de Segurança
 * Logs de eventos críticos para monitoramento
 */

export enum SecurityEventType {
  // Autenticação
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Autorização
  ACCESS_DENIED = 'ACCESS_DENIED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Operações sensíveis
  CONNECTION_CREATED = 'CONNECTION_CREATED',
  CONNECTION_DELETED = 'CONNECTION_DELETED',
  AGENT_CREATED = 'AGENT_CREATED',
  AGENT_DELETED = 'AGENT_DELETED',
  
  // Tentativas suspeitas
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_MANIPULATION = 'TOKEN_MANIPULATION',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
}

export enum SecurityLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export interface SecurityEvent {
  timestamp: string
  type: SecurityEventType
  level: SecurityLevel
  userId?: string
  userEmail?: string
  ip?: string
  userAgent?: string
  resource?: string
  action?: string
  details?: Record<string, any>
  success: boolean
}

/**
 * Registra evento de segurança
 * Em produção, enviar para sistema de logs centralizado (ex: Sentry, LogRocket)
 */
export function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
  const fullEvent: SecurityEvent = {
    timestamp: new Date().toISOString(),
    ...event,
  }

  // Determinar emoji baseado no nível
  const emoji = {
    [SecurityLevel.INFO]: '📋',
    [SecurityLevel.WARNING]: '⚠️',
    [SecurityLevel.CRITICAL]: '🚨',
  }[event.level]

  // Log formatado no servidor
  const logMessage = [
    `${emoji} [SECURITY-${event.level}]`,
    event.type,
    event.userEmail ? `| User: ${event.userEmail}` : '',
    event.ip ? `| IP: ${event.ip}` : '',
    event.resource ? `| Resource: ${event.resource}` : '',
    event.success ? '✅' : '❌',
    event.details ? `| ${JSON.stringify(event.details)}` : '',
  ]
    .filter(Boolean)
    .join(' ')

  console.log(logMessage)

  // TODO: Em produção, enviar para sistema de logs centralizado
  // Exemplos:
  // - Sentry.captureMessage(logMessage, event.level)
  // - LogRocket.track(event.type, fullEvent)
  // - await sendToLogService(fullEvent)
}

/**
 * Extrai informações da requisição para auditoria
 */
export function getRequestInfo(request: Request): Pick<SecurityEvent, 'ip' | 'userAgent'> {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'

  return { ip, userAgent }
}

/**
 * Helpers para eventos comuns
 */

export function logLoginAttempt(
  email: string,
  success: boolean,
  request: Request,
  reason?: string
): void {
  logSecurityEvent({
    type: success ? SecurityEventType.LOGIN_SUCCESS : SecurityEventType.LOGIN_FAILED,
    level: success ? SecurityLevel.INFO : SecurityLevel.WARNING,
    userEmail: email,
    ...getRequestInfo(request),
    success,
    details: reason ? { reason } : undefined,
  })
}

export function logAccessDenied(
  userId: string | undefined,
  userEmail: string | undefined,
  resource: string,
  request: Request,
  reason: string
): void {
  logSecurityEvent({
    type: SecurityEventType.ACCESS_DENIED,
    level: SecurityLevel.WARNING,
    userId,
    userEmail,
    resource,
    ...getRequestInfo(request),
    success: false,
    details: { reason },
  })
}

export function logRateLimitExceeded(
  userId: string | undefined,
  userEmail: string | undefined,
  endpoint: string,
  request: Request
): void {
  logSecurityEvent({
    type: SecurityEventType.RATE_LIMIT_EXCEEDED,
    level: SecurityLevel.WARNING,
    userId,
    userEmail,
    resource: endpoint,
    ...getRequestInfo(request),
    success: false,
  })
}

export function logResourceCreated(
  userId: string,
  userEmail: string,
  resourceType: 'connection' | 'agent',
  resourceId: string,
  request: Request
): void {
  const type = resourceType === 'connection' 
    ? SecurityEventType.CONNECTION_CREATED 
    : SecurityEventType.AGENT_CREATED

  logSecurityEvent({
    type,
    level: SecurityLevel.INFO,
    userId,
    userEmail,
    resource: resourceId,
    action: 'CREATE',
    ...getRequestInfo(request),
    success: true,
  })
}

export function logResourceDeleted(
  userId: string,
  userEmail: string,
  resourceType: 'connection' | 'agent',
  resourceId: string,
  request: Request
): void {
  const type = resourceType === 'connection' 
    ? SecurityEventType.CONNECTION_DELETED 
    : SecurityEventType.AGENT_DELETED

  logSecurityEvent({
    type,
    level: SecurityLevel.WARNING,
    userId,
    userEmail,
    resource: resourceId,
    action: 'DELETE',
    ...getRequestInfo(request),
    success: true,
  })
}

export function logSuspiciousActivity(
  userId: string | undefined,
  userEmail: string | undefined,
  activity: string,
  request: Request,
  details?: Record<string, any>
): void {
  logSecurityEvent({
    type: SecurityEventType.SUSPICIOUS_ACTIVITY,
    level: SecurityLevel.CRITICAL,
    userId,
    userEmail,
    ...getRequestInfo(request),
    success: false,
    details: { activity, ...details },
  })
}

/**
 * Log de acesso a dados sensíveis (API Keys, Credenciais, etc)
 */
export async function logSensitiveDataAccess(
  dataType: string,
  userEmail: string,
  ipAddress: string,
  details: string
): Promise<void> {
  const timestamp = new Date().toISOString()
  console.log(`🔐 [SENSITIVE-DATA-ACCESS] ${timestamp} - ${userEmail} - ${dataType}`)
  console.log(`   IP: ${ipAddress}`)
  console.log(`   Details: ${details}`)
  
  // TODO: Salvar em banco de dados para auditoria
  // await saveSensitiveDataAccessLog({ timestamp, userEmail, dataType, ipAddress, details })
}

/**
 * Log simplificado de acesso negado (sem request object)
 */
export async function logAccessDeniedSimple(
  eventType: string,
  reason: string,
  ipAddress: string,
  details: string
): Promise<void> {
  const timestamp = new Date().toISOString()
  console.log(`⛔ [ACCESS-DENIED] ${timestamp} - ${eventType}`)
  console.log(`   Reason: ${reason}`)
  console.log(`   IP: ${ipAddress}`)
  console.log(`   Details: ${details}`)
}
