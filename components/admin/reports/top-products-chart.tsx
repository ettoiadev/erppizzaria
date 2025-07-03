"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, AlertCircle, RefreshCw } from "lucide-react"

interface TopProductsChartProps {
  dateRange: string
}

interface TopProduct {
  name: string
  sales: number
  revenue: number
}

export function TopProductsChart({ dateRange }: TopProductsChartProps) {
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTopProductsData()
  }, [dateRange])

  const fetchTopProductsData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Calcular período baseado no filtro
      const endDate = new Date()
      let startDate = new Date()

      switch (dateRange) {
        case "7d":
          startDate.setDate(endDate.getDate() - 7)
          break
        case "30d":
          startDate.setDate(endDate.getDate() - 30)
          break
        case "90d":
          startDate.setDate(endDate.getDate() - 90)
          break
        default:
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

      // Agrupar produtos por vendas
      const productSales = new Map<string, { name: string, count: number, revenue: number }>()
      
      periodOrders.forEach((order: any) => {
        if (order.order_items && Array.isArray(order.order_items)) {
          order.order_items.forEach((item: any) => {
            const productName = item.products?.name || item.product_name || 'Produto não identificado'
            const quantity = parseInt(item.quantity) || 1
            const revenue = parseFloat(item.total_price) || 0
            
            if (productSales.has(productName)) {
              const existing = productSales.get(productName)!
              productSales.set(productName, {
                name: productName,
                count: existing.count + quantity,
                revenue: existing.revenue + revenue
              })
            } else {
              productSales.set(productName, {
                name: productName,
                count: quantity,
                revenue: revenue
              })
            }
          })
        }
      })

      // Converter para array, ordenar por quantidade vendida e pegar top 5
      const chartData = Array.from(productSales.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(product => ({
          name: product.name,
          sales: product.count,
          revenue: Math.round(product.revenue * 100) / 100
        }))

      setTopProducts(chartData)

    } catch (error) {
      console.error("Erro ao carregar dados de produtos:", error)
      setError("Erro ao carregar dados de produtos")
    } finally {
      setLoading(false)
    }
  }

  const maxSales = Math.max(...topProducts.map((p) => p.sales))

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Produtos Mais Vendidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">Carregando dados de produtos...</p>
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
            <Package className="w-5 h-5" />
            Produtos Mais Vendidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 py-6">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
            <button 
              onClick={fetchTopProductsData}
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
          <Package className="w-5 h-5" />
          Produtos Mais Vendidos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topProducts.length > 0 ? (
            <>
              {topProducts.map((product, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{product.name}</span>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{product.sales} vendas</div>
                      <div className="text-xs text-gray-600">R$ {product.revenue.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: maxSales > 0 ? `${(product.sales / maxSales) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Receita total dos top 5:</span>
                  <span className="font-semibold">
                    R$ {topProducts.reduce((sum, product) => sum + product.revenue, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">Nenhum produto vendido no período</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
