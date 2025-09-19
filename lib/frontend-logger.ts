// Sistema de logging seguro para o frontend
import { getGlobalLoggingConfig, isContextEnabled } from './logging-config'

// Tipos específicos do frontend
export interface FrontendLogEntry {
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical'
  message: string
  context: 'ui' | 'api' | 'auth' | 'navigation' | 'performance' | 'user-action'
  timestamp: string
  sessionId: string
  userId?: string
  url?: string
  userAgent?: string
  data?: any
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
  }
  metadata?: Record<string, any>
}

export interface UserFriendlyError {
  title: string
  message: string
  action?: string
  code?: string
}

class FrontendLogger {
  private config = getGlobalLoggingConfig()
  private sessionId: string
  private userId?: string
  private logBuffer: FrontendLogEntry[] = []
  private isProduction = process.env.NODE_ENV === 'production'
  private errorCount = 0
  private lastErrorTime = 0
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>()

  constructor() {
    this.sessionId = this.generateSessionId()
    this.setupGlobalErrorHandlers()
    this.startPeriodicCleanup()
  }

  // Configurar handlers globais de erro
  private setupGlobalErrorHandlers(): void {
    if (!this.config.contexts.frontend.enableGlobalErrorCapture) return

    // Capturar erros JavaScript não tratados
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.logError('Erro JavaScript não tratado', {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          message: event.message
        }, event.error)
      })

      // Capturar promises rejeitadas não tratadas
      window.addEventListener('unhandledrejection', (event) => {
        this.logError('Promise rejeitada não tratada', {
          reason: event.reason
        }, event.reason instanceof Error ? event.reason : new Error(String(event.reason)))
      })

      // Capturar erros de recursos (imagens, scripts, etc.)
      window.addEventListener('error', (event) => {
        if (event.target !== window) {
          this.logError('Erro ao carregar recurso', {
            tagName: (event.target as any)?.tagName,
            src: (event.target as any)?.src || (event.target as any)?.href,
            type: event.type
          })
        }
      }, true)
    }
  }

  // Gerar ID de sessão único
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Verificar rate limiting
  private isRateLimited(level: string): boolean {
    if (!this.config.rateLimiting.enabled) return false

    const now = Date.now()
    const key = `${level}_${Math.floor(now / 60000)}`
    
    const current = this.rateLimitMap.get(key) || { count: 0, resetTime: now + 60000 }
    
    if (now > current.resetTime) {
      this.rateLimitMap.delete(key)
      return false
    }
    
    if (current.count >= this.config.rateLimiting.maxLogsPerMinute) {
      return true
    }
    
    current.count++
    this.rateLimitMap.set(key, current)
    return false
  }

  // Sanitizar dados para o frontend
  private sanitizeForFrontend(data: any): any {
    if (!data) return data

    // Em produção, sempre sanitizar
    if (this.isProduction) {
      return this.deepSanitize(data)
    }

    // Em desenvolvimento, sanitizar apenas dados sensíveis
    return this.sanitizeSensitiveData(data)
  }

  private deepSanitize(obj: any): any {
    if (obj === null || obj === undefined) return obj
    if (typeof obj !== 'object') return '[SANITIZED]'
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepSanitize(item))
    }

    const sanitized: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = this.deepSanitize(obj[key])
      }
    }
    return sanitized
  }

  private sanitizeSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') return data

    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'authorization',
      'credit_card', 'card_number', 'cvv', 'ssn', 'cpf'
    ]

    const sanitized = { ...data }
    
    for (const key in sanitized) {
      if (sensitiveKeys.some(sensitive => 
        key.toLowerCase().includes(sensitive.toLowerCase())
      )) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeSensitiveData(sanitized[key])
      }
    }

    return sanitized
  }

  // Converter erro para formato seguro
  private sanitizeError(error: Error): FrontendLogEntry['error'] {
    const sanitizedError: FrontendLogEntry['error'] = {
      name: error.name,
      message: error.message,
      code: (error as any).code
    }

    // Incluir stack trace apenas em desenvolvimento
    if (!this.isProduction && error.stack) {
      sanitizedError.stack = error.stack
    }

    return sanitizedError
  }

  // Criar entrada de log
  private createLogEntry(
    level: FrontendLogEntry['level'],
    message: string,
    context: FrontendLogEntry['context'],
    data?: any,
    error?: Error,
    metadata?: Record<string, any>
  ): FrontendLogEntry {
    return {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      data: this.sanitizeForFrontend(data),
      error: error ? this.sanitizeError(error) : undefined,
      metadata
    }
  }

  // Métodos públicos de logging
  debug(message: string, context: FrontendLogEntry['context'] = 'ui', data?: any): void {
    if (!isContextEnabled('frontend', 'debug') || this.isRateLimited('debug')) return
    
    const entry = this.createLogEntry('debug', message, context, data)
    this.addToBuffer(entry)
    
    if (!this.isProduction) {
      console.debug(`[${context.toUpperCase()}] ${message}`, data)
    }
  }

  info(message: string, context: FrontendLogEntry['context'] = 'ui', data?: any): void {
    if (!isContextEnabled('frontend', 'info') || this.isRateLimited('info')) return
    
    const entry = this.createLogEntry('info', message, context, data)
    this.addToBuffer(entry)
    
    if (!this.isProduction) {
      console.info(`[${context.toUpperCase()}] ${message}`, data)
    }
  }

  warn(message: string, context: FrontendLogEntry['context'] = 'ui', data?: any): void {
    if (!isContextEnabled('frontend', 'warnings') || this.isRateLimited('warn')) return
    
    const entry = this.createLogEntry('warn', message, context, data)
    this.addToBuffer(entry)
    
    if (!this.isProduction) {
      console.warn(`[${context.toUpperCase()}] ${message}`, data)
    }
  }

  logError(message: string, data?: any, error?: Error, context: FrontendLogEntry['context'] = 'ui'): void {
    if (!isContextEnabled('frontend', 'errors') || this.isRateLimited('error')) return
    
    this.errorCount++
    this.lastErrorTime = Date.now()
    
    const entry = this.createLogEntry('error', message, context, data, error)
    this.addToBuffer(entry)
    
    // Em desenvolvimento, sempre mostrar no console
    if (!this.isProduction) {
      console.error(`[${context.toUpperCase()}] ${message}`, data, error)
    }
  }

  logCritical(message: string, data?: any, error?: Error, context: FrontendLogEntry['context'] = 'ui'): void {
    this.errorCount++
    this.lastErrorTime = Date.now()
    
    const entry = this.createLogEntry('critical', message, context, data, error)
    this.addToBuffer(entry)
    
    // Erros críticos sempre são enviados para serviços externos
    this.sendToExternalService(entry)
    
    // Em desenvolvimento, sempre mostrar no console
    if (!this.isProduction) {
      console.error(`[CRITICAL][${context.toUpperCase()}] ${message}`, data, error)
    }
  }

  // Log de ações do usuário
  logUserAction(action: string, data?: any): void {
    if (!isContextEnabled('frontend', 'userActions')) return
    
    this.info(`Ação do usuário: ${action}`, 'user-action', data)
  }

  // Log de performance
  logPerformance(metric: string, value: number, unit: string = 'ms'): void {
    this.info(`Performance: ${metric}`, 'performance', { value, unit })
  }

  // Definir usuário atual
  setUserId(userId: string): void {
    this.userId = userId
  }

  // Limpar usuário
  clearUserId(): void {
    this.userId = undefined
  }

  // Obter estatísticas
  getStats(): {
    sessionId: string
    userId?: string
    errorCount: number
    lastErrorTime: number
    bufferSize: number
  } {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      errorCount: this.errorCount,
      lastErrorTime: this.lastErrorTime,
      bufferSize: this.logBuffer.length
    }
  }

  // Obter logs recentes (para debug)
  getRecentLogs(count: number = 10): FrontendLogEntry[] {
    return this.logBuffer.slice(-count)
  }

  // Converter erro para mensagem amigável
  getErrorMessage(error: Error): UserFriendlyError {
    // Mapear erros comuns para mensagens amigáveis
    const errorMappings: Record<string, UserFriendlyError> = {
      'NetworkError': {
        title: 'Problema de Conexão',
        message: 'Verifique sua conexão com a internet e tente novamente.',
        action: 'Tentar Novamente'
      },
      'TypeError': {
        title: 'Erro Interno',
        message: 'Ocorreu um erro inesperado. Nossa equipe foi notificada.',
        action: 'Recarregar Página'
      },
      'AuthError': {
        title: 'Erro de Autenticação',
        message: 'Sua sessão expirou. Faça login novamente.',
        action: 'Fazer Login'
      },
      'ValidationError': {
        title: 'Dados Inválidos',
        message: 'Verifique os dados informados e tente novamente.',
        action: 'Corrigir'
      }
    }

    // Verificar se é um erro conhecido
    for (const [errorType, userError] of Object.entries(errorMappings)) {
      if (error.name.includes(errorType) || error.message.includes(errorType)) {
        return { ...userError, code: (error as any).code }
      }
    }

    // Erro genérico
    return {
      title: 'Erro Inesperado',
      message: 'Algo deu errado. Tente novamente em alguns instantes.',
      action: 'Tentar Novamente',
      code: (error as any).code
    }
  }

  // Métodos privados
  private addToBuffer(entry: FrontendLogEntry): void {
    this.logBuffer.push(entry)
    
    // Limitar tamanho do buffer
    const maxBuffer = this.config.retention.maxLogHistory
    if (this.logBuffer.length > maxBuffer) {
      this.logBuffer = this.logBuffer.slice(-maxBuffer)
    }
  }

  private async sendToExternalService(entry: FrontendLogEntry): Promise<void> {
    if (!this.config.production.enableErrorReporting) return
    
    try {
      // Aqui você pode integrar com serviços como Sentry, LogRocket, etc.
      // Por enquanto, apenas simular o envio
      if (this.isProduction) {
        // await sendToSentry(entry)
        // await sendToLogRocket(entry)
      }
    } catch (error) {
      // Falha silenciosa para não criar loops de erro
      if (!this.isProduction) {
        console.error('Failed to send log to external service:', error)
      }
    }
  }

  private startPeriodicCleanup(): void {
    if (typeof window === 'undefined') return
    
    const interval = this.config.retention.cleanupInterval
    setInterval(() => {
      this.cleanup()
    }, interval)
  }

  private cleanup(): void {
    // Limpar rate limit map
    const now = Date.now()
    const entries = Array.from(this.rateLimitMap.entries())
    for (const [key, data] of entries) {
      if (now > data.resetTime) {
        this.rateLimitMap.delete(key)
      }
    }
    
    // Limitar buffer de logs
    const maxBuffer = this.config.retention.maxLogHistory
    if (this.logBuffer.length > maxBuffer) {
      this.logBuffer = this.logBuffer.slice(-maxBuffer)
    }
  }
}

// Instância singleton
export const frontendLogger = new FrontendLogger()

// Hook para React
export function useFrontendLogger() {
  return {
    debug: frontendLogger.debug.bind(frontendLogger),
    info: frontendLogger.info.bind(frontendLogger),
    warn: frontendLogger.warn.bind(frontendLogger),
    logError: frontendLogger.logError.bind(frontendLogger),
    logCritical: frontendLogger.logCritical.bind(frontendLogger),
    logUserAction: frontendLogger.logUserAction.bind(frontendLogger),
    logPerformance: frontendLogger.logPerformance.bind(frontendLogger),
    setUserId: frontendLogger.setUserId.bind(frontendLogger),
    clearUserId: frontendLogger.clearUserId.bind(frontendLogger),
    getStats: frontendLogger.getStats.bind(frontendLogger),
    getErrorMessage: frontendLogger.getErrorMessage.bind(frontendLogger)
  }
}

export default frontendLogger