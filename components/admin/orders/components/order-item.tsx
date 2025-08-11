import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Phone, User } from "lucide-react"
import type { Order } from "../types"
import { statusColors, statusLabels } from "../constants"
import { formatCurrency, formatDateTime, mapPaymentMethodToPortuguese, getStatusIcon } from "../utils"
import { OrderItems } from "./order-items"
import { OrderActions } from "./order-actions"

interface OrderItemProps {
  order: Order
  onPrintKitchen: (order: Order) => void
  onViewDetails: (order: Order) => void
  onUpdateStatus: (orderId: string, newStatus: string) => void
  onAssignDriver: () => void
  onCancelOrder: (order: Order) => void
  isUpdatingStatus: boolean
}

export function OrderItem({
  order,
  onPrintKitchen,
  onViewDetails,
  onUpdateStatus,
  onAssignDriver,
  onCancelOrder,
  isUpdatingStatus,
}: OrderItemProps) {
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`${statusColors[order.status]} text-white font-medium`}
            >
              {(() => {
                const IconComponent = getStatusIcon(order.status)
                return <IconComponent className="w-4 h-4 mr-1" />
              })()}
              {statusLabels[order.status]}
            </Badge>
            <span className="font-bold text-lg">
              #{(order as any).order_number || order.id.slice(-8)}
            </span>
          </div>
          <div className="text-right text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDateTime(order.created_at)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Informações do Cliente */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-500" />
              <span className="font-medium">
                {(order as any).customer_code ? `[${(order as any).customer_code}] ` : ""}
                {(order as any).customer_display_name || (order as any).profiles?.full_name || (order as any).customer_name || 'N/A'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4" />
              {(order as any).customer_display_phone || (order as any).delivery_phone || (order as any).profiles?.phone || 'N/A'}
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(order.total)}
            </div>
          </div>

          {/* Itens do Pedido */}
          <div>
            <h4 className="font-medium mb-2">Itens do Pedido</h4>
            <OrderItems items={order.order_items || []} />
          </div>

          {/* Endereço e Informações de Entrega */}
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <div className="font-medium">Endereço de Entrega:</div>
                <div className="text-gray-600">{order.delivery_address}</div>
              </div>
            </div>
            
            {/* Resumo Financeiro */}
            <div className="text-sm space-y-1 bg-gray-50 p-2 rounded">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency((order as any).subtotal || order.total)}</span>
              </div>
              {(order as any).delivery_fee > 0 && (
                <div className="flex justify-between">
                  <span>Taxa de Entrega:</span>
                  <span>{formatCurrency((order as any).delivery_fee)}</span>
                </div>
              )}
              {(order as any).discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Desconto:</span>
                  <span>-{formatCurrency((order as any).discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t pt-1">
                <span>Total:</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
            
            {/* Informações de Pagamento */}
            <div className="text-sm">
              <div className="font-medium">Pagamento:</div>
              <div>{mapPaymentMethodToPortuguese(order.payment_method)}</div>
            </div>
            
            {/* Tempo Estimado */}
            {(order as any).estimated_delivery_time && (
              <div className="text-sm">
                <div className="font-medium">Tempo Estimado:</div>
                <div>{(order as any).estimated_delivery_time} min</div>
              </div>
            )}
          </div>
        </div>

        {/* Observações */}
        {order.delivery_instructions && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <div className="font-medium text-yellow-800 mb-1">📝 Observações:</div>
            <div className="text-sm text-yellow-700">{order.delivery_instructions}</div>
          </div>
        )}

        {/* Ações do Pedido */}
        <OrderActions
          order={order}
          onPrintKitchen={onPrintKitchen}
          onViewDetails={onViewDetails}
          onUpdateStatus={onUpdateStatus}
          onAssignDriver={onAssignDriver}
          onCancelOrder={onCancelOrder}
          isUpdatingStatus={isUpdatingStatus}
        />
      </CardContent>
    </Card>
  )
}