"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { SalesChart } from "./sales-chart"
import { OrdersChart } from "./orders-chart"
import { TopProductsChart } from "./top-products-chart"
import { DeliveryPerformanceChart } from "./delivery-performance-chart"
import { ReportFilters } from "./report-filters"
import { ExportReports } from "./export-reports"
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Clock, Star, Package, Bike, AlertCircle, RefreshCw } from "lucide-react"

interface ReportsStats {
  totalSales: number
  salesGrowth: number
  totalOrders: number
  ordersGrowth: number
  totalCustomers: number
  customersGrowth: number
  avgDeliveryTime: number
  deliveryTimeChange: number
  avgOrderValue: number
  orderValueGrowth: number
  customerSatisfaction: number
  satisfactionChange: number
  totalDeliveries: number
  deliveriesGrowth: number
  activeDeliveryPersons: number
  deliveryPersonsChange: number
}

export function ReportsManagement() {
  const [dateRange, setDateRange] = useState("7d")
  const [reportType, setReportType] = useState("overview")
  const [stats, setStats] = useState<ReportsStats>({
    totalSales: 0,
    salesGrowth: 0,
    totalOrders: 0,
    ordersGrowth: 0,
    totalCustomers: 0,
    customersGrowth: 0,
    avgDeliveryTime: 0,
    deliveryTimeChange: 0,
    avgOrderValue: 0,
    orderValueGrowth: 0,
    customerSatisfaction: 0,
    satisfactionChange: 0,
    totalDeliveries: 0,
    deliveriesGrowth: 0,
    activeDeliveryPersons: 0,
    deliveryPersonsChange: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReportsData()
  }, [dateRange])

  const fetchReportsData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Calcular datas baseado no filtro
      const endDate = new Date()
      let startDate = new Date()
      let previousStartDate = new Date()
      let previousEndDate = new Date()

      switch (dateRange) {
        case "7d":
          startDate.setDate(endDate.getDate() - 7)
          previousEndDate = new Date(startDate)
          previousStartDate.setDate(previousEndDate.getDate() - 7)
          break
        case "30d":
          startDate.setDate(endDate.getDate() - 30)
          previousEndDate = new Date(startDate)
          previousStartDate.setDate(previousEndDate.getDate() - 30)
          break
        case "90d":
          startDate.setDate(endDate.getDate() - 90)
          previousEndDate = new Date(startDate)
          previousStartDate.setDate(previousEndDate.getDate() - 90)
          break
        default:
          startDate.setDate(endDate.getDate() - 7)
          previousEndDate = new Date(startDate)
          previousStartDate.setDate(previousEndDate.getDate() - 7)
      }

      // Buscar dados das APIs (sem limite para garantir dados completos)
      const [ordersRes, driversRes, customersRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/drivers'),
        fetch('/api/customers')
      ])

      if (!ordersRes.ok || !driversRes.ok || !customersRes.ok) {
        throw new Error('Falha ao buscar dados das APIs')
      }

      const [ordersData, driversData, customersData] = await Promise.all([
        ordersRes.json(),
        driversRes.json(),
        customersRes.json()
      ])

      const orders = Array.isArray(ordersData) ? ordersData : (ordersData.orders || [])
      const drivers = Array.isArray(driversData) ? driversData : (driversData.drivers || [])
      const customers = Array.isArray(customersData) ? customersData : (customersData.customers || [])

      // Log para debug (apenas em desenvolvimento)
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Relatórios - Dados carregados:', {
          totalPedidos: orders.length,
          totalEntregadores: drivers.length,
          totalClientes: customers.length,
          periodo: dateRange
        })
      }

      // Filtrar pedidos por período atual
      const currentOrders = orders.filter((order: any) => {
        const orderDate = new Date(order.created_at)
        return orderDate >= startDate && orderDate <= endDate
      })

      // Filtrar pedidos por período anterior (para comparação)
      const previousOrders = orders.filter((order: any) => {
        const orderDate = new Date(order.created_at)
        return orderDate >= previousStartDate && orderDate < previousEndDate
      })

      // Calcular métricas do período atual com validação
      const totalSales = currentOrders.reduce((sum: number, order: any) => {
        const orderTotal = parseFloat(order.total || '0')
        return sum + (isNaN(orderTotal) ? 0 : orderTotal)
      }, 0)
      
      const totalOrders = currentOrders.length
      const deliveredOrders = currentOrders.filter((order: any) => order.status === 'DELIVERED')
      const totalDeliveries = deliveredOrders.length

      // Calcular métricas do período anterior com validação
      const previousSales = previousOrders.reduce((sum: number, order: any) => {
        const orderTotal = parseFloat(order.total || '0')
        return sum + (isNaN(orderTotal) ? 0 : orderTotal)
      }, 0)
      
      const previousOrdersCount = previousOrders.length
      const previousDeliveries = previousOrders.filter((order: any) => order.status === 'DELIVERED').length

      // Calcular crescimentos com lógica aprimorada
      let salesGrowth = 0
      if (previousSales > 0) {
        salesGrowth = ((totalSales - previousSales) / previousSales) * 100
      } else if (totalSales > 0) {
        salesGrowth = 100 // Primeira venda
      }

      let ordersGrowth = 0
      if (previousOrdersCount > 0) {
        ordersGrowth = ((totalOrders - previousOrdersCount) / previousOrdersCount) * 100
      } else if (totalOrders > 0) {
        ordersGrowth = 100 // Primeiros pedidos
      }

      let deliveriesGrowth = 0
      if (previousDeliveries > 0) {
        deliveriesGrowth = ((totalDeliveries - previousDeliveries) / previousDeliveries) * 100
      } else if (totalDeliveries > 0) {
        deliveriesGrowth = 100 // Primeiras entregas
      }

      // Log para debug (apenas em desenvolvimento)
      if (process.env.NODE_ENV === 'development') {
        console.log('💰 Relatórios - Métricas calculadas:', {
          vendasAtual: totalSales,
          vendasAnterior: previousSales,
          crescimentoVendas: salesGrowth.toFixed(1) + '%',
          pedidosAtual: totalOrders,
          pedidosAnterior: previousOrdersCount,
          crescimentoPedidos: ordersGrowth.toFixed(1) + '%'
        })
      }

      // Calcular tempo médio de entrega com validação aprimorada
      let avgDeliveryTime = 35 // Valor padrão baseado no sistema
      if (deliveredOrders.length > 0) {
        const validDeliveryTimes: number[] = []
        
        deliveredOrders.forEach((order: any) => {
          const created = new Date(order.created_at)
          const delivered = new Date(order.updated_at)
          
          if (created && delivered && !isNaN(created.getTime()) && !isNaN(delivered.getTime())) {
            const deliveryTimeMinutes = (delivered.getTime() - created.getTime()) / (1000 * 60)
            // Filtrar tempos razoáveis (entre 10 minutos e 4 horas)
            if (deliveryTimeMinutes >= 10 && deliveryTimeMinutes <= 240) {
              validDeliveryTimes.push(deliveryTimeMinutes)
            }
          }
        })
        
        if (validDeliveryTimes.length > 0) {
          avgDeliveryTime = Math.round(validDeliveryTimes.reduce((sum, time) => sum + time, 0) / validDeliveryTimes.length)
        }
      }

      // Tempo médio anterior com mesma validação
      const previousDelivered = previousOrders.filter((order: any) => order.status === 'DELIVERED')
      let previousAvgDeliveryTime = 35 // Valor padrão
      if (previousDelivered.length > 0) {
        const validPreviousTimes: number[] = []
        
        previousDelivered.forEach((order: any) => {
          const created = new Date(order.created_at)
          const delivered = new Date(order.updated_at)
          
          if (created && delivered && !isNaN(created.getTime()) && !isNaN(delivered.getTime())) {
            const deliveryTimeMinutes = (delivered.getTime() - created.getTime()) / (1000 * 60)
            if (deliveryTimeMinutes >= 10 && deliveryTimeMinutes <= 240) {
              validPreviousTimes.push(deliveryTimeMinutes)
            }
          }
        })
        
        if (validPreviousTimes.length > 0) {
          previousAvgDeliveryTime = Math.round(validPreviousTimes.reduce((sum, time) => sum + time, 0) / validPreviousTimes.length)
        }
      }

      const deliveryTimeChange = previousAvgDeliveryTime > 0 
        ? ((avgDeliveryTime - previousAvgDeliveryTime) / previousAvgDeliveryTime) * 100 
        : 0

      // Ticket médio com validação
      const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0
      const previousAvgOrderValue = previousOrdersCount > 0 ? previousSales / previousOrdersCount : 0
      
      let orderValueGrowth = 0
      if (previousAvgOrderValue > 0) {
        orderValueGrowth = ((avgOrderValue - previousAvgOrderValue) / previousAvgOrderValue) * 100
      } else if (avgOrderValue > 0) {
        orderValueGrowth = 100 // Primeiro ticket médio
      }

      // Clientes únicos no período com validação
      const uniqueCustomers = new Set(
        currentOrders
          .map((order: any) => order.user_id || order.customer_id || order.profiles?.id)
          .filter((id: any) => id && id !== 'undefined' && id !== 'null')
      ).size
      
      const previousUniqueCustomers = new Set(
        previousOrders
          .map((order: any) => order.user_id || order.customer_id || order.profiles?.id)
          .filter((id: any) => id && id !== 'undefined' && id !== 'null')
      ).size
      
      let customersGrowth = 0
      if (previousUniqueCustomers > 0) {
        customersGrowth = ((uniqueCustomers - previousUniqueCustomers) / previousUniqueCustomers) * 100
      } else if (uniqueCustomers > 0) {
        customersGrowth = 100 // Primeiros clientes únicos
      }

      // Entregadores ativos com validação aprimorada
      const activeDeliveryPersons = drivers.filter((driver: any) => 
        driver && driver.status && (driver.status === 'available' || driver.status === 'busy')
      ).length
      
      const totalDrivers = drivers.length

      const newStats: ReportsStats = {
        totalSales: Math.round(totalSales * 100) / 100,
        salesGrowth: Math.round(salesGrowth * 100) / 100,
        totalOrders,
        ordersGrowth: Math.round(ordersGrowth * 100) / 100,
        totalCustomers: uniqueCustomers,
        customersGrowth: Math.round(customersGrowth * 100) / 100,
        avgDeliveryTime,
        deliveryTimeChange: Math.round(deliveryTimeChange * 100) / 100,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        orderValueGrowth: Math.round(orderValueGrowth * 100) / 100,
        customerSatisfaction: 4.5, // Placeholder - seria necessário um sistema de avaliações
        satisfactionChange: 0,
        totalDeliveries,
        deliveriesGrowth: Math.round(deliveriesGrowth * 100) / 100,
        activeDeliveryPersons,
        deliveryPersonsChange: 0, // Seria necessário histórico de entregadores
      }

      // Log final para debug (apenas em desenvolvimento)
      if (process.env.NODE_ENV === 'development') {
        console.log('📈 Relatórios - Estatísticas finais:', {
          periodo: dateRange,
          vendas: newStats.totalSales,
          crescimentoVendas: newStats.salesGrowth + '%',
          pedidos: newStats.totalOrders,
          crescimentoPedidos: newStats.ordersGrowth + '%',
          ticketMedio: newStats.avgOrderValue,
          tempoEntrega: newStats.avgDeliveryTime + 'min',
          clientesUnicos: newStats.totalCustomers,
          entregadores: newStats.activeDeliveryPersons + '/' + totalDrivers
        })
      }

      setStats(newStats)

    } catch (error) {
      console.error("Erro ao carregar dados dos relatórios:", error)
      
      let errorMessage = "Erro ao carregar dados dos relatórios"
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = "Erro de conexão com o servidor. Verifique sua internet."
        } else if (error.message.includes('APIs')) {
          errorMessage = "Falha ao buscar dados das APIs. Tente novamente."
        } else {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? "text-green-600" : "text-red-600"
  }

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? TrendingUp : TrendingDown
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Relatórios e Análises</h1>
            <p className="text-gray-600">Acompanhe o desempenho do seu negócio</p>
          </div>
        </div>
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Carregando dados dos relatórios...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Relatórios e Análises</h1>
            <p className="text-gray-600">Acompanhe o desempenho do seu negócio</p>
          </div>
        </div>
        
        <Card className="border-red-200">
          <CardContent className="flex items-center gap-2 pt-6">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
            <button 
              onClick={fetchReportsData}
              className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Tentar novamente
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios e Análises</h1>
          <p className="text-gray-600">Acompanhe o desempenho do seu negócio</p>
        </div>

        <ExportReports dateRange={dateRange} reportType={reportType} />
      </div>

      {/* Filters */}
      <ReportFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        reportType={reportType}
        onReportTypeChange={setReportType}
      />

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vendas Totais</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.totalSales)}
                </p>
                <div className="flex items-center mt-1">
                  {React.createElement(getGrowthIcon(stats.salesGrowth), {
                    className: `w-4 h-4 ${getGrowthColor(stats.salesGrowth)}`,
                  })}
                  <span className={`text-sm ml-1 ${getGrowthColor(stats.salesGrowth)}`}>
                    {stats.salesGrowth > 0 ? "+" : ""}
                    {stats.salesGrowth.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
                <div className="flex items-center mt-1">
                  {React.createElement(getGrowthIcon(stats.ordersGrowth), {
                    className: `w-4 h-4 ${getGrowthColor(stats.ordersGrowth)}`,
                  })}
                  <span className={`text-sm ml-1 ${getGrowthColor(stats.ordersGrowth)}`}>
                    {stats.ordersGrowth > 0 ? "+" : ""}
                    {stats.ordersGrowth.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clientes Únicos</p>
                <p className="text-2xl font-bold">{stats.totalCustomers}</p>
                <div className="flex items-center mt-1">
                  {React.createElement(getGrowthIcon(stats.customersGrowth), {
                    className: `w-4 h-4 ${getGrowthColor(stats.customersGrowth)}`,
                  })}
                  <span className={`text-sm ml-1 ${getGrowthColor(stats.customersGrowth)}`}>
                    {stats.customersGrowth > 0 ? "+" : ""}
                    {stats.customersGrowth.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tempo Médio de Entrega</p>
                <p className="text-2xl font-bold">{stats.avgDeliveryTime}min</p>
                <div className="flex items-center mt-1">
                  {React.createElement(getGrowthIcon(-stats.deliveryTimeChange), {
                    className: `w-4 h-4 ${getGrowthColor(-stats.deliveryTimeChange)}`,
                  })}
                  <span className={`text-sm ml-1 ${getGrowthColor(-stats.deliveryTimeChange)}`}>
                    {stats.deliveryTimeChange > 0 ? "+" : ""}
                    {stats.deliveryTimeChange.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.avgOrderValue)}</p>
                <div className="flex items-center mt-1">
                  {React.createElement(getGrowthIcon(stats.orderValueGrowth), {
                    className: `w-4 h-4 ${getGrowthColor(stats.orderValueGrowth)}`,
                  })}
                  <span className={`text-sm ml-1 ${getGrowthColor(stats.orderValueGrowth)}`}>
                    {stats.orderValueGrowth > 0 ? "+" : ""}
                    {stats.orderValueGrowth.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Satisfação do Cliente</p>
                <p className="text-2xl font-bold">{stats.customerSatisfaction.toFixed(1)}</p>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-gray-600">
                    Sistema de avaliações pendente
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Entregas Realizadas</p>
                <p className="text-2xl font-bold">{stats.totalDeliveries}</p>
                <div className="flex items-center mt-1">
                  {React.createElement(getGrowthIcon(stats.deliveriesGrowth), {
                    className: `w-4 h-4 ${getGrowthColor(stats.deliveriesGrowth)}`,
                  })}
                  <span className={`text-sm ml-1 ${getGrowthColor(stats.deliveriesGrowth)}`}>
                    {stats.deliveriesGrowth > 0 ? "+" : ""}
                    {stats.deliveriesGrowth.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                <Bike className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Entregadores Ativos</p>
                <p className="text-2xl font-bold">{stats.activeDeliveryPersons}</p>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-gray-600">
                    {stats.activeDeliveryPersons > 0 ? 'Online agora' : 'Nenhum online'}
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-pink-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart dateRange={dateRange} />
        <OrdersChart dateRange={dateRange} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopProductsChart dateRange={dateRange} />
        <DeliveryPerformanceChart dateRange={dateRange} />
      </div>
    </div>
  )
}
