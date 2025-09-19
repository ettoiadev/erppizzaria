/**
 * Middleware de Monitoramento de Performance - FASE 2
 * Monitora performance das APIs, coleta métricas e detecta gargalos
 */

import { NextRequest, NextResponse } from 'next/server'
import { performance } from 'perf_hooks'
import { enhancedLogger } from './enhanced-structured-logger'
import { v4 as uuidv4 } from 'uuid'

// Tipos para métricas de performance
interface PerformanceMetrics {
  requestId: string
  method: string
  endpoint: string
  startTime: number
  endTime?: number
  duration?: number
  statusCode?: number
  contentLength?: number
  userAgent?: string
  ip?: string
  userId?: string
  memoryBefore: NodeJS.MemoryUsage
  memoryAfter?: NodeJS.MemoryUsage
  cpuBefore?: NodeJS.CpuUsage
  cpuAfter?: NodeJS.CpuUsage
  queryCount?: number
  cacheHit?: boolean
  error?: string
}

interface PerformanceAlert {
  type: 'slow_request' | 'high_memory' | 'high_cpu' | 'error_rate' | 'high_load'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  metrics: Record<string, any>
  timestamp: string
}

interface PerformanceConfig {
  enabled: boolean
  slowRequestThreshold: number // ms
  memoryThreshold: number // MB
  cpuThreshold: number // %
  errorRateThreshold: number // %
  sampleRate: number // 0-1 (1 = 100%)
  enableDetailedLogging: boolean
  enableAlerts: boolean
  metricsRetention: number // minutes
}

class PerformanceMonitor {
  private config: PerformanceConfig
  private activeRequests: Map<string, PerformanceMetrics> = new Map()
  private recentMetrics: PerformanceMetrics[] = []
  private errorCounts: Map<string, number> = new Map()
  private requestCounts: Map<string, number> = new Map()
  private alertCooldowns: Map<string, number> = new Map()

  constructor(config?: Partial<PerformanceConfig>) {
    this.config = {
      enabled: true,
      slowRequestThreshold: 2000, // 2 segundos
      memoryThreshold: 100, // 100MB
      cpuThreshold: 80, // 80%
      errorRateThreshold: 5, // 5%
      sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      enableDetailedLogging: process.env.NODE_ENV !== 'production',
      enableAlerts: true,
      metricsRetention: 60, // 60 minutos
      ...config
    }

    // Limpeza periódica de métricas antigas
    setInterval(() => this.cleanupOldMetrics(), 5 * 60 * 1000) // 5 minutos
  }

  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate
  }

  private extractClientInfo(request: NextRequest): { ip?: string; userAgent?: string } {
    return {
      ip: request.headers.get('x-forwarded-for') || 
          request.headers.get('x-real-ip') || 
          'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    }
  }

  private extractUserId(request: NextRequest): string | undefined {
    // Tentar extrair user ID do token JWT ou headers
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie')
    
    // Implementação simplificada - em produção, decodificar JWT
    if (authHeader || cookieHeader) {
      return 'authenticated-user' // Placeholder
    }
    
    return undefined
  }

  private cleanupOldMetrics(): void {
    const cutoffTime = Date.now() - (this.config.metricsRetention * 60 * 1000)
    
    this.recentMetrics = this.recentMetrics.filter(
      metric => metric.startTime > cutoffTime
    )
    
    // Limpar contadores de erro antigos
    const hourAgo = Date.now() - (60 * 60 * 1000)
    for (const [key, timestamp] of this.errorCounts.entries()) {
      if (timestamp < hourAgo) {
        this.errorCounts.delete(key)
      }
    }
  }

  private async sendAlert(alert: PerformanceAlert): Promise<void> {
    if (!this.config.enableAlerts) return

    // Verificar cooldown para evitar spam de alertas
    const cooldownKey = `${alert.type}_${alert.severity}`
    const lastAlert = this.alertCooldowns.get(cooldownKey) || 0
    const cooldownPeriod = alert.severity === 'critical' ? 5 * 60 * 1000 : 15 * 60 * 1000

    if (Date.now() - lastAlert < cooldownPeriod) {
      return
    }

    this.alertCooldowns.set(cooldownKey, Date.now())

    // Log do alerta
    const logLevel = alert.severity === 'critical' ? 'critical' : 
                    alert.severity === 'high' ? 'error' : 'warn'

    await enhancedLogger[logLevel]('performance', `Performance Alert: ${alert.message}`, {
      metadata: {
        alert_type: alert.type,
        severity: alert.severity,
        metrics: alert.metrics
      }
    })
  }

  private async analyzeMetrics(metrics: PerformanceMetrics): Promise<void> {
    const alerts: PerformanceAlert[] = []

    // Verificar requisição lenta
    if (metrics.duration && metrics.duration > this.config.slowRequestThreshold) {
      const severity = metrics.duration > this.config.slowRequestThreshold * 2 ? 'high' : 'medium'
      alerts.push({
        type: 'slow_request',
        severity,
        message: `Slow request detected: ${metrics.endpoint} took ${metrics.duration}ms`,
        metrics: {
          endpoint: metrics.endpoint,
          duration: metrics.duration,
          method: metrics.method
        },
        timestamp: new Date().toISOString()
      })
    }

    // Verificar uso de memória
    if (metrics.memoryAfter) {
      const memoryUsedMB = metrics.memoryAfter.heapUsed / 1024 / 1024
      if (memoryUsedMB > this.config.memoryThreshold) {
        const severity = memoryUsedMB > this.config.memoryThreshold * 2 ? 'critical' : 'high'
        alerts.push({
          type: 'high_memory',
          severity,
          message: `High memory usage detected: ${memoryUsedMB.toFixed(1)}MB`,
          metrics: {
            memory_used_mb: memoryUsedMB,
            endpoint: metrics.endpoint
          },
          timestamp: new Date().toISOString()
        })
      }
    }

    // Verificar taxa de erro
    const recentErrors = this.recentMetrics.filter(
      m => m.statusCode && m.statusCode >= 500 && 
           m.startTime > Date.now() - (15 * 60 * 1000) // últimos 15 minutos
    ).length
    
    const recentRequests = this.recentMetrics.filter(
      m => m.startTime > Date.now() - (15 * 60 * 1000)
    ).length

    if (recentRequests > 10) { // Só verificar se há volume suficiente
      const errorRate = (recentErrors / recentRequests) * 100
      if (errorRate > this.config.errorRateThreshold) {
        alerts.push({
          type: 'error_rate',
          severity: errorRate > this.config.errorRateThreshold * 2 ? 'critical' : 'high',
          message: `High error rate detected: ${errorRate.toFixed(1)}%`,
          metrics: {
            error_rate: errorRate,
            recent_errors: recentErrors,
            recent_requests: recentRequests
          },
          timestamp: new Date().toISOString()
        })
      }
    }

    // Enviar alertas
    for (const alert of alerts) {
      await this.sendAlert(alert)
    }
  }

  public startRequest(request: NextRequest): string {
    if (!this.config.enabled || !this.shouldSample()) {
      return ''
    }

    const requestId = uuidv4()
    const { ip, userAgent } = this.extractClientInfo(request)
    const userId = this.extractUserId(request)
    
    const metrics: PerformanceMetrics = {
      requestId,
      method: request.method,
      endpoint: new URL(request.url).pathname,
      startTime: performance.now(),
      ip,
      userAgent,
      userId,
      memoryBefore: process.memoryUsage(),
      cpuBefore: process.cpuUsage()
    }

    this.activeRequests.set(requestId, metrics)

    if (this.config.enableDetailedLogging) {
      enhancedLogger.debug('performance', `Request started: ${metrics.method} ${metrics.endpoint}`, {
        requestId,
        metadata: {
          ip: metrics.ip,
          userAgent: metrics.userAgent?.substring(0, 100)
        }
      })
    }

    return requestId
  }

  public async endRequest(
    requestId: string, 
    response: NextResponse,
    additionalMetrics?: {
      queryCount?: number
      cacheHit?: boolean
      error?: string
    }
  ): Promise<void> {
    if (!requestId || !this.config.enabled) return

    const metrics = this.activeRequests.get(requestId)
    if (!metrics) return

    // Finalizar métricas
    metrics.endTime = performance.now()
    metrics.duration = metrics.endTime - metrics.startTime
    metrics.statusCode = response.status
    metrics.contentLength = parseInt(response.headers.get('content-length') || '0')
    metrics.memoryAfter = process.memoryUsage()
    metrics.cpuAfter = process.cpuUsage(metrics.cpuBefore)
    
    if (additionalMetrics) {
      Object.assign(metrics, additionalMetrics)
    }

    // Remover da lista ativa e adicionar ao histórico
    this.activeRequests.delete(requestId)
    this.recentMetrics.push(metrics)

    // Manter apenas as métricas mais recentes na memória
    if (this.recentMetrics.length > 1000) {
      this.recentMetrics = this.recentMetrics.slice(-500)
    }

    // Log detalhado
    const logLevel = metrics.statusCode >= 500 ? 'error' : 
                    metrics.statusCode >= 400 ? 'warn' : 'info'

    await enhancedLogger[logLevel]('performance', 
      `Request completed: ${metrics.method} ${metrics.endpoint} - ${metrics.statusCode} (${metrics.duration?.toFixed(1)}ms)`,
      {
        requestId,
        endpoint: metrics.endpoint,
        method: metrics.method,
        statusCode: metrics.statusCode,
        duration: metrics.duration,
        metadata: {
          content_length: metrics.contentLength,
          memory_used_mb: metrics.memoryAfter ? Math.round(metrics.memoryAfter.heapUsed / 1024 / 1024) : 0,
          query_count: metrics.queryCount,
          cache_hit: metrics.cacheHit,
          user_id: metrics.userId
        }
      }
    )

    // Analisar métricas para alertas
    await this.analyzeMetrics(metrics)
  }

  public getMetrics(): {
    active_requests: number
    recent_requests: number
    avg_response_time: number
    error_rate: number
    memory_usage_mb: number
    top_slow_endpoints: Array<{ endpoint: string; avg_duration: number; count: number }>
  } {
    const recentMetrics = this.recentMetrics.filter(
      m => m.startTime > Date.now() - (15 * 60 * 1000) // últimos 15 minutos
    )

    const avgResponseTime = recentMetrics.length > 0 ?
      recentMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / recentMetrics.length : 0

    const errorCount = recentMetrics.filter(m => m.statusCode && m.statusCode >= 500).length
    const errorRate = recentMetrics.length > 0 ? (errorCount / recentMetrics.length) * 100 : 0

    // Agrupar por endpoint para encontrar os mais lentos
    const endpointStats = new Map<string, { totalDuration: number; count: number }>()
    
    recentMetrics.forEach(m => {
      if (m.duration) {
        const current = endpointStats.get(m.endpoint) || { totalDuration: 0, count: 0 }
        current.totalDuration += m.duration
        current.count += 1
        endpointStats.set(m.endpoint, current)
      }
    })

    const topSlowEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        avg_duration: stats.totalDuration / stats.count,
        count: stats.count
      }))
      .sort((a, b) => b.avg_duration - a.avg_duration)
      .slice(0, 5)

    return {
      active_requests: this.activeRequests.size,
      recent_requests: recentMetrics.length,
      avg_response_time: avgResponseTime,
      error_rate: errorRate,
      memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      top_slow_endpoints: topSlowEndpoints
    }
  }

  public updateConfig(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

// Instância singleton
export const performanceMonitor = new PerformanceMonitor()

// Middleware function para Next.js
export function withPerformanceMonitoring<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const requestId = performanceMonitor.startRequest(request)
    
    try {
      const response = await handler(request, ...args)
      
      await performanceMonitor.endRequest(requestId, response)
      
      // Adicionar headers de performance
      if (requestId) {
        response.headers.set('x-request-id', requestId)
        response.headers.set('x-response-time', `${performance.now()}ms`)
      }
      
      return response
    } catch (error) {
      // Criar resposta de erro
      const errorResponse = NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
      
      await performanceMonitor.endRequest(requestId, errorResponse, {
        error: error instanceof Error ? error.message : String(error)
      })
      
      throw error
    }
  }
}

// Hook para React components (opcional)
export function usePerformanceTracking(componentName: string) {
  const startTime = performance.now()
  
  return {
    end: () => {
      const duration = performance.now() - startTime
      enhancedLogger.debug('performance', `Component render: ${componentName}`, {
        metadata: { duration, component: componentName }
      })
    }
  }
}

// Exportar tipos
export type { PerformanceMetrics, PerformanceAlert, PerformanceConfig }