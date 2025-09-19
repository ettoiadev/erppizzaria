/**
 * Sistema de Logging Estruturado - Fase 2 do Plano de Correção
 * Implementa logs padronizados em JSON com correlação de requests e performance
 */

import { v4 as uuidv4 } from 'uuid'
import { performance } from 'perf_hooks'

// Tipos para logging estruturado
export type StructuredLogLevel = 'error' | 'warn' | 'info' | 'debug'
export type ServiceName = 'erp-pizzaria'

interface BaseLogEntry {
  timestamp: string
  level: StructuredLogLevel
  service: ServiceName
  requestId?: string
  userId?: string
  endpoint?: string
  method?: string
  statusCode?: number
  duration?: number
  message: string
  correlationId?: string
  error?: {
    name: string
    message: string
    stack?: string
  }
  metadata?: Record<string, any>
}

interface PerformanceMetrics {
  startTime: number
  endTime?: number
  duration?: number
  memoryUsage?: NodeJS.MemoryUsage
  cpuUsage?: NodeJS.CpuUsage
}

class StructuredLogger {
  private serviceName: ServiceName = 'erp-pizzaria'
  private isProduction: boolean
  private performanceMap: Map<string, PerformanceMetrics> = new Map()
  private correlationId: string

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production'
    this.correlationId = this.generateCorrelationId()
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  public setCorrelationId(correlationId: string): void {
    this.correlationId = correlationId
  }

  public getCorrelationId(): string {
    return this.correlationId
  }

  /**
   * Cria uma entrada de log estruturada
   */
  private createLogEntry(
    level: StructuredLogLevel,
    message: string,
    options: {
      requestId?: string
      userId?: string
      endpoint?: string
      method?: string
      statusCode?: number
      duration?: number
      error?: Error
      metadata?: Record<string, any>
    } = {}
  ): BaseLogEntry {
    const entry: BaseLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      correlationId: this.correlationId,
      ...options
    }

    // Adicionar informações de erro se fornecido
    if (options.error) {
      entry.error = {
        name: options.error.name,
        message: options.error.message,
        stack: this.isProduction ? undefined : options.error.stack
      }
    }

    return entry
  }

  /**
   * Escreve log estruturado no console
   */
  private writeLog(entry: BaseLogEntry): void {
    const logString = JSON.stringify(entry, null, this.isProduction ? 0 : 2)
    
    switch (entry.level) {
      case 'error':
        console.error(logString)
        break
      case 'warn':
        console.warn(logString)
        break
      case 'info':
        console.info(logString)
        break
      case 'debug':
        if (!this.isProduction) {
          console.debug(logString)
        }
        break
    }
  }

  /**
   * Log de erro
   */
  public error(
    message: string,
    options: {
      requestId?: string
      userId?: string
      endpoint?: string
      method?: string
      statusCode?: number
      error?: Error
      metadata?: Record<string, any>
    } = {}
  ): void {
    const entry = this.createLogEntry('error', message, options)
    this.writeLog(entry)
  }

  /**
   * Log de warning
   */
  public warn(
    message: string,
    options: {
      requestId?: string
      userId?: string
      endpoint?: string
      method?: string
      metadata?: Record<string, any>
    } = {}
  ): void {
    const entry = this.createLogEntry('warn', message, options)
    this.writeLog(entry)
  }

  /**
   * Log de informação
   */
  public info(
    message: string,
    options: {
      requestId?: string
      userId?: string
      endpoint?: string
      method?: string
      statusCode?: number
      duration?: number
      metadata?: Record<string, any>
    } = {}
  ): void {
    const entry = this.createLogEntry('info', message, options)
    this.writeLog(entry)
  }

  /**
   * Log de debug
   */
  public debug(
    message: string,
    options: {
      requestId?: string
      userId?: string
      endpoint?: string
      method?: string
      metadata?: Record<string, any>
    } = {}
  ): void {
    const entry = this.createLogEntry('debug', message, options)
    this.writeLog(entry)
  }

  /**
   * Inicia medição de performance
   */
  public startPerformanceTimer(requestId: string): void {
    this.performanceMap.set(requestId, {
      startTime: performance.now(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    })
  }

  /**
   * Finaliza medição de performance e loga
   */
  public endPerformanceTimer(
    requestId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    userId?: string
  ): void {
    const metrics = this.performanceMap.get(requestId)
    if (!metrics) return

    const endTime = performance.now()
    const duration = Math.round(endTime - metrics.startTime)
    const endMemory = process.memoryUsage()
    const endCpu = process.cpuUsage(metrics.cpuUsage)

    // Remover da memória
    this.performanceMap.delete(requestId)

    // Log de performance
    this.info('Request completed', {
      requestId,
      userId,
      endpoint,
      method,
      statusCode,
      duration,
      metadata: {
        performance: {
          duration_ms: duration,
          memory_delta_mb: Math.round((endMemory.heapUsed - metrics.memoryUsage!.heapUsed) / 1024 / 1024 * 100) / 100,
          cpu_user_ms: Math.round(endCpu.user / 1000),
          cpu_system_ms: Math.round(endCpu.system / 1000)
        }
      }
    })
  }

  /**
   * Log específico para APIs
   */
  public apiRequest(
    method: string,
    endpoint: string,
    requestId: string,
    userId?: string,
    metadata?: Record<string, any>
  ): void {
    this.info('API request started', {
      requestId,
      userId,
      endpoint,
      method,
      metadata
    })

    // Iniciar timer de performance
    this.startPerformanceTimer(requestId)
  }

  /**
   * Log específico para respostas de API
   */
  public apiResponse(
    method: string,
    endpoint: string,
    statusCode: number,
    requestId: string,
    userId?: string,
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    // Finalizar timer de performance
    this.endPerformanceTimer(requestId, endpoint, method, statusCode, userId)

    if (error || statusCode >= 400) {
      this.error('API request failed', {
        requestId,
        userId,
        endpoint,
        method,
        statusCode,
        error,
        metadata
      })
    } else {
      this.info('API request successful', {
        requestId,
        userId,
        endpoint,
        method,
        statusCode,
        metadata
      })
    }
  }

  /**
   * Log específico para banco de dados
   */
  public database(
    operation: string,
    table: string,
    duration: number,
    requestId?: string,
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    const message = `Database ${operation} on ${table}`
    
    if (error) {
      this.error(message, {
        requestId,
        error,
        metadata: {
          ...metadata,
          database: {
            operation,
            table,
            duration_ms: duration
          }
        }
      })
    } else {
      // Log apenas queries lentas em produção
      if (this.isProduction && duration < 1000) return
      
      this.info(message, {
        requestId,
        metadata: {
          ...metadata,
          database: {
            operation,
            table,
            duration_ms: duration
          }
        }
      })
    }
  }

  /**
   * Log específico para autenticação
   */
  public auth(
    action: 'login' | 'logout' | 'register' | 'token_validation',
    success: boolean,
    email?: string,
    userId?: string,
    requestId?: string,
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    const message = `Authentication ${action}: ${success ? 'SUCCESS' : 'FAILED'}`
    
    if (success) {
      this.info(message, {
        requestId,
        userId,
        metadata: {
          ...metadata,
          auth: {
            action,
            email: email ? this.maskEmail(email) : undefined
          }
        }
      })
    } else {
      this.warn(message, {
        requestId,
        userId,
        metadata: {
          ...metadata,
          auth: {
            action,
            email: email ? this.maskEmail(email) : undefined,
            error: error?.message
          }
        }
      })
    }
  }

  /**
   * Mascara email para logs
   */
  private maskEmail(email: string): string {
    if (!email.includes('@')) return '[INVALID_EMAIL]'
    const [local, domain] = email.split('@')
    return `${local.substring(0, 2)}***@${domain}`
  }

  /**
   * Cria um logger com contexto de request
   */
  public createRequestLogger(requestId?: string, userId?: string) {
    const id = requestId || uuidv4()
    
    return {
      requestId: id,
      error: (message: string, options: any = {}) => 
        this.error(message, { ...options, requestId: id, userId }),
      warn: (message: string, options: any = {}) => 
        this.warn(message, { ...options, requestId: id, userId }),
      info: (message: string, options: any = {}) => 
        this.info(message, { ...options, requestId: id, userId }),
      debug: (message: string, options: any = {}) => 
        this.debug(message, { ...options, requestId: id, userId }),
      apiRequest: (method: string, endpoint: string, metadata?: any) =>
        this.apiRequest(method, endpoint, id, userId, metadata),
      apiResponse: (method: string, endpoint: string, statusCode: number, error?: Error, metadata?: any) =>
        this.apiResponse(method, endpoint, statusCode, id, userId, error, metadata),
      database: (operation: string, table: string, duration: number, error?: Error, metadata?: any) =>
        this.database(operation, table, duration, id, error, metadata),
      auth: (action: any, success: boolean, email?: string, error?: Error, metadata?: any) =>
        this.auth(action, success, email, userId, id, error, metadata)
    }
  }
}

// Instância singleton
export const structuredLogger = new StructuredLogger()

// Export default
export default structuredLogger