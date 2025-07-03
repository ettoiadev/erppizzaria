"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingBag, AlertCircle, RefreshCw } from "lucide-react"

interface OrdersChartProps {
  dateRange: string
}

interface OrdersData {
  date: string
  orders: number
}

export function OrdersChart({ dateRange }: OrdersChartProps) {
  const [ordersData, setOrdersData] = useState<OrdersData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrdersData()
  }, [dateRange])

  const fetchOrdersData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Calcular período baseado no filtro
      const endDate = new Date()
      let startDate = new Date()
      let days = 7

      switch (dateRange) {
        case "7d":
          days = 7
          startDate.setDate(endDate.getDate() - 7)
          break
        case "30d":
          days = 30
          startDate.setDate(endDate.getDate() - 30)
          break
        case "90d":
          days = 90
          startDate.setDate(endDate.getDate() - 90)
          break
        default:
          days = 7
          startDate.setDate(endDate.getDate() - 7)
      }

      // Buscar pedidos
      const response = await fetch('/api/orders?limit=1000')
      const data = await response.json()
      const orders = data.orders || []

      // Filtrar pedidos do período
      const periodOrders = orders.filter((order: any) => {
        const orderDate = new Date(order.created_at)
        return orderDate >= startDate && orderDate <= endDate
      })

      // Agrupar pedidos por dia
      const ordersByDate = new Map<string, number>()
      
      // Inicializar todos os dias do período com 0
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate)
        date.setDate(startDate.getDate() + i)
        const dateStr = date.toLocaleDateString("pt-BR", { 
          day: "2-digit", 
          month: "2-digit" 
        })
        ordersByDate.set(dateStr, 0)
      }

      // Contar pedidos por dia
      periodOrders.forEach((order: any) => {
        const orderDate = new Date(order.created_at)
        const dateStr = orderDate.toLocaleDateString("pt-BR", { 
          day: "2-digit", 
          month: "2-digit" 
        })
        const currentOrders = ordersByDate.get(dateStr) || 0
        ordersByDate.set(dateStr, currentOrders + 1)
      })

      // Converter para array
      const chartData = Array.from(ordersByDate.entries()).map(([date, orders]) => ({
        date,
        orders
      }))

      setOrdersData(chartData)

    } catch (error) {
      console.error("Erro ao carregar dados de pedidos:", error)
      setError("Erro ao carregar dados de pedidos")
    } finally {
      setLoading(false)
    }
  }

  const maxOrders = Math.max(...ordersData.map((d) => d.orders))

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Pedidos por Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">Carregando dados de pedidos...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Pedidos por Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 py-6">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
            <button 
              onClick={fetchOrdersData}
              className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Tentar novamente
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          Pedidos por Dia
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ordersData.length > 0 ? (
            <>
              {/* Simple bar chart representation */}
              <div className="space-y-3">
                {ordersData.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-12 text-xs text-gray-600">{item.date}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                      <div
                        className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                        style={{ width: maxOrders > 0 ? `${(item.orders / maxOrders) * 100}%` : '0%' }}
                      >
                        {item.orders > 0 && (
                          <span className="text-xs text-white font-medium">
                            {item.orders} pedido{item.orders !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total do período:</span>
                  <span className="font-semibold">
                    {ordersData.reduce((sum, item) => sum + item.orders, 0)} pedidos
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">Nenhum pedido encontrado no período</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
