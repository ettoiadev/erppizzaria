"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { DollarSign, ShoppingBag, Users, Clock, TrendingUp, TrendingDown, Package, AlertCircle } from "lucide-react"

interface DashboardStats {
  dailySales: number
  totalOrders: number
  todayOrders: number
  activeCustomers: number
  avgDeliveryTime: number
  totalProducts: number
  totalCategories: number
  revenueGrowth: number
}

interface RecentOrder {
  id: string
  total: number
  status: string
  customer_name: string
  created_at: string
}

interface TopProduct {
  name: string
  sales_count: number
  revenue: number
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    dailySales: 0,
    totalOrders: 0,
    todayOrders: 0,
    activeCustomers: 0,
    avgDeliveryTime: 0,
    totalProducts: 0,
    totalCategories: 0,
    revenueGrowth: 0
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Buscar dados reais em paralelo (sem limite para garantir dados completos)
      const [ordersRes, productsRes, categoriesRes, customersRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/products'),
        fetch('/api/categories'),
        fetch('/api/customers')
      ])

      const [ordersData, productsData, categoriesData, customersData] = await Promise.all([
        ordersRes.json(),
        productsRes.json(),
        categoriesRes.json(),
        customersRes.json()
      ])

      // Processar dados dos pedidos com fuso horário brasileiro
      const orders = ordersData.orders || []
      
      // Criar datas no fuso horário brasileiro (UTC-3)
      const now = new Date()
      const brasiliaOffset = -3 * 60 // UTC-3 em minutos
      const todayBrasilia = new Date(now.getTime() + (brasiliaOffset + now.getTimezoneOffset()) * 60000)
      const yesterdayBrasilia = new Date(todayBrasilia.getTime() - 24 * 60 * 60 * 1000)
      
      const todayString = todayBrasilia.toISOString().split('T')[0]
      const yesterdayString = yesterdayBrasilia.toISOString().split('T')[0]
      
      // Log apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Dashboard - Calculando crescimento:', {
          hoje: todayString,
          ontem: yesterdayString,
          totalPedidos: orders.length
        })
      }
      
      const todayOrders = orders.filter((order: any) => {
        const orderDate = new Date(order.created_at).toISOString().split('T')[0]
        return orderDate === todayString
      })
      
      const yesterdayOrders = orders.filter((order: any) => {
        const orderDate = new Date(order.created_at).toISOString().split('T')[0]
        return orderDate === yesterdayString
      })

      const dailySales = todayOrders.reduce((sum: number, order: any) => {
        const total = parseFloat(order.total || '0')
        return sum + (isNaN(total) ? 0 : total)
      }, 0)

      const yesterdaySales = yesterdayOrders.reduce((sum: number, order: any) => {
        const total = parseFloat(order.total || '0')
        return sum + (isNaN(total) ? 0 : total)
      }, 0)

      // Log apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('💰 Dashboard - Vendas calculadas:', {
          vendasHoje: dailySales,
          vendasOntem: yesterdaySales,
          pedidosHoje: todayOrders.length,
          pedidosOntem: yesterdayOrders.length
        })
      }

      // Calcular crescimento da receita com lógica aprimorada
      let revenueGrowth = 0
      
      if (yesterdaySales > 0) {
        // Caso normal: há vendas ontem para comparar
        revenueGrowth = ((dailySales - yesterdaySales) / yesterdaySales) * 100
      } else if (dailySales > 0) {
        // Caso especial: não houve vendas ontem, mas há hoje (crescimento de 100%)
        revenueGrowth = 100
      } else {
        // Caso sem vendas hoje nem ontem
        revenueGrowth = 0
      }
      
      // Log apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('📈 Dashboard - Crescimento calculado:', {
          crescimento: revenueGrowth.toFixed(1) + '%'
        })
      }

      // Processar produtos mais vendidos
      const productSales: { [key: string]: { name: string, count: number, revenue: number } } = {}
      
      orders.forEach((order: any) => {
        order.order_items?.forEach((item: any) => {
          const productName = item.products?.name || 'Produto não identificado'
          if (productSales[productName]) {
            productSales[productName].count += item.quantity
            productSales[productName].revenue += parseFloat(item.total_price || 0)
          } else {
            productSales[productName] = {
              name: productName,
              count: item.quantity,
              revenue: parseFloat(item.total_price || 0)
            }
          }
        })
      })

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(p => ({
          name: p.name,
          sales_count: p.count,
          revenue: p.revenue
        }))

      // Pedidos recentes (últimos 5)
      const recentOrders = orders
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map((order: any) => ({
          id: order.id,
          total: parseFloat(order.total || 0),
          status: order.status,
          customer_name: order.profiles?.full_name || 'Cliente não identificado',
          created_at: order.created_at
        }))

      // Atualizar estados
      setStats({
        dailySales,
        totalOrders: orders.length,
        todayOrders: todayOrders.length,
        activeCustomers: customersData.customers?.length || 0,
        avgDeliveryTime: 35, // Valor padrão por enquanto
        totalProducts: Array.isArray(productsData) ? productsData.length : (productsData.products?.length || 0),
        totalCategories: categoriesData.categories?.length || 0,
        revenueGrowth
      })

      setRecentOrders(recentOrders)
      setTopProducts(topProducts)

    } catch (error) {
      setError("Erro ao carregar dados do dashboard")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECEIVED': return 'bg-blue-100 text-blue-800'
      case 'PREPARING': return 'bg-yellow-100 text-yellow-800'  
      case 'ON_THE_WAY': return 'bg-purple-100 text-purple-800'
      case 'DELIVERED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'RECEIVED': return 'Recebido'
      case 'PREPARING': return 'Preparando'
      case 'ON_THE_WAY': return 'Saiu para Entrega'  
      case 'DELIVERED': return 'Entregue'
      case 'CANCELLED': return 'Cancelado'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar dashboard</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral do seu negócio</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Vendas Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{formatCurrency(stats.dailySales)}</div>
            <p className="text-xs text-green-700">
              {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth.toFixed(1)}% em relação a ontem
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Pedidos Hoje</CardTitle>
            <ShoppingBag className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.todayOrders}</div>
            <p className="text-xs text-blue-700">
              {stats.totalOrders} pedidos no total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{stats.activeCustomers}</div>
            <p className="text-xs text-purple-700">
              Total de clientes cadastrados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{stats.avgDeliveryTime}min</div>
            <p className="text-xs text-orange-700">
              Tempo médio de entrega
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">#{order.id.slice(-8)}</p>
                      <p className="text-sm text-gray-600">{order.customer_name}</p>
                      <p className="text-xs text-gray-500">{formatDateTime(order.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(order.total)}</p>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhum pedido recente</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.sales_count} vendas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(product.revenue)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhuma venda registrada</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-teal-800">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-900">{stats.totalProducts}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-800">Categorias</CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-900">{stats.totalCategories}</div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${stats.revenueGrowth >= 0 ? 'from-emerald-50 to-emerald-100 border-emerald-200' : 'from-red-50 to-red-100 border-red-200'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${stats.revenueGrowth >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>Crescimento</CardTitle>
            {stats.revenueGrowth >= 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.revenueGrowth >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
              {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth.toFixed(1)}%
            </div>
            <p className={`text-xs ${stats.revenueGrowth >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {stats.revenueGrowth === 0 ? 'Sem variação' : 'Vendas vs. ontem'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
