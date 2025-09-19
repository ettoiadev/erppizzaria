import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, formatDateTime, mapPaymentMethodToPortuguese } from "./utils"
import { statusColors, statusLabels } from "./constants"
import type { Order } from "./types"

interface OrderDetailsModalProps {
  order: Order
  isOpen: boolean
  onClose: () => void
}

export function OrderDetailsModal({ order, isOpen, onClose }: OrderDetailsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby="order-details-modal-description">
        <DialogHeader>
          <DialogTitle>Detalhes do Pedido #{(order as any).order_number || order.id.slice(-8)}</DialogTitle>
          <DialogDescription id="order-details-modal-description">
            Visualize os detalhes completos do pedido.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label>Cliente:</Label>
              <p>{(order as any).customer_display_name || order.profiles?.full_name || (order as any).customer_name || "Cliente não identificado"}</p>
            </div>
            <div>
              <Label>Telefone:</Label>
              <p>{(order as any).customer_display_phone || order.delivery_phone || order.profiles?.phone || "Sem telefone"}</p>
            </div>
            <div>
              <Label>Status:</Label>
              <Badge className={statusColors[order.status]}>
                {statusLabels[order.status]}
              </Badge>
            </div>
            <div>
              <Label>Método de Pagamento:</Label>
              <p>{mapPaymentMethodToPortuguese(order.payment_method)}</p>
            </div>
          </div>

          <div>
            <Label>Endereço de Entrega:</Label>
            <p className="text-sm">{order.delivery_address}</p>
            {order.delivery_instructions && (
              <p className="text-sm text-gray-500 italic">
                Instruções: {order.delivery_instructions}
              </p>
            )}
          </div>

          <div>
            <Label>Itens do Pedido:</Label>
            <div className="space-y-2 mt-2">
              {order.order_items?.map((item, index) => (
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
                    {item.special_instructions && (
                      <p className="text-sm text-orange-600">
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

          <Separator />

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.delivery_fee > 0 && (
              <div className="flex justify-between">
                <span>Taxa de Entrega:</span>
                <span>{formatCurrency(order.delivery_fee)}</span>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Desconto:</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1 border-t">
              <span>Total:</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p>Criado em: {formatDateTime(order.created_at)}</p>
            <p>Atualizado em: {formatDateTime(order.updated_at)}</p>
            {order.estimated_delivery_time && (
              <p>Previsão de entrega: {formatDateTime(order.estimated_delivery_time)}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}