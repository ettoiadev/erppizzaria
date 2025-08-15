# Sistema de Logs e Monitoramento - ERP Pizzaria

## Status Atual do Sistema

### ✅ Componentes Já Implementados

#### 1. Sistema de Logging Estruturado
- **Configuração Centralizada**: `lib/logging-config.ts`
- **Logger Principal**: `lib/logging.ts`
- **Frontend Logger**: `lib/frontend-logger.ts`
- **Supabase Logger**: `lib/supabase-logger.ts`
- **API Middleware**: `lib/api-logger-middleware.ts`

#### 2. Tratamento de Erros
- **Error Handler**: `lib/error-handler.ts`
- **Hook de Erros**: `hooks/useErrorHandling.ts`
- **Error Boundary**: `components/ErrorBoundary.tsx`

#### 3. Monitoramento Básico
- **System Status API**: `app/api/system-status/route.ts`
- **Debug API**: `app/api/admin/debug/route.ts`
- **Performance Metrics**: Supabase Logger com métricas

### 🔧 Melhorias Necessárias

## 1. Sistema de Métricas Avançado

### 1.1 Implementar Web Vitals Monitoring

```typescript
// lib/web-vitals-monitor.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'
import { appLogger } from './logging'

interface VitalMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: string
  url: string
  userId?: string
}

class WebVitalsMonitor {
  private metrics: VitalMetric[] = []
  private maxMetrics = 100

  constructor() {
    this.initializeVitals()
  }

  private initializeVitals() {
    const sendToAnalytics = (metric: any) => {
      const vitalMetric: VitalMetric = {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        timestamp: new Date().toISOString(),
        url: window.location.pathname,
        userId: this.getCurrentUserId()
      }

      this.addMetric(vitalMetric)
      this.logMetric(vitalMetric)
    }

    getCLS(sendToAnalytics)
    getFID(sendToAnalytics)
    getFCP(sendToAnalytics)
    getLCP(sendToAnalytics)
    getTTFB(sendToAnalytics)
  }

  private addMetric(metric: VitalMetric) {
    this.metrics.push(metric)
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }
  }

  private logMetric(metric: VitalMetric) {
    const level = metric.rating === 'poor' ? 'warn' : 'info'
    appLogger.log(level, 'performance', `Web Vital: ${metric.name}`, {
      value: metric.value,
      rating: metric.rating,
      url: metric.url,
      userId: metric.userId
    })
  }

  private getCurrentUserId(): string | undefined {
    // Implementar lógica para obter userId do contexto de auth
    return undefined
  }

  getMetrics(): VitalMetric[] {
    return [...this.metrics]
  }

  getMetricsByName(name: string): VitalMetric[] {
    return this.metrics.filter(m => m.name === name)
  }

  getAverageMetric(name: string): number {
    const metrics = this.getMetricsByName(name)
    if (metrics.length === 0) return 0
    return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length
  }
}

export const webVitalsMonitor = new WebVitalsMonitor()
```

### 1.2 Sistema de Health Checks

```typescript
// lib/health-monitor.ts
import { appLogger } from './logging'
import { getSupabaseServerClient } from './supabase'

interface HealthCheck {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime: number
  error?: string
  timestamp: string
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy'
  checks: HealthCheck[]
  uptime: number
  lastCheck: string
}

class HealthMonitor {
  private startTime = Date.now()
  private lastHealthCheck?: SystemHealth
  private checkInterval = 60000 // 1 minuto
  private intervalId?: NodeJS.Timeout

  constructor() {
    this.startMonitoring()
  }

  private startMonitoring() {
    this.performHealthCheck()
    this.intervalId = setInterval(() => {
      this.performHealthCheck()
    }, this.checkInterval)
  }

  private async performHealthCheck(): Promise<SystemHealth> {
    const checks: HealthCheck[] = []
    
    // Check Database
    checks.push(await this.checkDatabase())
    
    // Check APIs
    checks.push(await this.checkAPI('/api/products'))
    checks.push(await this.checkAPI('/api/orders'))
    checks.push(await this.checkAPI('/api/customers'))
    
    // Check External Services
    checks.push(await this.checkExternalService())
    
    const unhealthyChecks = checks.filter(c => c.status === 'unhealthy')
    const degradedChecks = checks.filter(c => c.status === 'degraded')
    
    let overall: SystemHealth['overall'] = 'healthy'
    if (unhealthyChecks.length > 0) {
      overall = 'unhealthy'
    } else if (degradedChecks.length > 0) {
      overall = 'degraded'
    }
    
    const health: SystemHealth = {
      overall,
      checks,
      uptime: Date.now() - this.startTime,
      lastCheck: new Date().toISOString()
    }
    
    this.lastHealthCheck = health
    this.logHealthStatus(health)
    
    return health
  }

  private async checkDatabase(): Promise<HealthCheck> {
    const start = Date.now()
    try {
      const supabase = getSupabaseServerClient()
      const { error } = await supabase.from('products').select('id').limit(1)
      
      const responseTime = Date.now() - start
      
      if (error) {
        return {
          name: 'database',
          status: 'unhealthy',
          responseTime,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }
      
      return {
        name: 'database',
        status: responseTime > 1000 ? 'degraded' : 'healthy',
        responseTime,
        timestamp: new Date().toISOString()
      }
    } catch (error: any) {
      return {
        name: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  private async checkAPI(endpoint: string): Promise<HealthCheck> {
    const start = Date.now()
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const responseTime = Date.now() - start
      
      return {
        name: `api${endpoint}`,
        status: response.ok ? (responseTime > 2000 ? 'degraded' : 'healthy') : 'unhealthy',
        responseTime,
        error: response.ok ? undefined : `HTTP ${response.status}`,
        timestamp: new Date().toISOString()
      }
    } catch (error: any) {
      return {
        name: `api${endpoint}`,
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  private async checkExternalService(): Promise<HealthCheck> {
    const start = Date.now()
    try {
      // Verificar serviços externos como CEP, pagamento, etc.
      const response = await fetch('https://viacep.com.br/ws/01001000/json/')
      const responseTime = Date.now() - start
      
      return {
        name: 'external_services',
        status: response.ok ? (responseTime > 3000 ? 'degraded' : 'healthy') : 'unhealthy',
        responseTime,
        error: response.ok ? undefined : `HTTP ${response.status}`,
        timestamp: new Date().toISOString()
      }
    } catch (error: any) {
      return {
        name: 'external_services',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  private logHealthStatus(health: SystemHealth) {
    const level = health.overall === 'healthy' ? 'info' : 
                 health.overall === 'degraded' ? 'warn' : 'error'
    
    appLogger.log(level, 'general', `System Health: ${health.overall}`, {
      checks: health.checks.map(c => ({
        name: c.name,
        status: c.status,
        responseTime: c.responseTime,
        error: c.error
      })),
      uptime: health.uptime
    })
  }

  getLastHealthCheck(): SystemHealth | undefined {
    return this.lastHealthCheck
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
  }
}

export const healthMonitor = new HealthMonitor()
```

### 1.3 Sistema de Alertas

```typescript
// lib/alert-system.ts
import { appLogger } from './logging'

interface Alert {
  id: string
  type: 'error' | 'warning' | 'info'
  title: string
  message: string
  source: string
  timestamp: string
  resolved: boolean
  metadata?: any
}

interface AlertRule {
  id: string
  name: string
  condition: (data: any) => boolean
  severity: Alert['type']
  message: string
  cooldown: number // ms
}

class AlertSystem {
  private alerts: Alert[] = []
  private rules: AlertRule[] = []
  private lastAlertTime: Map<string, number> = new Map()
  private maxAlerts = 100

  constructor() {
    this.initializeDefaultRules()
  }

  private initializeDefaultRules() {
    // Regra para erros críticos
    this.addRule({
      id: 'critical_errors',
      name: 'Erros Críticos',
      condition: (data) => data.level === 'critical',
      severity: 'error',
      message: 'Erro crítico detectado no sistema',
      cooldown: 300000 // 5 minutos
    })

    // Regra para performance degradada
    this.addRule({
      id: 'slow_queries',
      name: 'Queries Lentas',
      condition: (data) => data.context === 'database' && data.duration > 2000,
      severity: 'warning',
      message: 'Query lenta detectada',
      cooldown: 60000 // 1 minuto
    })

    // Regra para muitos erros em sequência
    this.addRule({
      id: 'error_burst',
      name: 'Rajada de Erros',
      condition: (data) => this.getRecentErrorCount() > 10,
      severity: 'error',
      message: 'Muitos erros detectados em pouco tempo',
      cooldown: 600000 // 10 minutos
    })
  }

  addRule(rule: AlertRule) {
    this.rules.push(rule)
  }

  checkRules(data: any) {
    for (const rule of this.rules) {
      if (rule.condition(data)) {
        this.triggerAlert(rule, data)
      }
    }
  }

  private triggerAlert(rule: AlertRule, data: any) {
    const now = Date.now()
    const lastAlert = this.lastAlertTime.get(rule.id)
    
    // Verificar cooldown
    if (lastAlert && (now - lastAlert) < rule.cooldown) {
      return
    }
    
    const alert: Alert = {
      id: `${rule.id}_${now}`,
      type: rule.severity,
      title: rule.name,
      message: rule.message,
      source: data.context || 'system',
      timestamp: new Date().toISOString(),
      resolved: false,
      metadata: data
    }
    
    this.addAlert(alert)
    this.lastAlertTime.set(rule.id, now)
  }

  private addAlert(alert: Alert) {
    this.alerts.unshift(alert)
    if (this.alerts.length > this.maxAlerts) {
      this.alerts.pop()
    }
    
    // Log do alerta
    appLogger.log(alert.type, 'general', `ALERT: ${alert.title}`, {
      message: alert.message,
      source: alert.source,
      metadata: alert.metadata
    })
    
    // Enviar notificação (implementar conforme necessário)
    this.sendNotification(alert)
  }

  private sendNotification(alert: Alert) {
    // Implementar envio de notificações
    // Email, Slack, Discord, etc.
    console.warn(`🚨 ALERT: ${alert.title} - ${alert.message}`)
  }

  private getRecentErrorCount(): number {
    const fiveMinutesAgo = Date.now() - 300000
    return this.alerts.filter(a => 
      a.type === 'error' && 
      new Date(a.timestamp).getTime() > fiveMinutesAgo
    ).length
  }

  getAlerts(resolved?: boolean): Alert[] {
    if (resolved === undefined) return [...this.alerts]
    return this.alerts.filter(a => a.resolved === resolved)
  }

  resolveAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
      appLogger.info('general', `Alert resolved: ${alert.title}`, { alertId })
    }
  }
}

export const alertSystem = new AlertSystem()
```

## 2. Dashboard de Monitoramento

### 2.1 Componente de Métricas em Tempo Real

```typescript
// components/admin/monitoring/monitoring-dashboard.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, CheckCircle, XCircle, Activity, Database, Globe } from 'lucide-react'

interface MonitoringDashboardProps {
  refreshInterval?: number
}

export function MonitoringDashboard({ refreshInterval = 30000 }: MonitoringDashboardProps) {
  const [systemHealth, setSystemHealth] = useState<any>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [metrics, setMetrics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMonitoringData()
    const interval = setInterval(fetchMonitoringData, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval])

  const fetchMonitoringData = async () => {
    try {
      const [healthRes, alertsRes, metricsRes] = await Promise.all([
        fetch('/api/monitoring/health'),
        fetch('/api/monitoring/alerts'),
        fetch('/api/monitoring/metrics')
      ])

      const [health, alertsData, metricsData] = await Promise.all([
        healthRes.json(),
        alertsRes.json(),
        metricsRes.json()
      ])

      setSystemHealth(health)
      setAlerts(alertsData.alerts || [])
      setMetrics(metricsData.metrics || [])
    } catch (error) {
      console.error('Erro ao buscar dados de monitoramento:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'unhealthy': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800'
      case 'degraded': return 'bg-yellow-100 text-yellow-800'
      case 'unhealthy': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status Geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
            {getStatusIcon(systemHealth?.overall)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {systemHealth?.overall || 'Desconhecido'}
            </div>
            <p className="text-xs text-muted-foreground">
              Última verificação: {systemHealth?.lastCheck ? 
                new Date(systemHealth.lastCheck).toLocaleTimeString() : 'N/A'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alerts.filter(a => !a.resolved).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {alerts.filter(a => a.type === 'error' && !a.resolved).length} críticos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemHealth?.uptime ? 
                Math.floor(systemHealth.uptime / 1000 / 60) + 'm' : 'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Desde o último restart
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Detalhes */}
      <Tabs defaultValue="health" className="space-y-4">
        <TabsList>
          <TabsTrigger value="health">Health Checks</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status dos Serviços</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemHealth?.checks?.map((check: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(check.status)}
                      <div>
                        <p className="font-medium capitalize">{check.name.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          Tempo de resposta: {check.responseTime}ms
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(check.status)}>
                      {check.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.slice(0, 10).map((alert: any) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {alert.type === 'error' ? 
                        <XCircle className="h-4 w-4 text-red-500" /> :
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      }
                      <div>
                        <p className="font-medium">{alert.title}</p>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={alert.resolved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {alert.resolved ? 'Resolvido' : 'Ativo'}
                      </Badge>
                      {!alert.resolved && (
                        <Button size="sm" variant="outline" onClick={() => resolveAlert(alert.id)}>
                          Resolver
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metrics.map((metric: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h4 className="font-medium">{metric.name}</h4>
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <p className="text-sm text-muted-foreground">{metric.unit}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )

  async function resolveAlert(alertId: string) {
    try {
      await fetch(`/api/monitoring/alerts/${alertId}/resolve`, {
        method: 'POST'
      })
      fetchMonitoringData()
    } catch (error) {
      console.error('Erro ao resolver alerta:', error)
    }
  }
}
```

## 3. APIs de Monitoramento

### 3.1 API de Health Check

```typescript
// app/api/monitoring/health/route.ts
import { NextResponse } from 'next/server'
import { healthMonitor } from '@/lib/health-monitor'

export async function GET() {
  try {
    const health = healthMonitor.getLastHealthCheck()
    
    if (!health) {
      return NextResponse.json({
        overall: 'unknown',
        checks: [],
        uptime: 0,
        lastCheck: new Date().toISOString()
      })
    }
    
    return NextResponse.json(health)
  } catch (error: any) {
    return NextResponse.json({
      error: 'Erro ao obter status de saúde',
      details: error.message
    }, { status: 500 })
  }
}
```

### 3.2 API de Alertas

```typescript
// app/api/monitoring/alerts/route.ts
import { NextResponse } from 'next/server'
import { alertSystem } from '@/lib/alert-system'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const resolved = searchParams.get('resolved')
    
    const alerts = alertSystem.getAlerts(
      resolved === 'true' ? true : resolved === 'false' ? false : undefined
    )
    
    return NextResponse.json({ alerts })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Erro ao obter alertas',
      details: error.message
    }, { status: 500 })
  }
}
```

### 3.3 API de Métricas

```typescript
// app/api/monitoring/metrics/route.ts
import { NextResponse } from 'next/server'
import { webVitalsMonitor } from '@/lib/web-vitals-monitor'
import { appLogger } from '@/lib/logging'

export async function GET() {
  try {
    const vitals = webVitalsMonitor.getMetrics()
    
    const metrics = [
      {
        name: 'Largest Contentful Paint (LCP)',
        value: webVitalsMonitor.getAverageMetric('LCP').toFixed(0),
        unit: 'ms'
      },
      {
        name: 'First Input Delay (FID)',
        value: webVitalsMonitor.getAverageMetric('FID').toFixed(0),
        unit: 'ms'
      },
      {
        name: 'Cumulative Layout Shift (CLS)',
        value: webVitalsMonitor.getAverageMetric('CLS').toFixed(3),
        unit: 'score'
      },
      {
        name: 'First Contentful Paint (FCP)',
        value: webVitalsMonitor.getAverageMetric('FCP').toFixed(0),
        unit: 'ms'
      },
      {
        name: 'Time to First Byte (TTFB)',
        value: webVitalsMonitor.getAverageMetric('TTFB').toFixed(0),
        unit: 'ms'
      }
    ]
    
    return NextResponse.json({ metrics, vitals })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Erro ao obter métricas',
      details: error.message
    }, { status: 500 })
  }
}
```

## 4. Integração com Serviços Externos

### 4.1 Sentry para Error Tracking

```typescript
// lib/sentry-config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  beforeSend(event) {
    // Filtrar eventos sensíveis
    if (event.exception) {
      const error = event.exception.values?.[0]
      if (error?.value?.includes('password') || error?.value?.includes('token')) {
        return null
      }
    }
    return event
  }
})
```

### 4.2 Integração com Vercel Analytics

```typescript
// lib/vercel-analytics.ts
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Analytics />
      <SpeedInsights />
    </>
  )
}
```

## 5. Configuração de Produção

### 5.1 Variáveis de Ambiente

```env
# Monitoramento
ENABLE_MONITORING=true
HEALTH_CHECK_INTERVAL=60000
ALERT_COOLDOWN=300000

# Sentry
SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_org
SENTRY_PROJECT=your_project

# Logging
LOG_LEVEL=info
ENABLE_QUERY_LOGS=false
ENABLE_SLOW_QUERY_LOGS=true
SLOW_QUERY_THRESHOLD=2000

# Métricas
ENABLE_WEB_VITALS=true
METRICS_RETENTION_DAYS=30
```

### 5.2 Configuração do Next.js

```javascript
// next.config.js
const { withSentryConfig } = require('@sentry/nextjs')

const nextConfig = {
  experimental: {
    instrumentationHook: true
  },
  // Outras configurações...
}

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT
})
```

## 6. Documentação de Uso

### 6.1 Como Monitorar o Sistema

1. **Dashboard Admin**: Acesse `/admin/monitoring`
2. **APIs de Status**: 
   - `GET /api/monitoring/health` - Status geral
   - `GET /api/monitoring/alerts` - Alertas ativos
   - `GET /api/monitoring/metrics` - Métricas de performance
3. **Logs**: Verifique console do navegador e logs do servidor

### 6.2 Interpretação de Métricas

- **LCP < 2.5s**: Bom
- **FID < 100ms**: Bom
- **CLS < 0.1**: Bom
- **Response Time < 1s**: Saudável
- **Response Time 1-2s**: Degradado
- **Response Time > 2s**: Não saudável

### 6.3 Resolução de Problemas

1. **Sistema Degradado**:
   - Verificar logs de erro
   - Analisar métricas de performance
   - Verificar conectividade com Supabase

2. **Muitos Alertas**:
   - Verificar padrões nos logs
   - Analisar health checks
   - Verificar recursos do servidor

3. **Performance Ruim**:
   - Analisar Web Vitals
   - Verificar queries lentas
   - Otimizar componentes React

## 7. Próximos Passos

### Implementações Prioritárias

1. ✅ **Sistema de Logs**: Já implementado
2. 🔄 **Web Vitals Monitoring**: Implementar
3. 🔄 **Health Checks**: Implementar
4. 🔄 **Sistema de Alertas**: Implementar
5. 🔄 **Dashboard de Monitoramento**: Implementar
6. ⏳ **Integração Sentry**: Configurar
7. ⏳ **Métricas Avançadas**: Implementar
8. ⏳ **Notificações**: Configurar

### Melhorias Futuras

- **APM (Application Performance Monitoring)**
- **Distributed Tracing**
- **Custom Metrics Dashboard**
- **Automated Incident Response**
- **Performance Budgets**
- **Real User Monitoring (RUM)**

---

**Status**: Sistema de logs implementado, monitoramento avançado em desenvolvimento
**Última atualização**: Dezembro 2024
**Responsável**: Equipe de Desenvolvimento