"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Package, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AssignOrderModalProps {
  deliveryPersonId: string
  isOpen: boolean
  onClose: () => void
  onAssign?: () => void
}

interface Order {
  id: string
  total: number
  delivery_address: string
  delivery_phone: string
  created_at: string
  profiles: {
    full_name: string
  }
  order_items: Array<{
    quantity: number
    products: {
      name: string
    }
  }>
}

export function AssignOrderModal({ deliveryPersonId, isOpen, onClose, onAssign }: AssignOrderModalProps) {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  const { toast } = useToast()

  // Buscar pedidos que estão em preparo (prontos para entrega)
  const {
    data: orders = [],
    isLoading,
    error,
    refetch
  } = useQuery<Order[]>({
    queryKey: ["preparing-orders"],
    queryFn: async () => {
      console.log("Buscando pedidos em preparo...")
      
      const response = await fetch('/api/orders?status=PREPARING')
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log("Pedidos em preparo encontrados:", data.orders?.length || 0)
      
      return data.orders || []
    },
    enabled: isOpen,
    refetchOnWindowFocus: false,
  })

  // Mutation para atribuir entregador ao pedido
  const assignDriverMutation = useMutation({
    mutationFn: async (orderId: string) => {
      console.log("Atribuindo entregador:", { orderId, deliveryPersonId })
      
      const response = await fetch(`/api/orders/${orderId}/assign-driver`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ driverId: deliveryPersonId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atribuir entregador')
      }

      return response.json()
    },
    onSuccess: (data) => {
      toast({
        title: "Sucesso",
        description: `Entregador atribuído ao pedido #${data.order.id.slice(-8)}`,
      })
      onAssign?.()
      onClose()
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atribuir entregador",
        variant: "destructive",
      })
    },
  })

  const handleAssignOrder = () => {
    if (!selectedOrder) return
    assignDriverMutation.mutate(selectedOrder)
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min atrás`
    } else {
      const hours = Math.floor(diffInMinutes / 60)
      return `${hours}h ${diffInMinutes % 60}min atrás`
    }
  }

  const getOrderItems = (orderItems: Order['order_items']) => {
    return orderItems
      .map(item => `${item.quantity}x ${item.products?.name || "Produto"}`)
      .join(", ")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Atribuir Pedido ao Entregador</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-600">Selecione um pedido em preparo para atribuir:</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>

          {isLoading && (
            <div className="text-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">Carregando pedidos...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Erro ao carregar pedidos: {error.message}</p>
              <Button variant="outline" onClick={() => refetch()}>
                Tentar Novamente
              </Button>
            </div>
          )}

          {!isLoading && !error && orders.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Nenhum pedido em preparo aguardando entregador.</p>
            </div>
          )}

          {!isLoading && !error && orders.length > 0 && (
            <div className="space-y-3">
              {orders.map((order) => (
                <Card
                  key={order.id}
                  className={`cursor-pointer transition-all ${
                    selectedOrder === order.id ? "ring-2 ring-primary bg-primary/5" : "hover:shadow-md"
                  }`}
                  onClick={() => setSelectedOrder(order.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">Pedido #{order.id.slice(-8)}</h3>
                        <p className="text-sm text-gray-600">{order.profiles?.full_name || "Cliente não identificado"}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className="bg-blue-100 text-blue-800">Em Preparo</Badge>
                        <Badge variant="outline">R$ {Number(order.total || 0).toFixed(2)}</Badge>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div>
                          <div>{order.delivery_address}</div>
                          {order.delivery_phone && (
                            <div className="text-gray-500">Tel: {order.delivery_phone}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>Pedido feito {formatDateTime(order.created_at)}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t">
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center gap-1 mb-1">
                          <Package className="w-4 h-4" />
                          <strong>Itens:</strong>
                        </div>
                        <div className="text-gray-700">{getOrderItems(order.order_items)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={assignDriverMutation.isPending}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAssignOrder} 
              disabled={!selectedOrder || assignDriverMutation.isPending}
            >
              {assignDriverMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Atribuindo...
                </>
              ) : (
                "Atribuir Pedido"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
