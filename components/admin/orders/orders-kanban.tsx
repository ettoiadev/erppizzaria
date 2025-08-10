"use client"

import { OrdersKanbanRefactored } from "./kanban"
import type { OrdersKanbanProps } from "./kanban"

// Re-exportar tipos para compatibilidade
export type { OrderItem, Order, OrdersKanbanProps, OrderCardProps, KanbanColumnProps } from "./kanban"
export { statusLabels, statusColors, statusIcons, columnOrder } from "./kanban"

export function OrdersKanban(props: OrdersKanbanProps) {
  return <OrdersKanbanRefactored {...props} />
}

// O componente OrderCard agora está em ./kanban/components/order-card.tsx