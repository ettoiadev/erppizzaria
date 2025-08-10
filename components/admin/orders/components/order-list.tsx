import type { Order } from "../types"
import { OrderItem } from "./order-item"

interface OrderListProps {
  orders: Order[]
  onPrintKitchen: (order: Order) => void
  onViewDetails: (order: Order) => void
  onUpdateStatus: (orderId: string, newStatus: string) => void
  onAssignDriver: () => void
  onCancelOrder: (order: Order) => void
  isUpdatingStatus: boolean
}

export function OrderList({
  orders,
  onPrintKitchen,
  onViewDetails,
  onUpdateStatus,
  onAssignDriver,
  onCancelOrder,
  isUpdatingStatus,
}: OrderListProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nenhum pedido encontrado.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderItem
          key={order.id}
          order={order}
          onPrintKitchen={onPrintKitchen}
          onViewDetails={onViewDetails}
          onUpdateStatus={onUpdateStatus}
          onAssignDriver={onAssignDriver}
          onCancelOrder={onCancelOrder}
          isUpdatingStatus={isUpdatingStatus}
        />
      ))}
    </div>
  )
}