"use client"

import { useState, useCallback } from "react"
import "./orders-kanban.css"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Clock, Phone, MapPin, CreditCard, Package, Bike, CheckCircle, XCircle, Eye, RefreshCw, Printer, Store, Truck, Archive } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Tipos e interfaces
interface OrderItem {
  id: string
  name?: string
  quantity: number
  unit_price: number
  total_price: number
  size?: string
  toppings?: string[]
  products: {
    name: string
    description: string
    image: string
  }
  half_and_half?: {
    firstHalf?: {
      productName: string
      toppings: string[]
    }
    secondHalf?: {
      productName: string
      toppings: string[]
    }
  }
  special_instructions?: string
}

interface Order {
  id: string
  status: keyof typeof statusLabels
  total: number
  subtotal: number
  delivery_fee: number
  discount: number
  payment_method: string
  delivery_address: string
  delivery_phone: string
  delivery_instructions?: string
  estimated_delivery_time?: string
  created_at: string
  updated_at: string
  profiles: {
    full_name: string
    phone?: string
  }
  customer_display_name?: string
  customer_display_phone?: string
  customer_name?: string
  order_items: OrderItem[]
}

interface OrdersKanbanProps {
  orders: Order[]
  onStatusUpdate: (orderId: string, newStatus: string, notes?: string) => Promise<void>
  onShowSelectDriverModal: (orderId: string) => void
  onPrintKitchenReceipt: (order: Order) => void
  onShowOrderDetails: (order: Order) => void
  updatingStatus: string | null
  thermalPrintEnabled: boolean
  formatCurrency: (value: number) => string
  formatDateTime: (dateString: string) => string
  mapPaymentMethodToPortuguese: (backendValue: string) => string
  selectedOrder: Order | null
  setSelectedOrder: (order: Order | null) => void
  cancellationNotes: string
  setCancellationNotes: (notes: string) => void
  onArchiveOrders: (status: string) => Promise<void>
}

// Configurações de status
const statusLabels = {
  RECEIVED: "Recebidos",
  PREPARING: "Preparando", 
  ON_THE_WAY: "Saiu para Entrega",
  DELIVERED: "Entregues",
  CANCELLED: "Cancelados",
}

const statusColors = {
  RECEIVED: "bg-blue-500 text-white border-blue-600",
  PREPARING: "bg-yellow-500 text-black border-yellow-600",
  ON_THE_WAY: "bg-orange-500 text-white border-orange-600", 
  DELIVERED: "bg-green-500 text-white border-green-600",
  CANCELLED: "bg-red-500 text-white border-red-600",
}

const statusIcons = {
  RECEIVED: Package,
  PREPARING: Clock,
  ON_THE_WAY: Bike,
  DELIVERED: CheckCircle,
  CANCELLED: XCircle,
}

const columnOrder = ['RECEIVED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'] as const

export function OrdersKanban({ 
  orders, 
  onStatusUpdate, 
  onShowSelectDriverModal,
  onPrintKitchenReceipt,
  onShowOrderDetails,
  updatingStatus,
  thermalPrintEnabled,
  formatCurrency,
  formatDateTime,
  mapPaymentMethodToPortuguese,
  selectedOrder,
  setSelectedOrder,
  cancellationNotes,
  setCancellationNotes,
  onArchiveOrders,
}: OrdersKanbanProps) {
  const { toast } = useToast()

  // Organizar pedidos por status
  const ordersByStatus = columnOrder.reduce((acc, status) => {
    acc[status] = orders.filter(order => order.status === status)
    return acc
  }, {} as Record<string, Order[]>)

  // Handler para drag and drop
  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source, draggableId } = result

    // Se não há destino, cancelar
    if (!destination) return

    // Se a posição não mudou, cancelar
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const newStatus = destination.droppableId
    const orderId = draggableId

    try {
      await onStatusUpdate(orderId, newStatus)
      
      toast({
        title: "Status Atualizado",
        description: `Pedido movido para ${statusLabels[newStatus as keyof typeof statusLabels]}`,
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do pedido",
        variant: "destructive",
      })
    }
  }, [onStatusUpdate, toast])

  // Handler para arquivar todos os pedidos de um status
  const handleArchiveAll = useCallback(async (status: string) => {
    const ordersToArchive = ordersByStatus[status]?.length || 0
    
    if (ordersToArchive === 0) {
      toast({
        title: "Nenhum pedido para arquivar",
        description: `Não há pedidos ${statusLabels[status].toLowerCase()} para arquivar.`,
        variant: "destructive"
      })
      return
    }

    const confirmed = window.confirm(
      `Tem certeza que deseja arquivar todos os ${ordersToArchive} pedidos ${statusLabels[status].toLowerCase()}?\n\nEles não aparecerão mais no Kanban, mas permanecerão disponíveis nos relatórios.`
    )

    if (!confirmed) return

    try {
      await onArchiveOrders(status)
      toast({
        title: "Pedidos Arquivados",
        description: `${ordersToArchive} pedidos ${statusLabels[status].toLowerCase()} foram arquivados com sucesso.`,
      })
    } catch (error) {
      toast({
        title: "Erro ao Arquivar",
        description: "Não foi possível arquivar os pedidos. Tente novamente.",
        variant: "destructive"
      })
    }
  }, [ordersByStatus, onArchiveOrders, toast])

  // Contar pedidos por status
  const getOrderCount = (status: string) => ordersByStatus[status]?.length || 0

  return (
    <div className="h-full">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="kanban-columns grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 h-full">
          {columnOrder.map((status) => {
            const StatusIcon = statusIcons[status]
            const statusOrders = ordersByStatus[status] || []
            
            return (
              <div key={status} className="kanban-column flex flex-col h-full">
                {/* Header da Coluna */}
                <Card className="mb-4 shadow-sm">
                  <CardHeader className={`p-4 ${statusColors[status]} rounded-t-lg`}>
                    <CardTitle className="flex items-center justify-between text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <StatusIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">{statusLabels[status]}</span>
                        <span className="sm:hidden">{statusLabels[status].split(' ')[0]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-white/20 text-current">
                          {getOrderCount(status)}
                        </Badge>
                        {(status === "DELIVERED" || status === "CANCELLED") && getOrderCount(status) > 0 && (
                          <Button
                            size="sm"
                            onClick={() => handleArchiveAll(status)}
                            className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-2 py-1 h-6"
                            title={`Arquivar todos os pedidos ${statusLabels[status].toLowerCase()}`}
                          >
                            <Archive className="h-3 w-3 mr-1" />
                            Arquivar Tudo
                          </Button>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                </Card>

                {/* Área Droppable */}
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`kanban-column-content flex-1 min-h-[200px] max-h-[calc(100vh-300px)] p-2 rounded-lg transition-colors overflow-y-auto ${
                        snapshot.isDraggingOver 
                          ? 'kanban-column-dragging-over' 
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="space-y-3">
                        {statusOrders.map((order, index) => (
                          <Draggable 
                            key={order.id} 
                            draggableId={order.id} 
                            index={index}
                            isDragDisabled={updatingStatus === order.id}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`transition-all ${
                                  snapshot.isDragging 
                                    ? 'kanban-card-dragging' 
                                    : 'hover:shadow-md'
                                }`}
                              >
                                {/* Aqui vamos renderizar o card do pedido */}
                                <OrderCard
                                  order={order}
                                  onShowSelectDriverModal={onShowSelectDriverModal}
                                  onPrintKitchenReceipt={onPrintKitchenReceipt}
                                  onStatusUpdate={onStatusUpdate}
                                  updatingStatus={updatingStatus}
                                  thermalPrintEnabled={thermalPrintEnabled}
                                  formatCurrency={formatCurrency}
                                  formatDateTime={formatDateTime}
                                  mapPaymentMethodToPortuguese={mapPaymentMethodToPortuguese}
                                  selectedOrder={selectedOrder}
                                  setSelectedOrder={setSelectedOrder}
                                  cancellationNotes={cancellationNotes}
                                  setCancellationNotes={setCancellationNotes}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                      
                      {statusOrders.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <StatusIcon className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">Nenhum pedido</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>
    </div>
  )
}

// Componente do Card do Pedido (extraído do componente original)
interface OrderCardProps {
  order: Order
  onShowSelectDriverModal: (orderId: string) => void
  onPrintKitchenReceipt: (order: Order) => void
  onStatusUpdate: (orderId: string, newStatus: string, notes?: string) => Promise<void>
  updatingStatus: string | null
  thermalPrintEnabled: boolean
  formatCurrency: (value: number) => string
  formatDateTime: (dateString: string) => string
  mapPaymentMethodToPortuguese: (backendValue: string) => string
  selectedOrder: Order | null
  setSelectedOrder: (order: Order | null) => void
  cancellationNotes: string
  setCancellationNotes: (notes: string) => void
}

function OrderCard({ 
  order, 
  onShowSelectDriverModal,
  onPrintKitchenReceipt,
  onStatusUpdate,
  updatingStatus,
  thermalPrintEnabled,
  formatCurrency,
  formatDateTime,
  mapPaymentMethodToPortuguese,
  selectedOrder,
  setSelectedOrder,
  cancellationNotes,
  setCancellationNotes
}: OrderCardProps) {
  const getStatusIcon = (status: string) => {
    const icons = {
      RECEIVED: Package,
      PREPARING: Clock,
      ON_THE_WAY: Bike,
      DELIVERED: CheckCircle,
      CANCELLED: XCircle,
    }
    return icons[status as keyof typeof icons] || Package
  }

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case "RECEIVED":
        return { status: "PREPARING", label: "Iniciar Preparo", icon: Clock }
      case "PREPARING":
        return { status: "ON_THE_WAY", label: "Enviar para Entrega", icon: Bike }
      case "ON_THE_WAY":
        return { status: "DELIVERED", label: "Marcar como Entregue", icon: CheckCircle }
      default:
        return null
    }
  }

  const StatusIcon = getStatusIcon(order.status)
  const nextAction = getNextStatus(order.status)

  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden border-2 bg-white">
      {/* Header compacto para Kanban */}
      <div className={`px-4 py-2 ${statusColors[order.status]} border-b-2`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className="h-4 w-4" />
            <span className="text-sm font-bold">#{order.id.slice(-8)}</span>
            {/* Badge para pedidos manuais */}
            {(order.delivery_address === "Manual (Balcão)" || order.delivery_address === "Manual (Telefone)") && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                {order.delivery_address === "Manual (Balcão)" ? (
                  <><Store className="h-2 w-2 mr-1" />BALCÃO</>
                ) : (
                  <><Phone className="h-2 w-2 mr-1" />TEL</>
                )}
              </Badge>
            )}
          </div>
          <span className="text-sm font-bold">{formatCurrency(order.total)}</span>
        </div>
      </div>
      
      <CardContent className="p-3 space-y-3">
        {/* Informações do cliente */}
        <div className="text-sm">
          <div className="flex items-center gap-1 mb-1">
            <Phone className="h-3 w-3 text-gray-500" />
            <span className="font-medium truncate">
              {order.customer_display_name || order.profiles?.full_name || order.customer_name || "Cliente"}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate">
            {order.customer_display_phone || order.delivery_phone || order.profiles?.phone || "Sem telefone"}
          </p>
        </div>

        {/* Endereço */}
        <div className="text-xs">
          <div className="flex items-start gap-1">
            <MapPin className="h-3 w-3 mt-0.5 text-gray-500 flex-shrink-0" />
            <p className="text-gray-600 line-clamp-2">{order.delivery_address}</p>
          </div>
        </div>

        {/* Itens resumidos */}
        <div className="text-xs">
          <p className="flex items-center gap-1">
            <Package className="h-3 w-3 text-gray-500" />
            <span>{order.order_items?.length || 0} itens</span>
          </p>
          <p className="flex items-center gap-1 mt-1">
            <CreditCard className="h-3 w-3 text-gray-500" />
            <span>{mapPaymentMethodToPortuguese(order.payment_method)}</span>
          </p>
        </div>

        {/* Tempo */}
        <div className="text-xs text-gray-500">
          <p>{formatDateTime(order.created_at)}</p>
        </div>

        {/* Botões de ação compactos */}
        <div className="flex flex-wrap gap-1">
          {/* Botão de Impressão */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onPrintKitchenReceipt(order)}
            className="text-xs h-7 px-2"
            title={thermalPrintEnabled ? "Imprimir na Bematech MP-4200 TH" : "Imprimir via navegador"}
          >
            <Printer className="h-3 w-3" />
          </Button>

          {/* Botão Detalhes */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs h-7 px-2" onClick={() => setSelectedOrder(order)}>
                <Eye className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby="order-details-modal-description">
              <DialogHeader>
                <DialogTitle>Detalhes do Pedido #{order.id.slice(-8)}</DialogTitle>
                <DialogDescription id="order-details-modal-description">
                  Visualize os detalhes completos do pedido.
                </DialogDescription>
              </DialogHeader>
              {selectedOrder && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label>Cliente:</Label>
                      <p>{selectedOrder.customer_display_name || selectedOrder.profiles?.full_name || selectedOrder.customer_name || "Cliente não identificado"}</p>
                    </div>
                    <div>
                      <Label>Telefone:</Label>
                      <p>{selectedOrder.customer_display_phone || selectedOrder.delivery_phone || selectedOrder.profiles?.phone || "Sem telefone"}</p>
                    </div>
                    <div>
                      <Label>Status:</Label>
                      <Badge className={statusColors[selectedOrder.status]}>
                        {statusLabels[selectedOrder.status]}
                      </Badge>
                    </div>
                    <div>
                      <Label>Método de Pagamento:</Label>
                      <p>{mapPaymentMethodToPortuguese(selectedOrder.payment_method)}</p>
                    </div>
                  </div>

                  <div>
                    <Label>Endereço de Entrega:</Label>
                    <p className="text-sm">{selectedOrder.delivery_address}</p>
                    {selectedOrder.delivery_instructions && (
                      <p className="text-sm text-gray-500 italic">
                        Instruções: {selectedOrder.delivery_instructions}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Itens do Pedido:</Label>
                    <div className="space-y-2 mt-2">
                      {selectedOrder.order_items?.map((item, index) => (
                        <div key={index} className="flex justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">{item.products?.name || (item as any).name || "Produto não encontrado"}</p>
                            <p className="text-sm text-gray-600">
                              Quantidade: {item.quantity}
                              {item.size && ` • Tamanho: ${item.size}`}
                            </p>
                            {item.toppings && item.toppings.length > 0 && (
                              <p className="text-sm text-gray-500">
                                Adicionais: {item.toppings.join(", ")}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(item.total_price)}</p>
                            <p className="text-sm text-gray-600">{formatCurrency(item.unit_price)} cada</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Botão próxima ação */}
          {nextAction && (
            <Button
              size="sm"
              onClick={() => onStatusUpdate(order.id, nextAction.status)}
              disabled={updatingStatus === order.id}
              className="text-xs h-7 px-2"
            >
              {updatingStatus === order.id ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <nextAction.icon className="h-3 w-3" />
              )}
            </Button>
          )}

          {/* Botão Atribuir Pedido - disponível para pedidos em preparo */}
          {order.status === "PREPARING" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onShowSelectDriverModal(order.id)}
              className="text-xs h-7 px-2 text-blue-600 hover:text-blue-700"
            >
              <Truck className="h-3 w-3" />
            </Button>
          )}

          {/* Botão Cancelar */}
          {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs h-7 px-2 text-red-600 hover:text-red-700">
                  <XCircle className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent aria-describedby="cancel-order-modal-description">
                <DialogHeader>
                  <DialogTitle>Cancelar Pedido</DialogTitle>
                  <DialogDescription id="cancel-order-modal-description">
                    Confirme o cancelamento do pedido e informe o motivo.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <p>Tem certeza que deseja cancelar este pedido?</p>
                  <div>
                    <Label htmlFor="cancellation-notes">Motivo do cancelamento (opcional):</Label>
                    <Textarea
                      id="cancellation-notes"
                      value={cancellationNotes}
                      onChange={(e) => setCancellationNotes(e.target.value)}
                      placeholder="Descreva o motivo do cancelamento..."
                      className="mt-1"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setCancellationNotes("")}>
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => onStatusUpdate(order.id, "CANCELLED", cancellationNotes)}
                      disabled={updatingStatus === order.id}
                    >
                      {updatingStatus === order.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-1" />
                      )}
                      Confirmar Cancelamento
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  )
}