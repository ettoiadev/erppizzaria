// Sistema de monitoramento de erros avançado
import { frontendLogger } from './frontend-logger'
import { AppError, createAppError } from './error-handler'
import { DatabaseErrorType } from './database-error-handler'

// Tipos de métricas de erro
export enum ErrorMetricType {
  TOTAL_ERRORS = 'total_errors',
  ERROR_RATE = 'error_rate',
  RESPONSE_TIME = 'response_time',
  DATABASE_ERRORS = 'database_errors',
  VALIDATION_ERRORS = 'validation_errors',
  RATE_LIMIT_HITS = 'rate_limit_hits',
  SECURITY_INCIDENTS = 'security_incidents',
  CRITICAL_ERRORS = 'critical_errors'
}

// Interface para métricas de erro
interface ErrorMetric {
  type: ErrorMetricType
  value: number
  timestamp: number
  metadata?: Record<string, any>
}

// Interface para relatório de erro
interface ErrorReport {
  id: string
  timestamp: number
  type: string
  message: string
  stack?: string
  url: string
  method: string
  userAgent?: string
  ip?: string
  userId?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'validation' | 'database' | 'authentication' | 'authorization' | 'rate_limit' | 'security' | 'system' | 'unknown'
  metadata?: Record<string, any>
  resolved: boolean
  responseTime?: number
}

// Interface para alertas
interface Alert {
  id: string
  type: 'threshold' | 'anomaly' | 'security' | 'critical'
  message: string
  timestamp: number
  severity: 'warning' | 'error' | 'critical'
  metadata: Record<string, any>
  acknowledged: boolean
}

// Configuração de monitoramento
interface MonitoringConfig {
  enableMetrics: boolean
  enableAlerts: boolean
  errorThresholds: {
    errorRate: number // Porcentagem de erro por minuto
    responseTime: number // Tempo de resposta em ms
    criticalErrors: number // Número de erros críticos por hora
    securityIncidents: number // Incidentes de segurança por hora
  }
  retentionDays: number
  alertWebhook?: string
}

// Configuração padrão
const DEFAULT_CONFIG: MonitoringConfig = {
  enableMetrics: true,
  enableAlerts: true,
  errorThresholds: {
    errorRate: 10, // 10% de erro por minuto
    responseTime: 5000, // 5 segundos
    criticalErrors: 5, // 5 erros críticos por hora
    securityIncidents: 3 // 3 incidentes de segurança por hora
  },
  retentionDays: 30
}

// Store em memória para métricas e relatórios
class ErrorMonitoringStore {
  private metrics: ErrorMetric[] = []
  private reports: ErrorReport[] = []
  private alerts: Alert[] = []
  private requestCounts = new Map<string, { total: number; errors: number; responseTime: number[] }>()
  
  // Adicionar métrica
  addMetric(metric: ErrorMetric): void {
    this.metrics.push(metric)
    this.cleanup()
  }
  
  // Adicionar relatório de erro
  addReport(report: ErrorReport): void {
    this.reports.push(report)
    this.cleanup()
  }
  
  // Adicionar alerta
  addAlert(alert: Alert): void {
    this.alerts.push(alert)
    this.cleanup()
  }
  
  // Obter métricas por tipo e período
  getMetrics(type: ErrorMetricType, since: number): ErrorMetric[] {
    return this.metrics.filter(m => m.type === type && m.timestamp >= since)
  }
  
  // Obter relatórios por período
  getReports(since: number, category?: string): ErrorReport[] {
    return this.reports.filter(r => {
      const timeMatch = r.timestamp >= since
      const categoryMatch = !category || r.category === category
      return timeMatch && categoryMatch
    })
  }
  
  // Obter alertas não reconhecidos
  getUnacknowledgedAlerts(): Alert[] {
    return this.alerts.filter(a => !a.acknowledged)
  }
  
  // Atualizar contadores de request
  updateRequestCount(key: string, isError: boolean, responseTime: number): void {
    const current = this.requestCounts.get(key) || { total: 0, errors: 0, responseTime: [] }
    current.total++
    if (isError) current.errors++
    current.responseTime.push(responseTime)
    
    // Manter apenas os últimos 100 tempos de resposta
    if (current.responseTime.length > 100) {
      current.responseTime = current.responseTime.slice(-100)
    }
    
    this.requestCounts.set(key, current)
  }
  
  // Obter estatísticas de request
  getRequestStats(key: string): { total: number; errors: number; errorRate: number; avgResponseTime: number } {
    const stats = this.requestCounts.get(key) || { total: 0, errors: 0, responseTime: [] }
    const errorRate = stats.total > 0 ? (stats.errors / stats.total) * 100 : 0
    const avgResponseTime = stats.responseTime.length > 0 
      ? stats.responseTime.reduce((a, b) => a + b, 0) / stats.responseTime.length 
      : 0
    
    return {
      total: stats.total,
      errors: stats.errors,
      errorRate,
      avgResponseTime
    }
  }
  
  // Limpeza de dados antigos
  private cleanup(): void {
    const cutoff = Date.now() - (DEFAULT_CONFIG.retentionDays * 24 * 60 * 60 * 1000)
    
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff)
    this.reports = this.reports.filter(r => r.timestamp >= cutoff)
    this.alerts = this.alerts.filter(a => a.timestamp >= cutoff)
  }
}

// Instância global do store
const store = new ErrorMonitoringStore()

// Classe principal do sistema de monitoramento
export class ErrorMonitoring {
  private config: MonitoringConfig
  
  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }
  
  // Reportar erro
  reportError(
    error: Error | AppError,
    context: {
      url: string
      method: string
      userAgent?: string
      ip?: string
      userId?: string
      responseTime?: number
      metadata?: Record<string, any>
    }
  ): void {
    const report: ErrorReport = {
      id: this.generateId(),
      timestamp: Date.now(),
      type: error.constructor.name,
      message: error.message,
      stack: error.stack || (error as any).stack,
      url: context.url,
      method: context.method,
      userAgent: context.userAgent,
      ip: context.ip,
      userId: context.userId,
      severity: this.determineSeverity(error),
      category: this.categorizeError(error),
      metadata: context.metadata,
      resolved: false,
      responseTime: context.responseTime
    }
    
    if (this.config.enableMetrics) {
      store.addReport(report)
      this.updateMetrics(report)
    }
    
    // Log do erro
    frontendLogger.logError('Erro monitorado', {
      errorId: report.id,
      category: report.category,
      severity: report.severity,
      url: context.url,
      method: context.method
    }, error, 'api')
    
    // Verificar se deve gerar alerta
    if (this.config.enableAlerts) {
      this.checkAlertConditions(report)
    }
  }
  
  // Reportar métrica personalizada
  reportMetric(type: ErrorMetricType, value: number, metadata?: Record<string, any>): void {
    if (!this.config.enableMetrics) return
    
    const metric: ErrorMetric = {
      type,
      value,
      timestamp: Date.now(),
      metadata
    }
    
    store.addMetric(metric)
  }
  
  // Atualizar estatísticas de request
  updateRequestStats(url: string, method: string, isError: boolean, responseTime: number): void {
    const key = `${method}:${url}`
    store.updateRequestCount(key, isError, responseTime)
    
    // Reportar métricas
    if (this.config.enableMetrics) {
      this.reportMetric(ErrorMetricType.RESPONSE_TIME, responseTime, { url, method })
      
      if (isError) {
        this.reportMetric(ErrorMetricType.TOTAL_ERRORS, 1, { url, method })
      }
    }
  }
  
  // Obter dashboard de métricas
  getDashboard(): {
    summary: {
      totalErrors: number
      errorRate: number
      avgResponseTime: number
      criticalErrors: number
      securityIncidents: number
    }
    recentErrors: ErrorReport[]
    activeAlerts: Alert[]
    topErrorUrls: Array<{ url: string; count: number }>
  } {
    const now = Date.now()
    const lastHour = now - (60 * 60 * 1000)
    const last24Hours = now - (24 * 60 * 60 * 1000)
    
    const recentReports = store.getReports(lastHour)
    const dailyReports = store.getReports(last24Hours)
    
    // Calcular métricas
    const totalErrors = recentReports.length
    const criticalErrors = recentReports.filter(r => r.severity === 'critical').length
    const securityIncidents = recentReports.filter(r => r.category === 'security').length
    
    const responseTimeMetrics = store.getMetrics(ErrorMetricType.RESPONSE_TIME, lastHour)
    const avgResponseTime = responseTimeMetrics.length > 0
      ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length
      : 0
    
    // Calcular taxa de erro (aproximada)
    const errorRate = totalErrors > 0 ? (totalErrors / 60) * 100 : 0 // Erros por minuto como porcentagem
    
    // URLs com mais erros
    const urlErrorCounts = new Map<string, number>()
    dailyReports.forEach(report => {
      const count = urlErrorCounts.get(report.url) || 0
      urlErrorCounts.set(report.url, count + 1)
    })
    
    const topErrorUrls = Array.from(urlErrorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([url, count]) => ({ url, count }))
    
    return {
      summary: {
        totalErrors,
        errorRate,
        avgResponseTime,
        criticalErrors,
        securityIncidents
      },
      recentErrors: recentReports.slice(-20),
      activeAlerts: store.getUnacknowledgedAlerts(),
      topErrorUrls
    }
  }
  
  // Determinar severidade do erro
  private determineSeverity(error: Error | AppError): 'low' | 'medium' | 'high' | 'critical' {
    if ('statusCode' in error && typeof error.statusCode === 'number') {
      if (error.statusCode >= 500) return 'critical'
      if (error.statusCode >= 400) return 'high'
      return 'medium'
    }
    
    // Erros críticos do sistema
    if (error.message.includes('ECONNREFUSED') || 
        error.message.includes('timeout') ||
        error.message.includes('out of memory')) {
      return 'critical'
    }
    
    // Erros de segurança
    if (error.message.includes('unauthorized') ||
        error.message.includes('forbidden') ||
        error.message.includes('injection')) {
      return 'high'
    }
    
    return 'medium'
  }
  
  // Categorizar erro
  private categorizeError(error: Error | AppError): ErrorReport['category'] {
    const message = error.message.toLowerCase()
    
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation'
    }
    
    if (message.includes('database') || message.includes('connection')) {
      return 'database'
    }
    
    if (message.includes('unauthorized') || message.includes('token')) {
      return 'authentication'
    }
    
    if (message.includes('forbidden') || message.includes('permission')) {
      return 'authorization'
    }
    
    if (message.includes('rate limit') || message.includes('too many')) {
      return 'rate_limit'
    }
    
    if (message.includes('injection') || message.includes('malicious') || message.includes('suspicious')) {
      return 'security'
    }
    
    if ('statusCode' in error && typeof error.statusCode === 'number' && error.statusCode >= 500) {
      return 'system'
    }
    
    return 'unknown'
  }
  
  // Atualizar métricas baseado no relatório
  private updateMetrics(report: ErrorReport): void {
    // Métrica de erro total
    this.reportMetric(ErrorMetricType.TOTAL_ERRORS, 1, {
      category: report.category,
      severity: report.severity
    })
    
    // Métricas específicas por categoria
    if (report.category === 'database') {
      this.reportMetric(ErrorMetricType.DATABASE_ERRORS, 1, {
        type: report.type
      })
    }
    
    if (report.category === 'validation') {
      this.reportMetric(ErrorMetricType.VALIDATION_ERRORS, 1, {
        url: report.url
      })
    }
    
    if (report.category === 'security') {
      this.reportMetric(ErrorMetricType.SECURITY_INCIDENTS, 1, {
        ip: report.ip,
        userAgent: report.userAgent
      })
    }
    
    if (report.severity === 'critical') {
      this.reportMetric(ErrorMetricType.CRITICAL_ERRORS, 1, {
        type: report.type,
        url: report.url
      })
    }
  }
  
  // Verificar condições de alerta
  private checkAlertConditions(report: ErrorReport): void {
    const now = Date.now()
    const lastHour = now - (60 * 60 * 1000)
    const lastMinute = now - (60 * 1000)
    
    // Alerta para erro crítico
    if (report.severity === 'critical') {
      this.createAlert('critical', `Erro crítico detectado: ${report.message}`, {
        errorId: report.id,
        url: report.url,
        type: report.type
      })
    }
    
    // Alerta para incidente de segurança
    if (report.category === 'security') {
      this.createAlert('security', `Incidente de segurança detectado: ${report.message}`, {
        errorId: report.id,
        ip: report.ip,
        userAgent: report.userAgent
      })
    }
    
    // Verificar thresholds
    const recentErrors = store.getReports(lastMinute)
    const hourlyErrors = store.getReports(lastHour)
    
    // Taxa de erro alta
    if (recentErrors.length >= this.config.errorThresholds.errorRate) {
      this.createAlert('threshold', `Taxa de erro alta: ${recentErrors.length} erros no último minuto`, {
        errorCount: recentErrors.length,
        threshold: this.config.errorThresholds.errorRate
      })
    }
    
    // Muitos erros críticos
    const criticalErrors = hourlyErrors.filter(r => r.severity === 'critical').length
    if (criticalErrors >= this.config.errorThresholds.criticalErrors) {
      this.createAlert('threshold', `Muitos erros críticos: ${criticalErrors} na última hora`, {
        criticalCount: criticalErrors,
        threshold: this.config.errorThresholds.criticalErrors
      })
    }
    
    // Incidentes de segurança
    const securityIncidents = hourlyErrors.filter(r => r.category === 'security').length
    if (securityIncidents >= this.config.errorThresholds.securityIncidents) {
      this.createAlert('security', `Múltiplos incidentes de segurança: ${securityIncidents} na última hora`, {
        incidentCount: securityIncidents,
        threshold: this.config.errorThresholds.securityIncidents
      })
    }
  }
  
  // Criar alerta
  private createAlert(
    type: Alert['type'],
    message: string,
    metadata: Record<string, any>
  ): void {
    const alert: Alert = {
      id: this.generateId(),
      type,
      message,
      timestamp: Date.now(),
      severity: type === 'critical' ? 'critical' : type === 'security' ? 'error' : 'warning',
      metadata,
      acknowledged: false
    }
    
    store.addAlert(alert)
    
    // Log do alerta
    frontendLogger.warn('Alerta gerado', 'api', {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      metadata: alert.metadata
    })
    
    // Enviar webhook se configurado
    if (this.config.alertWebhook) {
      this.sendWebhookAlert(alert)
    }
  }
  
  // Enviar alerta via webhook
  private async sendWebhookAlert(alert: Alert): Promise<void> {
    try {
      await fetch(this.config.alertWebhook!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          alert,
          timestamp: new Date(alert.timestamp).toISOString(),
          environment: process.env.NODE_ENV
        })
      })
    } catch (error) {
      frontendLogger.logError('Erro ao enviar webhook de alerta', {
        alertId: alert.id,
        webhook: this.config.alertWebhook
      }, error as Error, 'api')
    }
  }
  
  // Gerar ID único
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Instância global do sistema de monitoramento
export const errorMonitoring = new ErrorMonitoring()

// Middleware para monitoramento automático de APIs
export function withErrorMonitoring<T extends any[]>(
  handler: (...args: T) => Promise<any>
) {
  return async (...args: T): Promise<any> => {
    const req = args[0] as any // NextRequest ou similar
    const startTime = Date.now()
    
    try {
      const result = await handler(...args)
      const responseTime = Date.now() - startTime
      
      // Atualizar estatísticas de sucesso
      errorMonitoring.updateRequestStats(
        req.url || req.nextUrl?.pathname || 'unknown',
        req.method || 'GET',
        false,
        responseTime
      )
      
      return result
      
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      // Reportar erro
      errorMonitoring.reportError(error as Error, {
        url: req.url || req.nextUrl?.pathname || 'unknown',
        method: req.method || 'GET',
        userAgent: req.headers?.get?.('user-agent'),
        ip: req.headers?.get?.('x-forwarded-for') || req.ip,
        responseTime
      })
      
      // Atualizar estatísticas de erro
      errorMonitoring.updateRequestStats(
        req.url || req.nextUrl?.pathname || 'unknown',
        req.method || 'GET',
        true,
        responseTime
      )
      
      throw error
    }
  }
}

export default {
  ErrorMonitoring,
  errorMonitoring,
  withErrorMonitoring,
  ErrorMetricType
}