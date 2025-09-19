"use client"

import { DragDropContext } from "@hello-pangea/dnd"
import "../orders-kanban.css"
import { OrdersKanbanProps } from "./types"
import { columnOrder } from "./constants"
import { useDragDrop } from "./hooks/use-drag-drop"
import { useOrdersByStatus } from "./hooks/use-orders-by-status"
import { KanbanColumn } from "./components/kanban-column"

export function OrdersKanbanRefactored({ 
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
}: OrdersKanbanProps) {
  const { handleDragEnd } = useDragDrop({ onStatusUpdate })
  const { ordersByStatus } = useOrdersByStatus({ orders })

  return (
    <div className="h-full">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="kanban-columns grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 h-full">
          {columnOrder.map((status) => {
            const statusOrders = ordersByStatus[status] || []
            
            return (
              <KanbanColumn
                key={status}
                status={status}
                orders={statusOrders}
                onStatusUpdate={onStatusUpdate}
                onShowSelectDriverModal={onShowSelectDriverModal}
                onPrintKitchenReceipt={onPrintKitchenReceipt}
                onShowOrderDetails={onShowOrderDetails}
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
            )
          })}
        </div>
      </DragDropContext>
    </div>
  )
}