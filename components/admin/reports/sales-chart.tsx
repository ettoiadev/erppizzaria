"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, AlertCircle, RefreshCw } from "lucide-react"

interface SalesChartProps {
  dateRange: string
}

interface SalesData {
  date: string
  sales: number
}

export function SalesChart({ dateRange }: SalesChartProps) {
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSalesData()
  }, [dateRange])

  const fetchSalesData = async () => {
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

      // Agrupar vendas por dia
      const salesByDate = new Map<string, number>()
      
      // Inicializar todos os dias do período com 0
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate)
        date.setDate(startDate.getDate() + i)
        const dateStr = date.toLocaleDateString("pt-BR", { 
          day: "2-digit", 
          month: "2-digit" 
        })
        salesByDate.set(dateStr, 0)
      }

      // Somar vendas por dia
      periodOrders.forEach((order: any) => {
        const orderDate = new Date(order.created_at)
        const dateStr = orderDate.toLocaleDateString("pt-BR", { 
          day: "2-digit", 
          month: "2-digit" 
        })
        const currentSales = salesByDate.get(dateStr) || 0
        salesByDate.set(dateStr, currentSales + parseFloat(order.total || 0))
      })

      // Converter para array
      const chartData = Array.from(salesByDate.entries()).map(([date, sales]) => ({
        date,
        sales: Math.round(sales * 100) / 100
      }))

      setSalesData(chartData)

    } catch (error) {
      console.error("Erro ao carregar dados de vendas:", error)
      setError("Erro ao carregar dados de vendas")
    } finally {
      setLoading(false)
    }
  }

  const maxSales = Math.max(...salesData.map((d) => d.sales))

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Vendas por Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">Carregando dados de vendas...</p>
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
            <TrendingUp className="w-5 h-5" />
            Vendas por Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 py-6">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
            <button 
              onClick={fetchSalesData}
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
          <TrendingUp className="w-5 h-5" />
          Vendas por Dia
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {salesData.length > 0 ? (
            <>
              {/* Simple bar chart representation */}
              <div className="space-y-3">
                {salesData.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-12 text-xs text-gray-600">{item.date}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                      <div
                        className="bg-primary h-6 rounded-full flex items-center justify-end pr-2"
                        style={{ width: maxSales > 0 ? `${(item.sales / maxSales) * 100}%` : '0%' }}
                      >
                        {item.sales > 0 && (
                          <span className="text-xs text-white font-medium">
                            R$ {item.sales.toLocaleString("pt-BR")}
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
                    R$ {salesData.reduce((sum, item) => sum + item.sales, 0).toLocaleString("pt-BR")}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">Nenhuma venda encontrada no período</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
