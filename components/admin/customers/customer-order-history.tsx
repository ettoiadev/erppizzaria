"use client"

import { useQuery } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Calendar, DollarSign, Package, RefreshCw } from "lucide-react"

interface CustomerOrderHistoryProps {
  customerId: string
  isOpen: boolean
  onClose: () => void
}

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface Order {
  id: string
  created_at: string
  status: string
  total: number
  payment_method?: string
  order_items: Array<{
    quantity: number
    price: string
    products: {
      name: string
    }
  }>
}

export function CustomerOrderHistory({ customerId, isOpen, onClose }: CustomerOrderHistoryProps) {
  // Mapeamento de métodos de pagamento do backend para português
  const mapPaymentMethodToPortuguese = (backendValue: string): string => {
    const paymentMapping: Record<string, string> = {
      "PIX": "PIX",
      "CASH": "Dinheiro",
      "CREDIT_CARD": "Cartão de Crédito", 
      "DEBIT_CARD": "Cartão de Débito",
      "CARD_ON_DELIVERY": "Cartão na Entrega"
    }
    return paymentMapping[backendValue] || backendValue
  }

  // Buscar pedidos reais do banco de dados PostgreSQL
  const { data: orders = [], isLoading, error, refetch } = useQuery({
    queryKey: ["customer-orders", customerId],
    queryFn: async () => {
      console.log("Buscando pedidos do cliente:", customerId)
      
      const response = await fetch(`/api/orders?userId=${customerId}`)
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log("Pedidos do cliente carregados:", data.orders?.length || 0)
      
      return data.orders || []
    },
    enabled: isOpen && !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-green-100 text-green-800"
      case "ON_THE_WAY":
        return "bg-blue-100 text-blue-800"
      case "PREPARING":
        return "bg-yellow-100 text-yellow-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "Entregue"
      case "ON_THE_WAY":
        return "Saiu para Entrega"
      case "PREPARING":
        return "Preparando"
      case "CANCELLED":
        return "Cancelado"
      default:
        return status
    }
  }

  const formatOrderItems = (orderItems: Order['order_items']): OrderItem[] => {
    return orderItems.map(item => ({
      name: item.products?.name || 'Produto',
      quantity: item.quantity,
      price: parseFloat(item.price || '0')
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Histórico de Pedidos
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Carregando pedidos...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Erro ao carregar pedidos: {error.message}</p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum pedido encontrado para este cliente.</p>
              </div>
            ) : (
              orders.map((order: Order) => {
                const orderItems = formatOrderItems(order.order_items || [])
                
                return (
                  <Card key={order.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">Pedido #{order.id.slice(-8)}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(order.created_at).toLocaleString("pt-BR")}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
                          <div className="text-lg font-bold text-primary mt-1">R$ {Number(order.total || 0).toFixed(2)}</div>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      {orderItems.length > 0 ? (
                        <div className="space-y-2">
                          <h4 className="font-medium">Itens do Pedido:</h4>
                          {orderItems.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>
                                {item.quantity}x {item.name}
                              </span>
                              <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          Itens do pedido não disponíveis
                        </div>
                      )}

                      <Separator className="my-4" />

                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">
                            Pagamento: {order.payment_method ? mapPaymentMethodToPortuguese(order.payment_method) : 'Não informado'}
                          </span>
                        </div>
                        <div className="font-medium">Total: R$ {Number(order.total || 0).toFixed(2)}</div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
