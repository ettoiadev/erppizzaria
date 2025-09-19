/**
 * Sistema de Health Checks Avançado - FASE 2
 * Monitora a saúde de todos os componentes do sistema
 * Inclui verificações de banco de dados, APIs, performance e recursos
 */

import { Pool } from 'pg'
import { performance } from 'perf_hooks'
import { enhancedLogger } from './enhanced-structured-logger'
import fs from 'fs/promises'
import os from 'os'

// Tipos para health checks
export interface HealthCheckResult {
  name: string
  status: 'healthy' | 'warning' | 'critical' | 'unknown'
  message: string
  duration: number
  timestamp: string
  metadata?: Record<string, any>
  error?: string
}

export interface SystemHealthReport {
  overall_status: 'healthy' | 'warning' | 'critical'
  timestamp: string
  uptime: number
  checks: HealthCheckResult[]
  summary: {
    total: number
    healthy: number
    warning: number
    critical: number
    unknown: number
  }
  system_info: {
    node_version: string
    platform: string
    memory: NodeJS.MemoryUsage
    cpu_usage: number
    load_average: number[]
  }
}

interface HealthCheckConfig {
  enabled: boolean
  interval: number // em milissegundos
  timeout: number // timeout para cada check
  retries: number
  alertThresholds: {
    memory_usage_percent: number
    cpu_usage_percent: number
    response_time_ms: number
    disk_usage_percent: number
  }
}

class HealthCheckSystem {
  private config: HealthCheckConfig
  private pool: Pool
  private isRunning = false
  private intervalId?: NodeJS.Timeout
  private lastReport?: SystemHealthReport
  private startTime = Date.now()

  constructor(config?: Partial<HealthCheckConfig>) {
    this.config = {
      enabled: true,
      interval: 30000, // 30 segundos
      timeout: 5000,   // 5 segundos
      retries: 3,
      alertThresholds: {
        memory_usage_percent: 85,
        cpu_usage_percent: 80,
        response_time_ms: 2000,
        disk_usage_percent: 90
      },
      ...config
    }

    // Configurar pool do PostgreSQL
    this.pool = new Pool({
      user: process.env.POSTGRES_USER || 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      database: process.env.POSTGRES_DB || 'erp_pizzaria',
      password: process.env.POSTGRES_PASSWORD || '134679',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      max: 2, // Limite de conexões para health checks
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: this.config.timeout
    })
  }

  // Executar um health check individual com timeout e retry
  private async executeCheck(
    name: string,
    checkFunction: () => Promise<Omit<HealthCheckResult, 'name' | 'duration' | 'timestamp'>>
  ): Promise<HealthCheckResult> {
    const startTime = performance.now()
    let lastError: Error | undefined

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Health check timeout')), this.config.timeout)
        })

        const result = await Promise.race([
          checkFunction(),
          timeoutPromise
        ])

        const duration = performance.now() - startTime

        return {
          name,
          duration,
          timestamp: new Date().toISOString(),
          ...result
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        if (attempt < this.config.retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
      }
    }

    const duration = performance.now() - startTime
    return {
      name,
      status: 'critical',
      message: `Failed after ${this.config.retries} attempts`,
      duration,
      timestamp: new Date().toISOString(),
      error: lastError?.message
    }
  }

  // Health check do banco de dados PostgreSQL
  private async checkDatabase(): Promise<Omit<HealthCheckResult, 'name' | 'duration' | 'timestamp'>> {
    try {
      const client = await this.pool.connect()
      
      try {
        // Teste básico de conectividade
        const result = await client.query('SELECT NOW() as current_time, version() as version')
        
        // Verificar estatísticas do banco
        const statsResult = await client.query(`
          SELECT 
            (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
            (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections,
            (SELECT count(*) FROM categories) as categories_count,
            (SELECT count(*) FROM products) as products_count,
            (SELECT count(*) FROM profiles) as users_count
        `)
        
        const stats = statsResult.rows[0]
        const connectionUsage = (stats.active_connections / stats.max_connections) * 100
        
        let status: 'healthy' | 'warning' | 'critical' = 'healthy'
        let message = 'Database is healthy'
        
        if (connectionUsage > 80) {
          status = 'warning'
          message = `High connection usage: ${connectionUsage.toFixed(1)}%`
        }
        
        if (connectionUsage > 95) {
          status = 'critical'
          message = `Critical connection usage: ${connectionUsage.toFixed(1)}%`
        }
        
        return {
          status,
          message,
          metadata: {
            version: result.rows[0].version.split(' ')[0],
            current_time: result.rows[0].current_time,
            active_connections: stats.active_connections,
            max_connections: stats.max_connections,
            connection_usage_percent: connectionUsage,
            categories_count: stats.categories_count,
            products_count: stats.products_count,
            users_count: stats.users_count
          }
        }
      } finally {
        client.release()
      }
    } catch (error) {
      return {
        status: 'critical',
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  // Health check da memória do sistema
  private async checkMemory(): Promise<Omit<HealthCheckResult, 'name' | 'duration' | 'timestamp'>> {
    try {
      const memUsage = process.memoryUsage()
      const systemMem = {
        total: os.totalmem(),
        free: os.freemem()
      }
      
      const usedSystemMem = systemMem.total - systemMem.free
      const systemMemUsagePercent = (usedSystemMem / systemMem.total) * 100
      const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100
      
      let status: 'healthy' | 'warning' | 'critical' = 'healthy'
      let message = 'Memory usage is normal'
      
      if (systemMemUsagePercent > this.config.alertThresholds.memory_usage_percent) {
        status = 'warning'
        message = `High system memory usage: ${systemMemUsagePercent.toFixed(1)}%`
      }
      
      if (systemMemUsagePercent > 95 || heapUsagePercent > 90) {
        status = 'critical'
        message = `Critical memory usage - System: ${systemMemUsagePercent.toFixed(1)}%, Heap: ${heapUsagePercent.toFixed(1)}%`
      }
      
      return {
        status,
        message,
        metadata: {
          heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
          heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
          heap_usage_percent: heapUsagePercent,
          system_total_gb: Math.round(systemMem.total / 1024 / 1024 / 1024),
          system_free_gb: Math.round(systemMem.free / 1024 / 1024 / 1024),
          system_usage_percent: systemMemUsagePercent,
          rss_mb: Math.round(memUsage.rss / 1024 / 1024),
          external_mb: Math.round(memUsage.external / 1024 / 1024)
        }
      }
    } catch (error) {
      return {
        status: 'critical',
        message: 'Failed to check memory usage',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  // Health check do sistema de arquivos
  private async checkFileSystem(): Promise<Omit<HealthCheckResult, 'name' | 'duration' | 'timestamp'>> {
    try {
      // Verificar se consegue escrever/ler arquivos temporários
      const testFile = './temp-health-check.txt'
      const testContent = `Health check test - ${Date.now()}`
      
      await fs.writeFile(testFile, testContent)
      const readContent = await fs.readFile(testFile, 'utf-8')
      await fs.unlink(testFile)
      
      if (readContent !== testContent) {
        throw new Error('File content mismatch')
      }
      
      // Verificar espaço em disco (aproximado)
      const stats = await fs.stat('.')
      
      return {
        status: 'healthy',
        message: 'File system is accessible',
        metadata: {
          write_test: 'passed',
          read_test: 'passed',
          current_directory: process.cwd()
        }
      }
    } catch (error) {
      return {
        status: 'critical',
        message: 'File system access failed',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  // Health check das APIs internas
  private async checkInternalAPIs(): Promise<Omit<HealthCheckResult, 'name' | 'duration' | 'timestamp'>> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      
      // Testar endpoint de health básico
      const response = await fetch(`${baseUrl}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(this.config.timeout)
      })
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`)
      }
      
      const data = await response.json()
      
      return {
        status: 'healthy',
        message: 'Internal APIs are responding',
        metadata: {
          status_code: response.status,
          response_time_ms: response.headers.get('x-response-time'),
          api_version: data.version || 'unknown'
        }
      }
    } catch (error) {
      return {
        status: 'critical',
        message: 'Internal API check failed',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  // Health check do sistema operacional
  private async checkSystem(): Promise<Omit<HealthCheckResult, 'name' | 'duration' | 'timestamp'>> {
    try {
      const loadAvg = os.loadavg()
      const cpuCount = os.cpus().length
      const loadPercent = (loadAvg[0] / cpuCount) * 100
      
      let status: 'healthy' | 'warning' | 'critical' = 'healthy'
      let message = 'System load is normal'
      
      if (loadPercent > this.config.alertThresholds.cpu_usage_percent) {
        status = 'warning'
        message = `High system load: ${loadPercent.toFixed(1)}%`
      }
      
      if (loadPercent > 95) {
        status = 'critical'
        message = `Critical system load: ${loadPercent.toFixed(1)}%`
      }
      
      return {
        status,
        message,
        metadata: {
          platform: os.platform(),
          arch: os.arch(),
          node_version: process.version,
          uptime_hours: Math.round(os.uptime() / 3600),
          load_average_1m: loadAvg[0],
          load_average_5m: loadAvg[1],
          load_average_15m: loadAvg[2],
          cpu_count: cpuCount,
          load_percent: loadPercent
        }
      }
    } catch (error) {
      return {
        status: 'critical',
        message: 'System check failed',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  // Executar todos os health checks
  public async runHealthChecks(): Promise<SystemHealthReport> {
    const startTime = performance.now()
    
    await enhancedLogger.debug('system', 'Starting health checks')
    
    const checks = await Promise.all([
      this.executeCheck('database', () => this.checkDatabase()),
      this.executeCheck('memory', () => this.checkMemory()),
      this.executeCheck('filesystem', () => this.checkFileSystem()),
      this.executeCheck('internal_apis', () => this.checkInternalAPIs()),
      this.executeCheck('system', () => this.checkSystem())
    ])
    
    // Calcular status geral
    const summary = {
      total: checks.length,
      healthy: checks.filter(c => c.status === 'healthy').length,
      warning: checks.filter(c => c.status === 'warning').length,
      critical: checks.filter(c => c.status === 'critical').length,
      unknown: checks.filter(c => c.status === 'unknown').length
    }
    
    let overall_status: 'healthy' | 'warning' | 'critical' = 'healthy'
    if (summary.critical > 0) {
      overall_status = 'critical'
    } else if (summary.warning > 0) {
      overall_status = 'warning'
    }
    
    const report: SystemHealthReport = {
      overall_status,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      checks,
      summary,
      system_info: {
        node_version: process.version,
        platform: os.platform(),
        memory: process.memoryUsage(),
        cpu_usage: os.loadavg()[0],
        load_average: os.loadavg()
      }
    }
    
    this.lastReport = report
    
    const duration = performance.now() - startTime
    
    // Log do resultado
    if (overall_status === 'critical') {
      await enhancedLogger.critical('system', `Health check failed - ${summary.critical} critical issues`, {
        metadata: { summary, duration }
      })
    } else if (overall_status === 'warning') {
      await enhancedLogger.warn('system', `Health check warning - ${summary.warning} warnings`, {
        metadata: { summary, duration }
      })
    } else {
      await enhancedLogger.info('system', 'Health check completed successfully', {
        metadata: { summary, duration }
      })
    }
    
    return report
  }

  // Iniciar monitoramento contínuo
  public startMonitoring(): void {
    if (!this.config.enabled || this.isRunning) return
    
    this.isRunning = true
    
    enhancedLogger.info('system', 'Starting health check monitoring', {
      metadata: { interval: this.config.interval }
    })
    
    // Executar imediatamente
    this.runHealthChecks()
    
    // Configurar intervalo
    this.intervalId = setInterval(() => {
      this.runHealthChecks()
    }, this.config.interval)
  }

  // Parar monitoramento
  public stopMonitoring(): void {
    if (!this.isRunning) return
    
    this.isRunning = false
    
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }
    
    enhancedLogger.info('system', 'Health check monitoring stopped')
  }

  // Obter último relatório
  public getLastReport(): SystemHealthReport | undefined {
    return this.lastReport
  }

  // Verificar se o sistema está saudável
  public isHealthy(): boolean {
    return this.lastReport?.overall_status === 'healthy'
  }

  // Obter métricas resumidas
  public getMetrics(): Record<string, any> {
    if (!this.lastReport) return {}
    
    return {
      status: this.lastReport.overall_status,
      uptime: this.lastReport.uptime,
      checks_total: this.lastReport.summary.total,
      checks_healthy: this.lastReport.summary.healthy,
      checks_warning: this.lastReport.summary.warning,
      checks_critical: this.lastReport.summary.critical,
      memory_usage_mb: Math.round(this.lastReport.system_info.memory.heapUsed / 1024 / 1024),
      cpu_load: this.lastReport.system_info.cpu_usage,
      last_check: this.lastReport.timestamp
    }
  }

  // Cleanup
  public async shutdown(): Promise<void> {
    this.stopMonitoring()
    await this.pool.end()
    enhancedLogger.info('system', 'Health check system shutdown completed')
  }
}

// Instância singleton
export const healthCheckSystem = new HealthCheckSystem()

// Função para inicializar o sistema de health checks
export function initializeHealthChecks(config?: Partial<HealthCheckConfig>): void {
  if (config) {
    healthCheckSystem.updateConfig(config)
  }
  
  healthCheckSystem.startMonitoring()
  
  // Configurar handlers de shutdown
  process.on('SIGINT', () => healthCheckSystem.shutdown())
  process.on('SIGTERM', () => healthCheckSystem.shutdown())
}

// Exportar tipos
export type { HealthCheckConfig, SystemHealthReport, HealthCheckResult }