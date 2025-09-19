/**
 * Dashboard de Métricas do Sistema - FASE 2
 * Componente React para visualização de métricas em tempo real
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  Database, 
  Server, 
  Users, 
  ShoppingCart, 
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  MemoryStick,
  Cpu,
  HardDrive
} from 'lucide-react'
import { toast } from 'sonner'

// Tipos para métricas
interface SystemMetrics {
  timestamp: string
  uptime: number
  health: {
    overall_status: string
    checks: Array<{
      name: string
      status: string
      message: string
      duration: number
    }>
    last_check: string
  }
  performance: {
    active_requests: number
    avg_response_time: number
    error_rate: number
    memory_usage_mb: number
    top_slow_endpoints: Array<{
      endpoint: string
      avg_duration: number
      count: number
    }>
  }
  database: {
    total_connections: number
    active_connections: number
    max_connections?: number
    total_tables: number
    total_records: {
      categories: number
      products: number
      orders: number
      customers: number
    }
  }
  business: {
    today_orders: number
    today_revenue: number
    active_customers: number
    popular_products: Array<{
      name: string
      quantity: number
      orders: number
    }>
  }
  system: {
    node_version: string
    platform: string
    memory: {
      rss: number
      heapTotal: number
      heapUsed: number
      external: number
    }
    cpu_usage: number
  }
}

const MetricsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30) // segundos

  // Buscar métricas da API
  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/metrics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setMetrics(data.metrics)
        setLastUpdate(new Date())
      } else {
        throw new Error(data.error || 'Erro ao buscar métricas')
      }
    } catch (error) {
      console.error('Erro ao buscar métricas:', error)
      toast.error('Erro ao carregar métricas do sistema')
    } finally {
      setLoading(false)
    }
  }

  // Executar ação específica
  const executeAction = async (action: string) => {
    try {
      const response = await fetch('/api/admin/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(`Ação '${action}' executada com sucesso`)
        if (action === 'health_check') {
          fetchMetrics() // Atualizar métricas após health check
        }
      } else {
        throw new Error(data.error || 'Erro ao executar ação')
      }
    } catch (error) {
      console.error(`Erro ao executar ação ${action}:`, error)
      toast.error(`Erro ao executar ação: ${action}`)
    }
  }

  // Formatação de tempo
  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  // Formatação de bytes
  const formatBytes = (bytes: number) => {
    const mb = bytes / 1024 / 1024
    return `${mb.toFixed(1)} MB`
  }

  // Formatação de moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Status badge component
  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const variants = {
      healthy: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      warning: { variant: 'secondary' as const, icon: AlertTriangle, color: 'text-yellow-600' },
      critical: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
      unknown: { variant: 'outline' as const, icon: AlertTriangle, color: 'text-gray-600' }
    }

    const config = variants[status as keyof typeof variants] || variants.unknown
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {status.toUpperCase()}
      </Badge>
    )
  }

  // Effect para auto-refresh
  useEffect(() => {
    fetchMetrics()

    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando métricas...</span>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Erro ao carregar métricas</h3>
        <Button onClick={fetchMetrics}>Tentar novamente</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Métricas</h2>
          <p className="text-muted-foreground">
            Última atualização: {lastUpdate?.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => executeAction('health_check')}
          >
            <Activity className="h-4 w-4 mr-2" />
            Health Check
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Geral</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <StatusBadge status={metrics.health.overall_status} />
            <p className="text-xs text-muted-foreground mt-2">
              Uptime: {formatUptime(metrics.uptime)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Hoje</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.business.today_orders}</div>
            <p className="text-xs text-muted-foreground">
              Receita: {formatCurrency(metrics.business.today_revenue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.business.active_customers}</div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uso de Memória</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.performance.memory_usage_mb} MB</div>
            <p className="text-xs text-muted-foreground">
              Heap: {formatBytes(metrics.system.memory.heapUsed)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com detalhes */}
      <Tabs defaultValue="health" className="space-y-4">
        <TabsList>
          <TabsTrigger value="health">Saúde do Sistema</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="database">Banco de Dados</TabsTrigger>
          <TabsTrigger value="business">Negócio</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4">
          <div className="grid gap-4">
            {metrics.health.checks.map((check, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">{check.name}</CardTitle>
                    <StatusBadge status={check.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{check.message}</p>
                  <p className="text-xs text-muted-foreground">
                    Duração: {check.duration.toFixed(1)}ms
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Requisições Ativas:</span>
                  <span className="font-semibold">{metrics.performance.active_requests}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tempo Médio de Resposta:</span>
                  <span className="font-semibold">{metrics.performance.avg_response_time.toFixed(1)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa de Erro:</span>
                  <span className="font-semibold">{metrics.performance.error_rate.toFixed(1)}%</span>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Taxa de Erro:</span>
                    <span>{metrics.performance.error_rate.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.performance.error_rate} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Endpoints Mais Lentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.performance.top_slow_endpoints.slice(0, 5).map((endpoint, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="truncate">{endpoint.endpoint}</span>
                      <span className="font-mono">{endpoint.avg_duration.toFixed(1)}ms</span>
                    </div>
                  ))}
                  {metrics.performance.top_slow_endpoints.length === 0 && (
                    <p className="text-muted-foreground text-sm">Nenhum endpoint lento detectado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Conexões</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Conexões Ativas:</span>
                  <span className="font-semibold">{metrics.database.active_connections}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total de Conexões:</span>
                  <span className="font-semibold">{metrics.database.total_connections}</span>
                </div>
                {metrics.database.max_connections && (
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Uso de Conexões:</span>
                      <span>{((metrics.database.active_connections / metrics.database.max_connections) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={(metrics.database.active_connections / metrics.database.max_connections) * 100} 
                      className="h-2" 
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Registros por Tabela</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Categorias:</span>
                    <span className="font-semibold">{metrics.database.total_records.categories}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Produtos:</span>
                    <span className="font-semibold">{metrics.database.total_records.products}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pedidos:</span>
                    <span className="font-semibold">{metrics.database.total_records.orders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Clientes:</span>
                    <span className="font-semibold">{metrics.database.total_records.customers}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="business" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Dia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Pedidos:</span>
                  <span className="font-semibold">{metrics.business.today_orders}</span>
                </div>
                <div className="flex justify-between">
                  <span>Receita:</span>
                  <span className="font-semibold">{formatCurrency(metrics.business.today_revenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ticket Médio:</span>
                  <span className="font-semibold">
                    {metrics.business.today_orders > 0 
                      ? formatCurrency(metrics.business.today_revenue / metrics.business.today_orders)
                      : 'R$ 0,00'
                    }
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Produtos Populares (7 dias)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.business.popular_products.slice(0, 5).map((product, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="truncate">{product.name}</span>
                      <span className="font-mono">{product.quantity}x</span>
                    </div>
                  ))}
                  {metrics.business.popular_products.length === 0 && (
                    <p className="text-muted-foreground text-sm">Nenhum produto vendido nos últimos 7 dias</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default MetricsDashboard