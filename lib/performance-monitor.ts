import { NextRequest, NextResponse } from 'next/server'
import { appLogger } from '@/lib/logging'

// Interface para métricas de performance
interface PerformanceMetrics {
  requestCount: number
  averageResponseTime: number
  slowQueries: number
  errorRate: number
  memoryUsage: NodeJS.MemoryUsage
  cpuUsage?: number
  activeConnections: number
  cacheHitRate: number
  lastUpdated: Date
}

// Interface para alertas
interface PerformanceAlert {
  id: string
  type: 'warning' | 'critical'
  message: string
  metric: string
  value: number
  threshold: number
  timestamp: Date
  resolved: boolean
}

// Interface para configuração de thresholds
interface PerformanceThresholds {
  responseTime: {
    warning: number // ms
    critical: number // ms
  }
  errorRate: {
    warning: number // %
    critical: number // %
  }
  memoryUsage: {
    warning: number // %
    critical: number // %
  }
  slowQueryTime: number // ms
  cacheHitRate: {
    warning: number // %
  }
}

// Configuração padrão de thresholds
const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  responseTime: {
    warning: 1000, // 1 segundo
    critical: 3000 // 3 segundos
  },
  errorRate: {
    warning: 5, // 5%
    critical: 10 // 10%
  },
  memoryUsage: {
    warning: 80, // 80%
    critical: 90 // 90%
  },
  slowQueryTime: 1000, // 1 segundo
  cacheHitRate: {
    warning: 70 // 70%
  }
}

// Classe para monitoramento de performance
class PerformanceMonitor {
  private metrics: PerformanceMetrics
  private alerts: PerformanceAlert[]
  private thresholds: PerformanceThresholds
  private requestTimes: number[]
  private errorCount: number
  private totalRequests: number
  private slowQueryCount: number
  private cacheHits: number
  private cacheMisses: number
  private monitoringInterval: NodeJS.Timeout | null = null

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds }
    this.alerts = []
    this.requestTimes = []
    this.errorCount = 0
    this.totalRequests = 0
    this.slowQueryCount = 0
    this.cacheHits = 0
    this.cacheMisses = 0
    
    this.metrics = {
      requestCount: 0,
      averageResponseTime: 0,
      slowQueries: 0,
      errorRate: 0,
      memoryUsage: process.memoryUsage(),
      activeConnections: 0,
      cacheHitRate: 0,
      lastUpdated: new Date()
    }

    this.startMonitoring()
  }

  // Iniciar monitoramento contínuo
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics()
      this.checkThresholds()
    }, 30000) // Atualizar a cada 30 segundos
  }

  // Parar monitoramento
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
  }

  // Registrar tempo de resposta de uma requisição
  public recordRequestTime(responseTime: number): void {
    this.requestTimes.push(responseTime)
    this.totalRequests++
    
    // Manter apenas os últimos 1000 tempos de resposta
    if (this.requestTimes.length > 1000) {
      this.requestTimes.shift()
    }

    // Verificar se é uma query lenta
    if (responseTime > this.thresholds.slowQueryTime) {
      this.slowQueryCount++
    }
  }

  // Registrar erro
  public recordError(): void {
    this.errorCount++
  }

  // Registrar hit/miss do cache
  public recordCacheHit(): void {
    this.cacheHits++
  }

  public recordCacheMiss(): void {
    this.cacheMisses++
  }

  // Atualizar métricas
  private updateMetrics(): void {
    // Calcular tempo médio de resposta
    if (this.requestTimes.length > 0) {
      const sum = this.requestTimes.reduce((a, b) => a + b, 0)
      this.metrics.averageResponseTime = sum / this.requestTimes.length
    }

    // Calcular taxa de erro
    if (this.totalRequests > 0) {
      this.metrics.errorRate = (this.errorCount / this.totalRequests) * 100
    }

    // Calcular taxa de hit do cache
    const totalCacheRequests = this.cacheHits + this.cacheMisses
    if (totalCacheRequests > 0) {
      this.metrics.cacheHitRate = (this.cacheHits / totalCacheRequests) * 100
    }

    // Atualizar outras métricas
    this.metrics.requestCount = this.totalRequests
    this.metrics.slowQueries = this.slowQueryCount
    this.metrics.memoryUsage = process.memoryUsage()
    this.metrics.lastUpdated = new Date()

    appLogger.info('general', 'Métricas atualizadas', {
      averageResponseTime: this.metrics.averageResponseTime,
      errorRate: this.metrics.errorRate,
      cacheHitRate: this.metrics.cacheHitRate,
      memoryUsage: this.metrics.memoryUsage.heapUsed
    })
  }

  // Verificar thresholds e gerar alertas
  private checkThresholds(): void {
    const now = new Date()

    // Verificar tempo de resposta
    if (this.metrics.averageResponseTime > this.thresholds.responseTime.critical) {
      this.createAlert('critical', 'Tempo de resposta crítico', 'responseTime', 
        this.metrics.averageResponseTime, this.thresholds.responseTime.critical)
    } else if (this.metrics.averageResponseTime > this.thresholds.responseTime.warning) {
      this.createAlert('warning', 'Tempo de resposta alto', 'responseTime', 
        this.metrics.averageResponseTime, this.thresholds.responseTime.warning)
    }

    // Verificar taxa de erro
    if (this.metrics.errorRate > this.thresholds.errorRate.critical) {
      this.createAlert('critical', 'Taxa de erro crítica', 'errorRate', 
        this.metrics.errorRate, this.thresholds.errorRate.critical)
    } else if (this.metrics.errorRate > this.thresholds.errorRate.warning) {
      this.createAlert('warning', 'Taxa de erro alta', 'errorRate', 
        this.metrics.errorRate, this.thresholds.errorRate.warning)
    }

    // Verificar uso de memória
    const memoryUsagePercent = (this.metrics.memoryUsage.heapUsed / this.metrics.memoryUsage.heapTotal) * 100
    if (memoryUsagePercent > this.thresholds.memoryUsage.critical) {
      this.createAlert('critical', 'Uso de memória crítico', 'memoryUsage', 
        memoryUsagePercent, this.thresholds.memoryUsage.critical)
    } else if (memoryUsagePercent > this.thresholds.memoryUsage.warning) {
      this.createAlert('warning', 'Uso de memória alto', 'memoryUsage', 
        memoryUsagePercent, this.thresholds.memoryUsage.warning)
    }

    // Verificar taxa de hit do cache
    if (this.metrics.cacheHitRate < this.thresholds.cacheHitRate.warning) {
      this.createAlert('warning', 'Taxa de hit do cache baixa', 'cacheHitRate', 
        this.metrics.cacheHitRate, this.thresholds.cacheHitRate.warning)
    }
  }

  // Criar alerta
  private createAlert(type: 'warning' | 'critical', message: string, metric: string, value: number, threshold: number): void {
    const alertId = `${metric}-${type}-${Date.now()}`
    
    // Verificar se já existe um alerta similar ativo
    const existingAlert = this.alerts.find(alert => 
      alert.metric === metric && alert.type === type && !alert.resolved
    )

    if (existingAlert) {
      return // Não criar alerta duplicado
    }

    const alert: PerformanceAlert = {
      id: alertId,
      type,
      message,
      metric,
      value,
      threshold,
      timestamp: new Date(),
      resolved: false
    }

    this.alerts.push(alert)
    
    appLogger.warn('general', `${type.toUpperCase()}: ${message}`, {
      metric,
      value,
      threshold,
      alertId
    })

    // Manter apenas os últimos 100 alertas
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100)
    }
  }

  // Resolver alerta
  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
      appLogger.info('general', `Alerta resolvido: ${alertId}`)
      return true
    }
    return false
  }

  // Obter métricas atuais
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  // Obter alertas ativos
  public getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => !alert.resolved)
  }

  // Obter todos os alertas
  public getAllAlerts(): PerformanceAlert[] {
    return [...this.alerts]
  }

  // Resetar métricas
  public resetMetrics(): void {
    this.requestTimes = []
    this.errorCount = 0
    this.totalRequests = 0
    this.slowQueryCount = 0
    this.cacheHits = 0
    this.cacheMisses = 0
    
    this.metrics = {
      requestCount: 0,
      averageResponseTime: 0,
      slowQueries: 0,
      errorRate: 0,
      memoryUsage: process.memoryUsage(),
      activeConnections: 0,
      cacheHitRate: 0,
      lastUpdated: new Date()
    }

    appLogger.info('general', 'Métricas resetadas')
  }

  // Obter relatório de performance
  public getPerformanceReport(): {
    metrics: PerformanceMetrics
    alerts: PerformanceAlert[]
    summary: {
      status: 'healthy' | 'warning' | 'critical'
      issues: string[]
      recommendations: string[]
    }
  } {
    const activeAlerts = this.getActiveAlerts()
    const criticalAlerts = activeAlerts.filter(a => a.type === 'critical')
    const warningAlerts = activeAlerts.filter(a => a.type === 'warning')

    let status: 'healthy' | 'warning' | 'critical' = 'healthy'
    const issues: string[] = []
    const recommendations: string[] = []

    if (criticalAlerts.length > 0) {
      status = 'critical'
      issues.push(...criticalAlerts.map(a => a.message))
    } else if (warningAlerts.length > 0) {
      status = 'warning'
      issues.push(...warningAlerts.map(a => a.message))
    }

    // Gerar recomendações
    if (this.metrics.averageResponseTime > this.thresholds.responseTime.warning) {
      recommendations.push('Considere otimizar queries do banco de dados')
      recommendations.push('Implemente cache para consultas frequentes')
    }

    if (this.metrics.errorRate > this.thresholds.errorRate.warning) {
      recommendations.push('Revise logs de erro para identificar problemas')
      recommendations.push('Implemente melhor tratamento de erros')
    }

    if (this.metrics.cacheHitRate < this.thresholds.cacheHitRate.warning) {
      recommendations.push('Otimize estratégia de cache')
      recommendations.push('Aumente TTL do cache para dados estáveis')
    }

    return {
      metrics: this.getMetrics(),
      alerts: activeAlerts,
      summary: {
        status,
        issues,
        recommendations
      }
    }
  }
}

// Instância global do monitor
const globalMonitor = new PerformanceMonitor()

// Middleware para monitoramento automático
export function withPerformanceMonitoring(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now()
    
    try {
      const response = await handler(request)
      const responseTime = Date.now() - startTime
      
      // Registrar tempo de resposta
      globalMonitor.recordRequestTime(responseTime)
      
      // Adicionar headers de performance
      response.headers.set('X-Response-Time', `${responseTime}ms`)
      response.headers.set('X-Request-ID', `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
      
      return response
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      // Registrar erro e tempo de resposta
      globalMonitor.recordError()
      globalMonitor.recordRequestTime(responseTime)
      
      throw error
    }
  }
}

// Exportar instância global e funções utilitárias
export { globalMonitor as performanceMonitor }

export function getPerformanceMetrics(): PerformanceMetrics {
  return globalMonitor.getMetrics()
}

export function getPerformanceAlerts(): PerformanceAlert[] {
  return globalMonitor.getActiveAlerts()
}

export function getPerformanceReport() {
  return globalMonitor.getPerformanceReport()
}

export function recordCacheHit(): void {
  globalMonitor.recordCacheHit()
}

export function recordCacheMiss(): void {
  globalMonitor.recordCacheMiss()
}

export function resetPerformanceMetrics(): void {
  globalMonitor.resetMetrics()
}