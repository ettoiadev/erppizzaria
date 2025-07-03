import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { MapPin, Phone, CreditCard } from "lucide-react"

interface OrderDetailsProps {
  order: any
}

export function OrderDetails({ order }: OrderDetailsProps) {
  // Early return se order não existe
  if (!order) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
        <span className="ml-2">Carregando detalhes do pedido...</span>
      </div>
    )
  }

  // Extrair itens do pedido - pode vir como 'items' ou 'order_items'
  const orderItems = order.items || order.order_items || []
  
  console.log("OrderDetails - order:", order)
  console.log("OrderDetails - orderItems:", orderItems)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Itens do Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orderItems && orderItems.length > 0 ? (
              orderItems.map((item: any, index: number) => {
                // Extrair nome do produto - pode estar em item.name ou item.product.name
                const itemName = item.name || item.product?.name || `Item ${index + 1}`
                const itemPrice = item.price || item.unit_price || item.total_price || 0
                const itemQuantity = item.quantity || 1
                
                return (
                  <div key={item.id || index} className="flex justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{itemName}</div>
                      {item.size && <div className="text-sm text-gray-600">Tamanho: {item.size}</div>}
                      {item.toppings && item.toppings.length > 0 && (
                        <div className="text-sm text-gray-600">Adicionais: {item.toppings.join(", ")}</div>
                      )}
                      <div className="text-sm text-gray-600">Qtd: {itemQuantity}</div>
                    </div>
                    <div className="font-medium">R$ {(Number(itemPrice) * Number(itemQuantity)).toFixed(2)}</div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-4 text-gray-500">
                Nenhum item encontrado neste pedido.
              </div>
            )}

            <Separator />

            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">R$ {Number(order.total).toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações de Entrega</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <div className="font-medium">
                {order.customer?.name || order.full_name || "Cliente"}
              </div>
              <div className="text-gray-600">
                {order.customer?.address || order.delivery_address || "Endereço não informado"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-gray-500" />
            <span className="text-gray-600">
              {order.customer?.phone || order.delivery_phone || order.phone || "Telefone não informado"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-gray-500" />
            <span className="text-gray-600">
              Pagamento:{" "}
              {(() => {
                const paymentMethod = order.paymentMethod || order.payment_method
                switch(paymentMethod) {
                  case "PIX":
                  case "pix":
                    return "PIX"
                  case "CREDIT_CARD":
                  case "card":
                    return "Cartão na Entrega"
                  case "CASH":
                  case "cash":
                    return "Dinheiro na Entrega"
                  default:
                    return paymentMethod || "Não informado"
                }
              })()}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Número do Pedido:</span>
            <span className="font-medium">#{order.id ? order.id.slice(-8) : 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Data do Pedido:</span>
            <span className="font-medium">
              {order.createdAt || order.created_at 
                ? new Date(order.createdAt || order.created_at).toLocaleString("pt-BR")
                : "Data não informada"
              }
            </span>
          </div>
          {(order.estimatedDelivery || order.estimated_delivery_time) && (
            <div className="flex justify-between">
              <span className="text-gray-600">Previsão de Entrega:</span>
              <span className="font-medium">
                {new Date(order.estimatedDelivery || order.estimated_delivery_time).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
