/**
 * Sistema de Logging Estruturado Avançado - FASE 2
 * Integra e melhora os sistemas de logging existentes
 * Implementa logs padronizados, correlação de requests, métricas de performance
 * e separação adequada entre ambientes dev/prod
 */

import { v4 as uuidv4 } from 'uuid'
import { performance } from 'perf_hooks'
import fs from 'fs/promises'
import path from 'path'

// Tipos para logging estruturado avançado
export type EnhancedLogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'
export type LogContext = 'api' | 'auth' | 'database' | 'payment' | 'system' | 'performance' | 'security'
export type Environment = 'development' | 'production' | 'test'

interface EnhancedLogEntry {
  timestamp: string
  level: EnhancedLogLevel
  context: LogContext
  service: string
  environment: Environment
  requestId?: string
  userId?: string
  sessionId?: string
  endpoint?: string
  method?: string
  statusCode?: number
  duration?: number
  message: string
  correlationId: string
  traceId?: string
  metadata?: Record<string, any>
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
  }
  performance?: {
    memoryUsage: NodeJS.MemoryUsage
    cpuUsage?: NodeJS.CpuUsage
    responseTime?: number
  }
  security?: {
    ip?: string
    userAgent?: string
    suspicious?: boolean
    riskLevel?: 'low' | 'medium' | 'high'
  }
}

interface LoggerConfig {
  enabled: boolean
  level: EnhancedLogLevel
  environment: Environment
  service: string
  enableFileLogging: boolean
  enableConsoleLogging: boolean
  enablePerformanceTracking: boolean
  enableSecurityLogging: boolean
  logDirectory: string
  maxFileSize: number
  maxFiles: number
  sensitiveFields: string[]
  rateLimiting: {
    enabled: boolean
    maxLogsPerMinute: number
  }
}

class EnhancedStructuredLogger {
  private config: LoggerConfig
  private correlationId: string
  private performanceMap: Map<string, { startTime: number; startCpu?: NodeJS.CpuUsage }> = new Map()
  private logBuffer: EnhancedLogEntry[] = []
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map()
  private isShuttingDown = false

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      enabled: true,
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      environment: (process.env.NODE_ENV as Environment) || 'development',
      service: 'erp-pizzaria',
      enableFileLogging: process.env.NODE_ENV === 'production',
      enableConsoleLogging: true,
      enablePerformanceTracking: true,
      enableSecurityLogging: true,
      logDirectory: './logs',
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      sensitiveFields: ['password', 'token', 'secret', 'key', 'authorization', 'credit_card', 'cvv'],
      rateLimiting: {
        enabled: process.env.NODE_ENV === 'production',
        maxLogsPerMinute: 1000
      },
      ...config
    }
    
    this.correlationId = this.generateCorrelationId()
    
    // Configurar handlers de shutdown
    this.setupShutdownHandlers()
    
    // Criar diretório de logs se necessário
    if (this.config.enableFileLogging) {
      this.ensureLogDirectory()
    }
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${uuidv4().substring(0, 8)}`
  }

  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.logDirectory, { recursive: true })
    } catch (error) {
      console.error('Failed to create log directory:', error)
    }
  }

  private setupShutdownHandlers(): void {
    const shutdown = async () => {
      this.isShuttingDown = true
      await this.flushLogs()
      process.exit(0)
    }

    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
    process.on('beforeExit', () => this.flushLogs())
  }

  private shouldLog(level: EnhancedLogLevel): boolean {
    if (!this.config.enabled) return false
    
    const levels: EnhancedLogLevel[] = ['debug', 'info', 'warn', 'error', 'critical']
    const currentLevelIndex = levels.indexOf(this.config.level)
    const requestedLevelIndex = levels.indexOf(level)
    
    return requestedLevelIndex >= currentLevelIndex
  }

  private isRateLimited(level: EnhancedLogLevel): boolean {
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

  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') return data
    
    const sanitized = { ...data }
    
    for (const key in sanitized) {
      if (this.config.sensitiveFields.some(field => 
        key.toLowerCase().includes(field.toLowerCase())
      )) {
        if (key.toLowerCase().includes('email')) {
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
        sanitized[key] = this.sanitizeData(sanitized[key])
      }
    }
    
    return sanitized
  }

  private createLogEntry(
    level: EnhancedLogLevel,
    context: LogContext,
    message: string,
    options: {
      requestId?: string
      userId?: string
      sessionId?: string
      endpoint?: string
      method?: string
      statusCode?: number
      duration?: number
      error?: Error
      metadata?: Record<string, any>
      traceId?: string
      security?: EnhancedLogEntry['security']
    } = {}
  ): EnhancedLogEntry {
    const entry: EnhancedLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      service: this.config.service,
      environment: this.config.environment,
      message,
      correlationId: this.correlationId,
      ...options
    }

    // Adicionar informações de erro
    if (options.error) {
      entry.error = {
        name: options.error.name,
        message: options.error.message,
        stack: this.config.environment === 'development' ? options.error.stack : undefined,
        code: (options.error as any).code
      }
    }

    // Adicionar métricas de performance se habilitado
    if (this.config.enablePerformanceTracking) {
      entry.performance = {
        memoryUsage: process.memoryUsage(),
        responseTime: options.duration
      }
    }

    // Sanitizar metadata
    if (options.metadata) {
      entry.metadata = this.sanitizeData(options.metadata)
    }

    return entry
  }

  private async writeToFile(entry: EnhancedLogEntry): Promise<void> {
    if (!this.config.enableFileLogging) return

    try {
      const logFileName = `${this.config.service}-${entry.level}-${new Date().toISOString().split('T')[0]}.log`
      const logFilePath = path.join(this.config.logDirectory, logFileName)
      const logLine = JSON.stringify(entry) + '\n'
      
      await fs.appendFile(logFilePath, logLine)
    } catch (error) {
      console.error('Failed to write log to file:', error)
    }
  }

  private writeToConsole(entry: EnhancedLogEntry): void {
    if (!this.config.enableConsoleLogging) return

    const colors = {
      debug: '\x1b[36m',    // Cyan
      info: '\x1b[32m',     // Green
      warn: '\x1b[33m',     // Yellow
      error: '\x1b[31m',    // Red
      critical: '\x1b[35m'  // Magenta
    }
    const reset = '\x1b[0m'

    let output: string
    if (this.config.environment === 'development') {
      // Formato legível para desenvolvimento
      const color = colors[entry.level]
      const timestamp = entry.timestamp.split('T')[1].split('.')[0]
      output = `${color}[${timestamp}] ${entry.level.toUpperCase().padEnd(8)} [${entry.context.toUpperCase()}] ${entry.message}${reset}`
      
      if (entry.metadata) {
        output += `\n  ${JSON.stringify(entry.metadata, null, 2)}`
      }
      
      if (entry.error) {
        output += `\n  Error: ${entry.error.message}`
        if (entry.error.stack) {
          output += `\n  Stack: ${entry.error.stack}`
        }
      }
    } else {
      // Formato JSON para produção
      output = JSON.stringify(entry)
    }

    switch (entry.level) {
      case 'debug':
        console.debug(output)
        break
      case 'info':
        console.info(output)
        break
      case 'warn':
        console.warn(output)
        break
      case 'error':
      case 'critical':
        console.error(output)
        break
    }
  }

  private async processLog(entry: EnhancedLogEntry): Promise<void> {
    // Buffer para logs em produção
    if (this.config.environment === 'production') {
      this.logBuffer.push(entry)
      if (this.logBuffer.length >= 10) {
        await this.flushLogs()
      }
    } else {
      // Log imediato em desenvolvimento
      this.writeToConsole(entry)
      await this.writeToFile(entry)
    }
  }

  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return

    const logsToFlush = [...this.logBuffer]
    this.logBuffer = []

    for (const entry of logsToFlush) {
      this.writeToConsole(entry)
      await this.writeToFile(entry)
    }
  }

  // Métodos públicos de logging
  public async debug(
    context: LogContext,
    message: string,
    options?: {
      requestId?: string
      userId?: string
      metadata?: Record<string, any>
    }
  ): Promise<void> {
    if (!this.shouldLog('debug') || this.isRateLimited('debug')) return
    
    const entry = this.createLogEntry('debug', context, message, options)
    await this.processLog(entry)
  }

  public async info(
    context: LogContext,
    message: string,
    options?: {
      requestId?: string
      userId?: string
      endpoint?: string
      method?: string
      statusCode?: number
      duration?: number
      metadata?: Record<string, any>
    }
  ): Promise<void> {
    if (!this.shouldLog('info') || this.isRateLimited('info')) return
    
    const entry = this.createLogEntry('info', context, message, options)
    await this.processLog(entry)
  }

  public async warn(
    context: LogContext,
    message: string,
    options?: {
      requestId?: string
      userId?: string
      metadata?: Record<string, any>
      error?: Error
    }
  ): Promise<void> {
    if (!this.shouldLog('warn') || this.isRateLimited('warn')) return
    
    const entry = this.createLogEntry('warn', context, message, options)
    await this.processLog(entry)
  }

  public async error(
    context: LogContext,
    message: string,
    options?: {
      requestId?: string
      userId?: string
      endpoint?: string
      method?: string
      statusCode?: number
      error?: Error
      metadata?: Record<string, any>
    }
  ): Promise<void> {
    if (!this.shouldLog('error')) return // Não aplicar rate limit para erros
    
    const entry = this.createLogEntry('error', context, message, options)
    await this.processLog(entry)
  }

  public async critical(
    context: LogContext,
    message: string,
    options?: {
      requestId?: string
      userId?: string
      error?: Error
      metadata?: Record<string, any>
      security?: EnhancedLogEntry['security']
    }
  ): Promise<void> {
    // Logs críticos sempre são processados
    const entry = this.createLogEntry('critical', context, message, options)
    await this.processLog(entry)
    
    // Flush imediato para logs críticos
    await this.flushLogs()
  }

  // Métodos específicos para diferentes contextos
  public async logApiRequest(
    method: string,
    endpoint: string,
    requestId: string,
    options?: {
      userId?: string
      statusCode?: number
      duration?: number
      metadata?: Record<string, any>
    }
  ): Promise<void> {
    await this.info('api', `${method} ${endpoint}`, {
      requestId,
      endpoint,
      method,
      ...options
    })
  }

  public async logAuthEvent(
    event: string,
    options?: {
      userId?: string
      email?: string
      success?: boolean
      reason?: string
      security?: EnhancedLogEntry['security']
    }
  ): Promise<void> {
    const level = options?.success === false ? 'warn' : 'info'
    await this[level]('auth', `Auth event: ${event}`, {
      metadata: options,
      security: options?.security
    })
  }

  public async logDatabaseQuery(
    query: string,
    duration: number,
    options?: {
      requestId?: string
      rowCount?: number
      error?: Error
    }
  ): Promise<void> {
    const level = options?.error ? 'error' : 'debug'
    await this[level]('database', `Query executed in ${duration}ms`, {
      requestId: options?.requestId,
      duration,
      metadata: {
        query: query.substring(0, 200), // Limitar tamanho da query no log
        rowCount: options?.rowCount
      },
      error: options?.error
    })
  }

  public async logPerformanceMetric(
    operation: string,
    duration: number,
    options?: {
      requestId?: string
      metadata?: Record<string, any>
    }
  ): Promise<void> {
    await this.info('performance', `${operation} completed in ${duration}ms`, {
      requestId: options?.requestId,
      duration,
      metadata: options?.metadata
    })
  }

  public async logSecurityEvent(
    event: string,
    riskLevel: 'low' | 'medium' | 'high',
    options?: {
      ip?: string
      userAgent?: string
      userId?: string
      metadata?: Record<string, any>
    }
  ): Promise<void> {
    const level = riskLevel === 'high' ? 'critical' : riskLevel === 'medium' ? 'warn' : 'info'
    await this[level]('security', `Security event: ${event}`, {
      userId: options?.userId,
      metadata: options?.metadata,
      security: {
        ip: options?.ip,
        userAgent: options?.userAgent,
        suspicious: riskLevel !== 'low',
        riskLevel
      }
    })
  }

  // Métodos de performance tracking
  public startPerformanceTimer(operationId: string): void {
    this.performanceMap.set(operationId, {
      startTime: performance.now(),
      startCpu: process.cpuUsage()
    })
  }

  public async endPerformanceTimer(
    operationId: string,
    operation: string,
    options?: {
      requestId?: string
      metadata?: Record<string, any>
    }
  ): Promise<number> {
    const metrics = this.performanceMap.get(operationId)
    if (!metrics) return 0

    const duration = performance.now() - metrics.startTime
    this.performanceMap.delete(operationId)

    await this.logPerformanceMetric(operation, duration, options)
    return duration
  }

  // Métodos de configuração
  public setCorrelationId(correlationId: string): void {
    this.correlationId = correlationId
  }

  public getCorrelationId(): string {
    return this.correlationId
  }

  public updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config }
  }

  // Método para shutdown graceful
  public async shutdown(): Promise<void> {
    this.isShuttingDown = true
    await this.flushLogs()
  }
}

// Instância singleton do logger
export const enhancedLogger = new EnhancedStructuredLogger()

// Função para criar logger com configuração específica
export function createLogger(config?: Partial<LoggerConfig>): EnhancedStructuredLogger {
  return new EnhancedStructuredLogger(config)
}

// Exportar tipos para uso em outros módulos
export type { EnhancedLogLevel, LogContext, EnhancedLogEntry, LoggerConfig }