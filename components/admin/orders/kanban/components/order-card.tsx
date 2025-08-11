"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Clock, Phone, MapPin, CreditCard, Package, Bike, CheckCircle, XCircle, Eye, RefreshCw, Printer, Store, User } from "lucide-react"
import { OrderCardProps } from "../types"
import { statusColors, statusLabels } from "../constants"

export function OrderCard({ 
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
    const IconComponent = icons[status as keyof typeof icons] || Package
    return <IconComponent className="w-4 h-4" />
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

  const statusIcon = getStatusIcon(order.status)
  const nextAction = getNextStatus(order.status)

  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden border-2 bg-white w-full max-w-full">
      {/* Header compacto para Kanban */}
      <div className={`px-4 py-2 ${statusColors[order.status]} border-b-2`}>
        <div className="flex items-center justify-between min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {statusIcon}
            <span className="text-sm font-bold truncate">#{order.order_number || order.id.slice(-8)}</span>
            {/* Badge para pedidos manuais */}
            {(order.delivery_address === "Manual (Balcão)" || order.delivery_address === "Manual (Telefone)") && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200 text-xs flex-shrink-0">
                {order.delivery_address === "Manual (Balcão)" ? (
                  <><Store className="h-2 w-2 mr-1" />BALCÃO</>
                ) : (
                  <><Phone className="h-2 w-2 mr-1" />TEL</>
                )}
              </Badge>
            )}
          </div>
          <span className="text-sm font-bold flex-shrink-0 ml-2">{formatCurrency(order.total)}</span>
        </div>
      </div>
      
      <CardContent className="p-4 space-y-4">
        {/* Informações do cliente */}
        <div className="text-sm space-y-2">
          <div className="flex items-center gap-1 min-w-0">
            <User className="h-3 w-3 text-gray-500 flex-shrink-0" />
            <span className="font-medium truncate">
              {order.customer_display_name || order.profiles?.full_name || order.customer_name || "Cliente não identificado"}
            </span>
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <Phone className="h-3 w-3 text-gray-500 flex-shrink-0" />
            <span className="text-xs text-gray-600 truncate">
              {order.customer_display_phone || order.delivery_phone || order.profiles?.phone || "Sem telefone"}
            </span>
          </div>
        </div>

        {/* Endereço */}
        <div className="text-xs">
          <div className="flex items-start gap-1 min-w-0">
            <MapPin className="h-3 w-3 mt-0.5 text-gray-500 flex-shrink-0" />
            <p className="text-gray-600 line-clamp-2 min-w-0">
              {(order as any).customer_address || (order as any).delivery_address || "Endereço não informado"}
            </p>
          </div>
        </div>

        {/* Itens detalhados */}
        <div className="text-xs space-y-2">
          <div className="flex items-start gap-1 min-w-0">
            <Package className="h-3 w-3 mt-0.5 text-gray-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium mb-1">
                {order.order_items?.length || order.items?.length || 0} itens
              </p>
              {(order.order_items || order.items || []).slice(0, 3).map((item, index) => (
                <p key={index} className="text-gray-600 text-xs mb-1 truncate">
                  • {item.quantity}x {item.name || "Produto"}
                  {item.special_instructions && (
                    <span className="text-gray-500 italic"> ({item.special_instructions})</span>
                  )}
                </p>
              ))}
              {(order.order_items?.length || order.items?.length || 0) > 3 && (
                <p className="text-gray-500 text-xs italic">
                  +{(order.order_items?.length || order.items?.length || 0) - 3} mais itens...
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <CreditCard className="h-3 w-3 text-gray-500 flex-shrink-0" />
            <span className="text-gray-600 truncate">{mapPaymentMethodToPortuguese(order.payment_method)}</span>
          </div>
        </div>

        {/* Tempo */}
        <div className="text-xs text-gray-500">
          <p className="truncate">{formatDateTime(order.created_at)}</p>
        </div>

        {/* Botões de ação - Apenas ícones com cores de fundo */}
        <div className="flex flex-wrap gap-2 justify-start">
          {/* Botão de Impressão */}
          <Button 
            size="sm"
            onClick={() => onPrintKitchenReceipt(order)}
            className={`p-2 min-w-0 h-8 w-8 rounded-full flex-shrink-0 ${
              thermalPrintEnabled 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            title={thermalPrintEnabled ? "Imprimir na Bematech MP-4200 TH" : "Imprimir via navegador"}
          >
            <Printer className="h-4 w-4" />
          </Button>

          {/* Botão Detalhes */}
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                className="p-2 min-w-0 h-8 w-8 rounded-full bg-purple-500 hover:bg-purple-600 text-white flex-shrink-0"
                onClick={() => setSelectedOrder(order)}
                title="Ver detalhes do pedido"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby="order-details-modal-description">
              <DialogHeader>
                <DialogTitle>Detalhes do Pedido #{order.order_number || order.id.slice(-8)}</DialogTitle>
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
                    <p className="text-sm">{selectedOrder.delivery_address || "Endereço não informado"}</p>
                    {selectedOrder.delivery_instructions && (
                      <p className="text-sm text-gray-500 italic">
                        Instruções: {selectedOrder.delivery_instructions}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Itens do Pedido:</Label>
                    <div className="space-y-2 mt-2">
                      {(selectedOrder.order_items || selectedOrder.items || []).map((item, index) => (
                        <div key={index} className="flex justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">
                              {item.products?.name || item.name || "Produto não encontrado"}
                            </p>
                            <p className="text-sm text-gray-600">
                              Quantidade: {item.quantity}
                              {item.size && ` • Tamanho: ${item.size}`}
                            </p>
                            {item.toppings && item.toppings.length > 0 && (
                              <p className="text-sm text-gray-500">
                                Adicionais: {item.toppings.join(", ")}
                              </p>
                            )}
                            {item.special_instructions && (
                              <p className="text-sm text-gray-500 italic">
                                Observações: {item.special_instructions}
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
              className={`p-2 min-w-0 h-8 w-8 rounded-full text-white flex-shrink-0 ${
                nextAction.status === "DELIVERED" 
                  ? "bg-green-500 hover:bg-green-600" 
                  : "bg-orange-500 hover:bg-orange-600"
              }`}
              title={nextAction.label}
            >
              {updatingStatus === order.id ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <nextAction.icon className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Botão Atribuir Pedido - disponível para pedidos em preparo */}
          {order.status === "PREPARING" && (
            <Button
              size="sm"
              onClick={() => onShowSelectDriverModal(order.id)}
              className="p-2 min-w-0 h-8 w-8 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white flex-shrink-0"
              title="Atribuir entregador"
            >
              <Bike className="h-4 w-4" />
            </Button>
          )}

          {/* Botão Cancelar */}
          {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  className="p-2 min-w-0 h-8 w-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex-shrink-0"
                  title="Cancelar pedido"
                >
                  <XCircle className="h-4 w-4" />
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