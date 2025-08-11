// Sistema de logging específico para Supabase
import { appLogger } from './logging'
import { getGlobalLoggingConfig, isContextEnabled } from './logging-config'
import type { SupabaseClient } from '@supabase/supabase-js'

// Tipos específicos do Supabase
export interface SupabaseLogContext {
  operation: string
  table?: string
  query?: string
  duration?: number
  userId?: string
  sessionId?: string
  error?: Error
  metadata?: Record<string, any>
}

export interface QueryPerformanceMetrics {
  query: string
  duration: number
  table?: string
  operation: string
  timestamp: string
  isSlowQuery: boolean
}

class SupabaseLogger {
  private config = getGlobalLoggingConfig()
  private queryMetrics: QueryPerformanceMetrics[] = []
  private connectionAttempts: number = 0
  private lastConnectionTime?: Date

  // Log de conexão com Supabase
  logConnection(success: boolean, url?: string, error?: Error): void {
    if (!isContextEnabled('supabase', 'connections')) return

    this.connectionAttempts++
    this.lastConnectionTime = new Date()

    if (success) {
      appLogger.supabase.query('Conexão com Supabase estabelecida', {
        url: url ? this.maskUrl(url) : undefined,
        attempt: this.connectionAttempts,
        timestamp: this.lastConnectionTime.toISOString()
      })
    } else {
      appLogger.supabase.error('Falha na conexão com Supabase', error || new Error('Connection failed'), {
        url: url ? this.maskUrl(url) : undefined,
        attempt: this.connectionAttempts,
        timestamp: this.lastConnectionTime.toISOString()
      })
    }
  }

  // Log de queries
  logQuery(context: SupabaseLogContext): void {
    if (!isContextEnabled('supabase', 'queries')) return

    const { operation, table, query, duration, userId, error } = context
    
    // Verificar se é uma query lenta
    const isSlowQuery = duration && duration > this.config.contexts.supabase.slowQueryThreshold
    
    if (isSlowQuery && isContextEnabled('supabase', 'slowQueries')) {
      appLogger.warn('supabase', 'Query lenta detectada', {
        operation,
        table,
        duration: `${duration}ms`,
        query: this.sanitizeQuery(query),
        userId,
        threshold: `${this.config.contexts.supabase.slowQueryThreshold}ms`
      })
      
      // Armazenar métrica de performance
      this.addQueryMetric({
        query: this.sanitizeQuery(query) || operation,
        duration: duration || 0,
        table,
        operation,
        timestamp: new Date().toISOString(),
        isSlowQuery: true
      })
    }

    if (error) {
      appLogger.supabase.error('Erro na query Supabase', error, {
        operation,
        table,
        query: this.sanitizeQuery(query),
        duration: duration ? `${duration}ms` : undefined,
        userId,
        errorCode: (error as any)?.code,
        errorDetails: (error as any)?.details
      })
    } else {
      appLogger.debug('supabase', 'Query Supabase executada', {
        operation,
        table,
        duration: duration ? `${duration}ms` : undefined,
        userId
      })
    }
  }

  // Log de autenticação
  logAuth(operation: string, success: boolean, userId?: string, error?: Error, metadata?: Record<string, any>): void {
    if (!isContextEnabled('auth', operation === 'login' ? 'attempts' : operation === 'success' ? 'successes' : 'failures')) return

    const logData = {
      operation,
      userId,
      timestamp: new Date().toISOString(),
      ...metadata
    }

    if (success) {
      appLogger.info('auth', `Autenticação bem-sucedida: ${operation}`, logData)
    } else {
      appLogger.warn('auth', `Falha na autenticação: ${operation}`, {
        ...logData,
        error: error?.message
      })
    }
  }

  // Log de RLS (Row Level Security)
  logRLS(table: string, operation: string, userId?: string, denied: boolean = false, policy?: string): void {
    if (denied) {
      appLogger.warn('supabase', 'Acesso negado por RLS', {
        table,
        operation,
        userId,
        policy,
        timestamp: new Date().toISOString()
      })
    } else {
      appLogger.debug('supabase', 'RLS aplicado com sucesso', {
        table,
        operation,
        userId,
        policy
      })
    }
  }

  // Log de realtime
  logRealtime(event: string, channel?: string, payload?: any, error?: Error): void {
    const logData = {
      event,
      channel,
      timestamp: new Date().toISOString(),
      payloadSize: payload ? JSON.stringify(payload).length : 0
    }

    if (error) {
      appLogger.supabase.error('Erro no Realtime', error, logData)
    } else {
      appLogger.debug('supabase', 'Evento Realtime', logData)
    }
  }

  // Log de storage
  logStorage(operation: string, bucket?: string, path?: string, size?: number, error?: Error): void {
    const logData = {
      operation,
      bucket,
      path: path ? this.sanitizePath(path) : undefined,
      size: size ? `${size} bytes` : undefined,
      timestamp: new Date().toISOString()
    }

    if (error) {
      appLogger.supabase.error('Erro no Storage', error, logData)
    } else {
      appLogger.supabase.query('Operação de Storage', logData)
    }
  }

  // Obter métricas de performance
  getPerformanceMetrics(): {
    totalQueries: number
    slowQueries: number
    averageDuration: number
    connectionAttempts: number
    lastConnection?: string
    recentSlowQueries: QueryPerformanceMetrics[]
  } {
    const slowQueries = this.queryMetrics.filter(m => m.isSlowQuery)
    const totalDuration = this.queryMetrics.reduce((sum, m) => sum + m.duration, 0)
    
    return {
      totalQueries: this.queryMetrics.length,
      slowQueries: slowQueries.length,
      averageDuration: this.queryMetrics.length > 0 ? totalDuration / this.queryMetrics.length : 0,
      connectionAttempts: this.connectionAttempts,
      lastConnection: this.lastConnectionTime?.toISOString(),
      recentSlowQueries: slowQueries.slice(-10) // Últimas 10 queries lentas
    }
  }

  // Limpar métricas antigas
  cleanupMetrics(): void {
    const maxHistory = this.config.retention.maxLogHistory
    if (this.queryMetrics.length > maxHistory) {
      this.queryMetrics = this.queryMetrics.slice(-maxHistory)
    }
  }

  // Métodos privados
  private maskUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      return `${urlObj.protocol}//${urlObj.hostname}:${urlObj.port || '443'}/**`
    } catch {
      return '[MASKED_URL]'
    }
  }

  private sanitizeQuery(query?: string): string | undefined {
    if (!query) return undefined
    
    // Remover valores sensíveis das queries
    return query
      .replace(/('.*?')/g, "'[VALUE]'") // Strings
      .replace(/(\$\d+)/g, '$[PARAM]')   // Parâmetros
      .replace(/(password|token|secret)\s*=\s*[^\s,)]+/gi, '$1=[REDACTED]')
      .substring(0, 200) // Limitar tamanho
  }

  private sanitizePath(path: string): string {
    // Mascarar IDs de usuário e informações sensíveis em paths
    return path
      .replace(/\/users\/[^/]+/g, '/users/[USER_ID]')
      .replace(/\/private\/[^/]+/g, '/private/[PRIVATE]')
      .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[UUID]')
  }

  private addQueryMetric(metric: QueryPerformanceMetrics): void {
    this.queryMetrics.push(metric)
    
    // Limitar número de métricas armazenadas
    const maxMetrics = this.config.retention.maxLogHistory
    if (this.queryMetrics.length > maxMetrics) {
      this.queryMetrics = this.queryMetrics.slice(-maxMetrics)
    }
  }
}

// Instância singleton
export const supabaseLogger = new SupabaseLogger()

// Wrapper para instrumentar cliente Supabase
export function instrumentSupabaseClient(client: SupabaseClient, userId?: string): SupabaseClient {
  if (!isContextEnabled('supabase', 'queries')) {
    return client
  }

  // Interceptar métodos do cliente para adicionar logging
  const originalFrom = client.from.bind(client)
  
  client.from = function(table: string) {
    const queryBuilder = originalFrom(table)
    
    // Interceptar métodos de query
    const methods = ['select', 'insert', 'update', 'delete', 'upsert']
    
    methods.forEach(method => {
      const originalMethod = (queryBuilder as any)[method]
      if (typeof originalMethod === 'function') {
        (queryBuilder as any)[method] = function(...args: any[]) {
          const startTime = Date.now()
          const result = originalMethod.apply(this, args)
          
          // Se for uma Promise, interceptar o resultado
          if (result && typeof result.then === 'function') {
            return result
              .then((data: any) => {
                const duration = Date.now() - startTime
                supabaseLogger.logQuery({
                  operation: method,
                  table,
                  duration,
                  userId
                })
                return data
              })
              .catch((error: Error) => {
                const duration = Date.now() - startTime
                supabaseLogger.logQuery({
                  operation: method,
                  table,
                  duration,
                  userId,
                  error
                })
                throw error
              })
          }
          
          return result
        }
      }
    })
    
    return queryBuilder
  }
  
  return client
}

// Hook para React (se necessário)
export function useSupabaseLogger() {
  return {
    logAuth: supabaseLogger.logAuth.bind(supabaseLogger),
    logQuery: supabaseLogger.logQuery.bind(supabaseLogger),
    logRLS: supabaseLogger.logRLS.bind(supabaseLogger),
    logRealtime: supabaseLogger.logRealtime.bind(supabaseLogger),
    logStorage: supabaseLogger.logStorage.bind(supabaseLogger),
    getMetrics: supabaseLogger.getPerformanceMetrics.bind(supabaseLogger)
  }
}

export default supabaseLogger