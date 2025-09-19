import { useMemo } from "react"
import { Order } from "../types"
import { columnOrder } from "../constants"

interface UseOrdersByStatusProps {
  orders: Order[]
}

export function useOrdersByStatus({ orders }: UseOrdersByStatusProps) {
  const ordersByStatus = useMemo(() => {
    return columnOrder.reduce((acc, status) => {
      acc[status] = orders.filter(order => order.status === status)
      return acc
    }, {} as Record<string, Order[]>)
  }, [orders])

  const getOrderCount = (status: string) => ordersByStatus[status]?.length || 0

  return {
    ordersByStatus,
    getOrderCount
  }
}