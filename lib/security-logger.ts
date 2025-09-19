import { NextRequest } from 'next/server'
import { frontendLogger } from './frontend-logger'

// Tipos de eventos de segurança
export enum SecurityEventType {
  AUTH_SUCCESS = 'auth_success',
  AUTH_FAILURE = 'auth_failure',
  AUTH_ATTEMPT = 'auth_attempt',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  INVALID_INPUT = 'invalid_input',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  CORS_VIOLATION = 'cors_violation',
  ADMIN_ACTION = 'admin_action',
  DATA_ACCESS = 'data_access',
  FILE_UPLOAD = 'file_upload',
  PAYMENT_ATTEMPT = 'payment_attempt',
  ORDER_MANIPULATION = 'order_manipulation',
  BRUTE_FORCE_DETECTED = 'brute_force_detected',
  PRIVILEGE_ESCALATION = 'privilege_escalation'
}

// Níveis de severidade
export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Interface para evento de segurança
interface SecurityEvent {
  type: SecurityEventType
  severity: SecuritySeverity
  message: string
  details?: Record<string, any>
  request?: {
    ip: string
    userAgent: string
    origin?: string
    method: string
    url: string
    timestamp: string
  }
  user?: {
    id?: string
    email?: string
    role?: string
  }
  metadata?: {
    sessionId?: string
    requestId?: string
    correlationId?: string
  }
}

/**
 * Extrai informações da requisição para logs
 */
function extractRequestInfo(request: NextRequest): SecurityEvent['request'] {
  return {
    ip: request.ip || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    origin: request.headers.get('origin') || undefined,
    method: request.method,
    url: request.url,
    timestamp: new Date().toISOString()
  }
}

/**
 * Classe principal para logging de segurança
 */
export class SecurityLogger {
  private static instance: SecurityLogger
  private events: SecurityEvent[] = []
  private maxEvents = 10000 // Máximo de eventos em memória
  
  private constructor() {}
  
  static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger()
    }
    return SecurityLogger.instance
  }
  
  /**
   * Log de evento de segurança
   */
  logSecurityEvent(
    type: SecurityEventType,
    severity: SecuritySeverity,
    message: string,
    request?: NextRequest,
    details?: Record<string, any>,
    user?: SecurityEvent['user']
  ): void {
    const event: SecurityEvent = {
      type,
      severity,
      message,
      details: this.sanitizeDetails(details),
      request: request ? extractRequestInfo(request) : undefined,
      user: this.sanitizeUser(user),
      metadata: {
        requestId: this.generateRequestId(),
        correlationId: this.generateCorrelationId()
      }
    }
    
    // Adicionar ao cache em memória
    this.events.push(event)
    
    // Limitar tamanho do cache
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }
    
    // Log usando o sistema existente
    this.logToFrontendLogger(event)
    
    // Para eventos críticos, log adicional
    if (severity === SecuritySeverity.CRITICAL) {
      this.handleCriticalEvent(event)
    }
  }
  
  /**
   * Sanitiza detalhes para evitar vazamento de dados sensíveis
   */
  private sanitizeDetails(details?: Record<string, any>): Record<string, any> | undefined {
    if (!details) return undefined
    
    const sanitized = { ...details }
    
    // Campos sensíveis para mascarar
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization']
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***MASKED***'
      }
    }
    
    // Mascarar emails
    if (sanitized.email && typeof sanitized.email === 'string') {
      sanitized.email = sanitized.email.replace(/(.{2}).*(@.*)/, '$1***$2')
    }
    
    return sanitized
  }
  
  /**
   * Sanitiza informações do usuário
   */
  private sanitizeUser(user?: SecurityEvent['user']): SecurityEvent['user'] | undefined {
    if (!user) return undefined
    
    return {
      id: user.id,
      email: user.email ? user.email.replace(/(.{2}).*(@.*)/, '$1***$2') : undefined,
      role: user.role
    }
  }
  
  /**
   * Log usando o frontend logger existente
   */
  private logToFrontendLogger(event: SecurityEvent): void {
    const logData = {
      securityEvent: event.type,
      severity: event.severity,
      message: event.message,
      ip: event.request?.ip,
      userAgent: event.request?.userAgent,
      details: event.details
    }
    
    switch (event.severity) {
      case SecuritySeverity.CRITICAL:
      case SecuritySeverity.HIGH:
        frontendLogger.logError(event.message, logData, new Error(event.message), 'api')
        break
      case SecuritySeverity.MEDIUM:
        frontendLogger.warn(event.message, 'api', logData)
        break
      case SecuritySeverity.LOW:
      default:
        frontendLogger.info(event.message, 'api', logData)
        break
    }
  }
  
  /**
   * Manipula eventos críticos
   */
  private handleCriticalEvent(event: SecurityEvent): void {
    // Log adicional para eventos críticos
    console.error('🚨 EVENTO CRÍTICO DE SEGURANÇA:', {
      type: event.type,
      message: event.message,
      timestamp: new Date().toISOString(),
      ip: event.request?.ip,
      details: event.details
    })
    
    // Aqui poderia integrar com sistemas de alerta (email, Slack, etc.)
    // this.sendAlert(event)
  }
  
  /**
   * Gera ID único para requisição
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * Gera ID de correlação
   */
  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * Obtém eventos recentes
   */
  getRecentEvents(limit: number = 100): SecurityEvent[] {
    return this.events.slice(-limit)
  }
  
  /**
   * Filtra eventos por tipo
   */
  getEventsByType(type: SecurityEventType, limit: number = 100): SecurityEvent[] {
    return this.events
      .filter(event => event.type === type)
      .slice(-limit)
  }
  
  /**
   * Filtra eventos por severidade
   */
  getEventsBySeverity(severity: SecuritySeverity, limit: number = 100): SecurityEvent[] {
    return this.events
      .filter(event => event.severity === severity)
      .slice(-limit)
  }
  
  /**
   * Obtém estatísticas de segurança
   */
  getSecurityStats(): {
    totalEvents: number
    eventsByType: Record<string, number>
    eventsBySeverity: Record<string, number>
    recentCriticalEvents: number
  } {
    const eventsByType: Record<string, number> = {}
    const eventsBySeverity: Record<string, number> = {}
    
    // Contar eventos das últimas 24 horas
    const last24h = Date.now() - (24 * 60 * 60 * 1000)
    const recentEvents = this.events.filter(event => 
      event.request && new Date(event.request.timestamp).getTime() > last24h
    )
    
    for (const event of this.events) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1
    }
    
    const recentCriticalEvents = recentEvents.filter(
      event => event.severity === SecuritySeverity.CRITICAL
    ).length
    
    return {
      totalEvents: this.events.length,
      eventsByType,
      eventsBySeverity,
      recentCriticalEvents
    }
  }
}

// Instância singleton
const securityLogger = SecurityLogger.getInstance()

// Funções de conveniência para diferentes tipos de eventos
export const logAuthSuccess = (
  request: NextRequest,
  user: { id: string; email: string; role: string },
  details?: Record<string, any>
) => {
  securityLogger.logSecurityEvent(
    SecurityEventType.AUTH_SUCCESS,
    SecuritySeverity.LOW,
    'Autenticação realizada com sucesso',
    request,
    details,
    user
  )
}

export const logAuthFailure = (
  request: NextRequest,
  reason: string,
  details?: Record<string, any>
) => {
  securityLogger.logSecurityEvent(
    SecurityEventType.AUTH_FAILURE,
    SecuritySeverity.MEDIUM,
    `Falha na autenticação: ${reason}`,
    request,
    details
  )
}

export const logSuspiciousActivity = (
  request: NextRequest,
  activity: string,
  details?: Record<string, any>
) => {
  securityLogger.logSecurityEvent(
    SecurityEventType.SUSPICIOUS_ACTIVITY,
    SecuritySeverity.HIGH,
    `Atividade suspeita: ${activity}`,
    request,
    details
  )
}

export const logRateLimitExceeded = (
  request: NextRequest,
  limitType: string,
  details?: Record<string, any>
) => {
  securityLogger.logSecurityEvent(
    SecurityEventType.RATE_LIMIT_EXCEEDED,
    SecuritySeverity.MEDIUM,
    `Rate limit excedido: ${limitType}`,
    request,
    details
  )
}

export const logUnauthorizedAccess = (
  request: NextRequest,
  resource: string,
  user?: SecurityEvent['user'],
  details?: Record<string, any>
) => {
  securityLogger.logSecurityEvent(
    SecurityEventType.UNAUTHORIZED_ACCESS,
    SecuritySeverity.HIGH,
    `Acesso não autorizado: ${resource}`,
    request,
    details,
    user
  )
}

export const logAdminAction = (
  request: NextRequest,
  action: string,
  admin: { id: string; email: string; role: string },
  details?: Record<string, any>
) => {
  securityLogger.logSecurityEvent(
    SecurityEventType.ADMIN_ACTION,
    SecuritySeverity.LOW,
    `Ação administrativa: ${action}`,
    request,
    details,
    admin
  )
}

export const logBruteForceDetected = (
  request: NextRequest,
  attempts: number,
  details?: Record<string, any>
) => {
  securityLogger.logSecurityEvent(
    SecurityEventType.BRUTE_FORCE_DETECTED,
    SecuritySeverity.CRITICAL,
    `Ataque de força bruta detectado: ${attempts} tentativas`,
    request,
    details
  )
}

export const logPaymentAttempt = (
  request: NextRequest,
  orderId: string,
  amount: number,
  success: boolean,
  details?: Record<string, any>
) => {
  securityLogger.logSecurityEvent(
    SecurityEventType.PAYMENT_ATTEMPT,
    success ? SecuritySeverity.LOW : SecuritySeverity.MEDIUM,
    `Tentativa de pagamento ${success ? 'bem-sucedida' : 'falhada'}: Pedido ${orderId}, Valor ${amount}`,
    request,
    details
  )
}

// Exportar instância para acesso direto
export { securityLogger }
export default SecurityLogger