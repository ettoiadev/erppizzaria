// Sistema de logging avançado para PostgreSQL
import { getGlobalLoggingConfig, isLogLevelEnabled, isContextEnabled, type LoggingConfig } from './logging-config'

// Tipos de log
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'
export type LogContext = 'auth' | 'api' | 'payment' | 'general' | 'environment'

interface LogEntry {
  level: LogLevel
  context: LogContext
  message: string
  data?: any
  error?: Error
  timestamp: string
  userId?: string
  requestId?: string
  userAgent?: string
  ip?: string
}

interface LoggerConfig {
  enableConsoleLogging: boolean
  enableDetailedLogging: boolean
  enableErrorReporting: boolean
  logLevel: LogLevel
  sensitiveFields: string[]
  maxLogLength: number
}

class AdvancedLogger {
  private config: LoggingConfig
  private isProduction: boolean
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map()

  constructor() {
    this.config = getGlobalLoggingConfig()
    this.isProduction = process.env.NODE_ENV === 'production'
  }

  private shouldLog(level: LogLevel, context?: LogContext): boolean {
    if (!this.config.enabled) return false
    
    // Verificar rate limiting
    if (this.config.rateLimiting.enabled && this.isRateLimited(level)) {
      return false
    }
    
    return isLogLevelEnabled(level)
  }
  
  private isRateLimited(level: LogLevel): boolean {
    const now = Date.now()
    const key = `${level}_${Math.floor(now / 60000)}` // Por minuto
    
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

  private sanitizeData(data: any, context?: LogContext): any {
    if (!data || typeof data !== 'object') return data
    
    // Verificar se deve sanitizar baseado na configuração
    if (!this.config.production.sanitizeData && !this.isProduction) {
      return data
    }
    
    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'authorization',
      'credit_card', 'card_number', 'cvv', 'ssn', 'cpf', 'email'
    ]
    
    // Adicionar chaves específicas por contexto
    if (context === 'payment') {
      sensitiveKeys.push('amount', 'card_holder', 'billing_address')
    }
    
    if (context === 'auth') {
      sensitiveKeys.push('phone', 'address', 'document')
    }
    
    const sanitized = { ...data }
    
    for (const key in sanitized) {
      if (sensitiveKeys.some(sensitive => 
        key.toLowerCase().includes(sensitive.toLowerCase())
      )) {
        if (key.toLowerCase().includes('email') && context !== 'payment') {
          // Mascarar email parcialmente
          const email = sanitized[key]
          if (typeof email === 'string' && email.includes('@')) {
            const [local, domain] = email.split('@')
            sanitized[key] = `${local.substring(0, 2)}***@${domain}`
          } else {
            sanitized[key] = '[REDACTED]'
          }
        } else {
          sanitized[key] = '[REDACTED]'
        }
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeData(sanitized[key], context)
      }
    }
    
    return sanitized
  }

  private formatLogEntry(entry: LogEntry): string {
    const config = this.config.console
    let message = ''
    
    // Timestamp
    if (config.timestamp) {
      const timestamp = entry.timestamp
      message += `[${timestamp}] `
    }
    
    // Level
    const level = entry.level.toUpperCase().padEnd(8)
    message += `${level} `
    
    // Context
    const context = entry.context.toUpperCase().padEnd(10)
    message += `[${context}] `
    
    // Message
    message += entry.message
    
    // Data (se detalhado estiver habilitado)
    if (entry.data && config.detailed) {
      const sanitizedData = this.sanitizeData(entry.data, entry.context)
      message += `\n  Data: ${JSON.stringify(sanitizedData, null, 2)}`
    }
    
    // Error (se detalhado estiver habilitado)
    if (entry.error && config.detailed) {
      message += `\n  Error: ${entry.error.message}`
      if (entry.error.stack && !this.config.production.hideStackTraces) {
        message += `\n  Stack: ${entry.error.stack}`
      }
    }
    
    // Request ID
    if (entry.requestId) {
      message += ` [REQ:${entry.requestId}]`
    }
    
    // User ID
    if (entry.userId) {
      message += ` [USER:${entry.userId}]`
    }
    
    // Limitar tamanho do log
    const maxLength = this.config.production.maxLogLength
    if (message.length > maxLength) {
      message = message.substring(0, maxLength) + '... [TRUNCATED]'
    }
    
    return message
  }

  private writeToConsole(entry: LogEntry): void {
    if (!this.config.console.enabled) return
    
    const formattedMessage = this.formatLogEntry(entry)
    
    // Aplicar cores se habilitado
    let coloredMessage = formattedMessage
    if (this.config.console.colorize && !this.isProduction) {
      const colors = {
        debug: '\x1b[36m',    // Cyan
        info: '\x1b[32m',     // Green
        warn: '\x1b[33m',     // Yellow
        error: '\x1b[31m',    // Red
        critical: '\x1b[35m'  // Magenta
      }
      const reset = '\x1b[0m'
      coloredMessage = `${colors[entry.level]}${formattedMessage}${reset}`
    }
    
    switch (entry.level) {
      case 'debug':
        console.debug(coloredMessage)
        break
      case 'info':
        console.info(coloredMessage)
        break
      case 'warn':
        console.warn(coloredMessage)
        break
      case 'error':
      case 'critical':
        console.error(coloredMessage)
        break
    }
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    if (!this.config.production.enableErrorReporting || entry.level !== 'critical') return
    
    try {
      // Aqui você pode integrar com serviços como Sentry, LogRocket, etc.
      // Por enquanto, apenas simular o envio
      if (this.isProduction) {
        // await sendToSentry(entry)
        // await sendToLogRocket(entry)
        console.error('CRITICAL ERROR:', {
          message: entry.message,
          context: entry.context,
          timestamp: entry.timestamp,
          error: entry.error?.message
        })
      }
    } catch (error) {
      // Falha silenciosa para não criar loops de erro
      console.error('Failed to send log to external service:', error)
    }
  }

  public log(level: LogLevel, context: LogContext, message: string, data?: any, error?: Error, metadata?: Partial<LogEntry>): void {
    if (!this.shouldLog(level, context)) return

    const entry: LogEntry = {
      level,
      context,
      message,
      data: this.sanitizeData(data, context),
      error,
      timestamp: new Date().toISOString(),
      ...metadata
    }

    this.writeToConsole(entry)
    this.sendToExternalService(entry)
  }

  // Métodos de conveniência
  public debug(context: LogContext, message: string, data?: any, metadata?: Partial<LogEntry>): void {
    this.log('debug', context, message, data, undefined, metadata)
  }

  public info(context: LogContext, message: string, data?: any, metadata?: Partial<LogEntry>): void {
    this.log('info', context, message, data, undefined, metadata)
  }

  public warn(context: LogContext, message: string, data?: any, metadata?: Partial<LogEntry>): void {
    this.log('warn', context, message, data, undefined, metadata)
  }

  public error(context: LogContext, message: string, error?: Error, data?: any, metadata?: Partial<LogEntry>): void {
    this.log('error', context, message, data, error, metadata)
  }

  public critical(context: LogContext, message: string, error?: Error, data?: any, metadata?: Partial<LogEntry>): void {
    this.log('critical', context, message, data, error, metadata)
  }

  // Métodos específicos para contextos


  public api = {
    request: (method: string, path: string, data?: any, metadata?: Partial<LogEntry>) => {
      this.info('api', `${method} ${path}`, data, metadata)
    },
    response: (method: string, path: string, status: number, data?: any, metadata?: Partial<LogEntry>) => {
      const level = status >= 400 ? 'error' : 'info'
      this.log(level, 'api', `${method} ${path} - ${status}`, data, undefined, metadata)
    },
    error: (method: string, path: string, error: Error, data?: any, metadata?: Partial<LogEntry>) => {
      this.error('api', `${method} ${path} - Error`, error, data, metadata)
    }
  }

  public auth = {
    login: (email: string, success: boolean, metadata?: Partial<LogEntry>) => {
      const message = `Login attempt for ${email}: ${success ? 'SUCCESS' : 'FAILED'}`
      this.log(success ? 'info' : 'warn', 'auth', message, undefined, undefined, metadata)
    },
    logout: (userId: string, metadata?: Partial<LogEntry>) => {
      this.info('auth', `User logout: ${userId}`, undefined, metadata)
    },
    register: (email: string, success: boolean, metadata?: Partial<LogEntry>) => {
      const message = `Registration attempt for ${email}: ${success ? 'SUCCESS' : 'FAILED'}`
      this.log(success ? 'info' : 'warn', 'auth', message, undefined, undefined, metadata)
    },
    tokenError: (error: Error, metadata?: Partial<LogEntry>) => {
      this.error('auth', 'Token validation failed', error, undefined, metadata)
    }
  }

  public payment = {
    attempt: (orderId: string, amount: number, method: string, metadata?: Partial<LogEntry>) => {
      this.info('payment', `Payment attempt for order ${orderId}`, { amount, method }, metadata)
    },
    success: (orderId: string, transactionId: string, metadata?: Partial<LogEntry>) => {
      this.info('payment', `Payment successful for order ${orderId}`, { transactionId }, metadata)
    },
    failure: (orderId: string, error: Error, metadata?: Partial<LogEntry>) => {
      this.error('payment', `Payment failed for order ${orderId}`, error, undefined, metadata)
    }
  }
}

// Instância singleton
export const appLogger = new AdvancedLogger()

// Wrapper para compatibilidade com o sistema antigo
export const logger = {
  log: (message: string, data?: any) => appLogger.info('general', message, data),
  error: (message: string, error?: Error) => appLogger.error('general', message, error),
  warn: (message: string, data?: any) => appLogger.warn('general', message, data),
  info: (message: string, data?: any) => appLogger.info('general', message, data),
  debug: (message: string, data?: any) => appLogger.debug('general', message, data)
}

// Middleware para capturar informações de request
export function createRequestLogger(req: Request) {
  // Polyfill para crypto.randomUUID em ambientes de teste
  const requestId = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : 'test-' + Math.random().toString(36).substr(2, 9)
  const userAgent = req.headers.get('user-agent') || 'unknown'
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  
  return {
    requestId,
    log: (level: LogLevel, context: LogContext, message: string, data?: any, error?: Error) => {
      appLogger.log(level, context, message, data, error, {
        requestId,
        userAgent,
        ip
      })
    },
    info: (context: LogContext, message: string, data?: any) => {
      appLogger.info(context, message, data, { requestId, userAgent, ip })
    },
    error: (context: LogContext, message: string, error?: Error, data?: any) => {
      appLogger.error(context, message, error, data, { requestId, userAgent, ip })
    }
  }
}

export default appLogger