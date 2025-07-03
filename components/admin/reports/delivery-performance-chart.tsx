"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bike, Clock, Star, AlertCircle, RefreshCw } from "lucide-react"

interface DeliveryPerformanceChartProps {
  dateRange: string
}

interface DeliveryPersonData {
  name: string
  deliveries: number
  avgTime: number
  rating: number
}

export function DeliveryPerformanceChart({ dateRange }: DeliveryPerformanceChartProps) {
  const [deliveryData, setDeliveryData] = useState<DeliveryPersonData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDeliveryData()
  }, [dateRange])

  const fetchDeliveryData = async () => {
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

      // Buscar entregadores e pedidos
      const [driversRes, ordersRes] = await Promise.all([
        fetch('/api/drivers'),
        fetch('/api/orders?limit=1000')
      ])

      const [driversData, ordersData] = await Promise.all([
        driversRes.json(),
        ordersRes.json()
      ])

      const drivers = driversData.drivers || []
      const orders = ordersData.orders || []

      // Filtrar pedidos entregues do período
      const deliveredOrders = orders.filter((order: any) => {
        const orderDate = new Date(order.created_at)
        return orderDate >= startDate && orderDate <= endDate && order.status === 'DELIVERED'
      })

      // Calcular performance por entregador
      const driverPerformance = new Map<string, { 
        name: string, 
        deliveries: number, 
        totalTime: number, 
        rating: number 
      }>()

      // Inicializar entregadores com dados básicos
      drivers.forEach((driver: any) => {
        driverPerformance.set(driver.id, {
          name: driver.name,
          deliveries: 0,
          totalTime: 0,
          rating: driver.average_rating || 4.5
        })
      })

      // Contar entregas e calcular tempo médio
      deliveredOrders.forEach((order: any) => {
        if (order.driver_id && driverPerformance.has(order.driver_id)) {
          const driver = driverPerformance.get(order.driver_id)!
          const deliveryTime = new Date(order.updated_at).getTime() - new Date(order.created_at).getTime()
          const deliveryTimeMinutes = Math.round(deliveryTime / (1000 * 60))
          
          driverPerformance.set(order.driver_id, {
            ...driver,
            deliveries: driver.deliveries + 1,
            totalTime: driver.totalTime + deliveryTimeMinutes
          })
        }
      })

      // Converter para array e calcular tempo médio
      const chartData = Array.from(driverPerformance.values())
        .filter(driver => driver.deliveries > 0) // Apenas entregadores com entregas no período
        .map(driver => ({
          name: driver.name,
          deliveries: driver.deliveries,
          avgTime: driver.deliveries > 0 ? Math.round(driver.totalTime / driver.deliveries) : 0,
          rating: Number(driver.rating) || 4.5
        }))
        .sort((a, b) => b.deliveries - a.deliveries) // Ordenar por número de entregas
        .slice(0, 5) // Top 5

      setDeliveryData(chartData)

    } catch (error) {
      console.error("Erro ao carregar dados de performance:", error)
      setError("Erro ao carregar dados de performance")
    } finally {
      setLoading(false)
    }
  }

  const maxDeliveries = Math.max(...deliveryData.map((d) => d.deliveries))

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bike className="w-5 h-5" />
            Performance dos Entregadores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">Carregando dados de performance...</p>
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
            <Bike className="w-5 h-5" />
            Performance dos Entregadores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 py-6">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
            <button 
              onClick={fetchDeliveryData}
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
          <Bike className="w-5 h-5" />
          Performance dos Entregadores
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {deliveryData.length > 0 ? (
            <>
              {deliveryData.map((person, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{person.name}</span>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <Bike className="w-3 h-3" />
                        <span>{person.deliveries}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{person.avgTime}min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{person.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: maxDeliveries > 0 ? `${(person.deliveries / maxDeliveries) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t">
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <div className="text-gray-600">Total Entregas</div>
                    <div className="font-semibold">{deliveryData.reduce((sum, person) => sum + person.deliveries, 0)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Tempo Médio</div>
                    <div className="font-semibold">
                      {deliveryData.length > 0 
                        ? Math.round(deliveryData.reduce((sum, person) => sum + person.avgTime, 0) / deliveryData.length)
                        : 0}min
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Avaliação Média</div>
                    <div className="font-semibold">
                      {deliveryData.length > 0 
                        ? (deliveryData.reduce((sum, person) => sum + person.rating, 0) / deliveryData.length).toFixed(1)
                        : '0.0'}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Bike className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">Nenhuma entrega encontrada no período</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
