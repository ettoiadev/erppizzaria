import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Printer, Eye, Clock, Truck, CheckCircle, X, UserPlus } from "lucide-react"
import type { Order, NextAction } from "../types"
import { getNextStatus } from "../utils"

interface OrderActionsProps {
  order: Order
  onPrintKitchen: (order: Order) => void
  onViewDetails: (order: Order) => void
  onUpdateStatus: (orderId: string, newStatus: string) => void
  onAssignDriver: () => void
  onCancelOrder: (order: Order) => void
  isUpdatingStatus: boolean
}

export function OrderActions({
  order,
  onPrintKitchen,
  onViewDetails,
  onUpdateStatus,
  onAssignDriver,
  onCancelOrder,
  isUpdatingStatus,
}: OrderActionsProps) {
  const nextAction = getNextStatus(order.status)

  const getActionIcon = (action: NextAction) => {
    switch (action.status) {
      case 'PREPARING':
        return <Clock className="w-4 h-4" />
      case 'OUT_FOR_DELIVERY':
        return <Truck className="w-4 h-4" />
      case 'DELIVERED':
        return <CheckCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  const getActionVariant = (action: NextAction) => {
    switch (action.status) {
      case 'PREPARING':
        return 'default' as const
      case 'OUT_FOR_DELIVERY':
        return 'default' as const
      case 'DELIVERED':
        return 'default' as const
      default:
        return 'outline' as const
    }
  }

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {/* Botão Imprimir para Cozinha */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => onPrintKitchen(order)}
        className="text-purple-600 border-purple-600 hover:bg-purple-50"
      >
        <Printer className="w-4 h-4 mr-1" />
        Imprimir para Cozinha
      </Button>

      {/* Botão Detalhes */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => onViewDetails(order)}
      >
        <Eye className="w-4 h-4 mr-1" />
        Detalhes
      </Button>

      {/* Botão de próxima ação */}
      {nextAction && (
        <Button
          size="sm"
          variant={getActionVariant(nextAction)}
          onClick={() => onUpdateStatus(order.id, nextAction.status)}
          disabled={isUpdatingStatus}
          className={nextAction.status === 'DELIVERED' ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          {getActionIcon(nextAction)}
          <span className="ml-1">{nextAction.label}</span>
        </Button>
      )}

      {/* Botão Atribuir Pedido (apenas para status PREPARING) */}
      {order.status === 'PREPARING' && (
        <Button
          size="sm"
          variant="outline"
          onClick={onAssignDriver}
          className="text-blue-600 border-blue-600 hover:bg-blue-50"
        >
          <UserPlus className="w-4 h-4 mr-1" />
          Atribuir Pedido
        </Button>
      )}

      {/* Botão Cancelar (apenas para pedidos não finalizados) */}
      {!['DELIVERED', 'CANCELLED'].includes(order.status) && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onCancelOrder(order)}
          className="text-red-600 border-red-600 hover:bg-red-50"
        >
          <X className="w-4 h-4 mr-1" />
          Cancelar
        </Button>
      )}
    </div>
  )
}