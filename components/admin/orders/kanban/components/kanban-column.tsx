"use client"

import { Droppable, Draggable } from "@hello-pangea/dnd"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { KanbanColumnProps } from "../types"
import { statusColors, statusLabels, statusIcons } from "../constants"
import { OrderCard } from "./order-card"

export function KanbanColumn({
  status,
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
}: KanbanColumnProps) {
  const StatusIcon = statusIcons[status as keyof typeof statusIcons]
  const orderCount = orders.length

  return (
    <div className="kanban-column flex flex-col h-full min-w-0">
      {/* Header da Coluna */}
      <Card className="mb-4 shadow-sm">
        <CardHeader className={`p-4 ${statusColors[status as keyof typeof statusColors]} rounded-t-lg`}>
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <div className="flex items-center gap-2 min-w-0">
              {StatusIcon && <StatusIcon className="h-4 w-4 flex-shrink-0" />}
              <span className="hidden sm:inline truncate">{statusLabels[status as keyof typeof statusLabels]}</span>
              <span className="sm:hidden truncate">{statusLabels[status as keyof typeof statusLabels].split(' ')[0]}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="secondary" className="bg-white/20 text-current">
                {orderCount}
              </Badge>
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
              {orders.map((order, index) => (
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
                      className={`transition-all w-full ${
                        snapshot.isDragging 
                          ? 'kanban-card-dragging' 
                          : 'hover:shadow-md'
                      }`}
                    >
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
            
            {orders.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                {StatusIcon && <StatusIcon className="h-8 w-8 mx-auto mb-2" />}
                <p className="text-sm">Nenhum pedido</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  )
}