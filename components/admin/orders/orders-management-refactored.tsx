"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { OrdersKanban } from "./orders-kanban"
import { SelectDriverModal } from "./select-driver-modal"
import { OrderDetailsModal } from "./order-details-modal"
import { CancelOrderModal } from "./cancel-order-modal"
import { ManualOrderModal } from "./manual-order-modal"
import { OrderStatisticsComponent } from "./components/order-statistics"
import { OrderControls } from "./components/order-controls"
import { OrderList } from "./components/order-list"
import { useOrdersData } from "./hooks/use-orders-data"
import { usePrinting } from "./hooks/use-printing"
import { useModals } from "./hooks/use-modals"
import type { OrderStatus } from "./types"

export function OrdersManagementRefactored() {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'ALL'>('ALL')
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban')
  const { toast } = useToast()

  // Hooks personalizados
  const {
    orders,
    statistics,
    loading,
    updatingStatus,
    fetchOrders,
    updateOrderStatus,
    handleArchiveOrders,
    handleArchiveAllCompleted,
  } = useOrdersData(selectedStatus === 'ALL' ? 'all' : selectedStatus.toLowerCase())

  const {
    printKitchenReceipt,
  } = usePrinting()

  const {
    selectedOrder,
    setSelectedOrder,
    cancelNotes,
    setCancelNotes,
    showManualOrderModal,
    showSelectDriverModal,
    openOrderDetails,
    closeOrderDetails,
    openCancelModal,
    closeCancelModal,
    openManualOrderModal,
    closeManualOrderModal,
    openSelectDriverModal,
    closeSelectDriverModal,
  } = useModals()

  // Carregar pedidos ao montar o componente
  useEffect(() => {
    fetchOrders()
  }, [selectedStatus, fetchOrders])

  // Handlers
  const handleRefresh = () => {
    fetchOrders()
  }

  const handleArchiveAll = async () => {
    try {
      await handleArchiveAllCompleted()
      toast({
        title: "Sucesso",
        description: "Pedidos arquivados com sucesso.",
      })
    } catch (error) {
      console.error('Erro ao arquivar pedidos:', error)
      toast({
        title: "Erro",
        description: "Erro ao arquivar pedidos.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateStatus = async (orderId: string, newStatus: string, notes?: string) => {
    try {
      await updateOrderStatus(orderId, newStatus, notes)
      toast({
        title: "Status Atualizado",
        description: `Status do pedido atualizado com sucesso.`,
      })
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do pedido.",
        variant: "destructive",
      })
    }
  }

  const handleCancelOrder = async () => {
    if (!selectedOrder) return

    try {
      await updateOrderStatus(selectedOrder.id, 'CANCELLED', cancelNotes)
      toast({
        title: "Pedido Cancelado",
        description: `Pedido #${(selectedOrder as any).order_number || selectedOrder.id.slice(-8)} foi cancelado.`,
      })
      closeCancelModal()
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error)
      toast({
        title: "Erro",
        description: "Erro ao cancelar pedido.",
        variant: "destructive",
      })
    }
  }

  // Filtrar pedidos para exibição
  const filteredOrders = selectedStatus === 'ALL' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus)

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Gerenciamento de Pedidos</h1>
      
      {/* Estatísticas */}
      <OrderStatisticsComponent statistics={statistics} />
      
      {/* Controles */}
      <OrderControls
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={handleRefresh}
        onArchiveAll={handleArchiveAll}
        onNewManualOrder={openManualOrderModal}
        isLoading={loading}
        isUpdatingStatus={!!updatingStatus}
      />

      {/* Conteúdo Principal */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando pedidos...</span>
        </div>
      ) : (
        <>
          {viewMode === 'kanban' ? (
            <OrdersKanban
              orders={orders}
              onStatusUpdate={handleUpdateStatus}
              onShowSelectDriverModal={(orderId: string) => openSelectDriverModal()}
              onPrintKitchenReceipt={printKitchenReceipt}
              onShowOrderDetails={openOrderDetails}
              updatingStatus={updatingStatus}
              thermalPrintEnabled={true}
              formatCurrency={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
              formatDateTime={(dateString: string) => new Date(dateString).toLocaleString('pt-BR')}
              mapPaymentMethodToPortuguese={(method: string) => {
                const mapping: Record<string, string> = {
                  'CASH': 'Dinheiro',
                  'CARD': 'Cartão',
                  'PIX': 'PIX',
                  'CREDIT_CARD': 'Cartão de Crédito',
                  'DEBIT_CARD': 'Cartão de Débito'
                }
                return mapping[method] || method
              }}
              selectedOrder={selectedOrder}
              setSelectedOrder={setSelectedOrder}
              cancellationNotes={cancelNotes}
              setCancellationNotes={setCancelNotes}
            />
          ) : (
            <OrderList
              orders={filteredOrders}
              onPrintKitchen={printKitchenReceipt}
              onViewDetails={openOrderDetails}
              onUpdateStatus={handleUpdateStatus}
              onAssignDriver={openSelectDriverModal}
              onCancelOrder={openCancelModal}
              isUpdatingStatus={!!updatingStatus}
            />
          )}
        </>
      )}

      {/* Modais */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={closeOrderDetails}
        />
      )}

      <CancelOrderModal
        isOpen={!!selectedOrder}
        onClose={closeCancelModal}
        onConfirm={handleCancelOrder}
        notes={cancelNotes}
        onNotesChange={setCancelNotes}
        orderNumber={selectedOrder ? ((selectedOrder as any).order_number || selectedOrder.id.slice(-8)) : ''}
      />

      {showManualOrderModal && (
        <ManualOrderModal
          isOpen={showManualOrderModal}
          onClose={closeManualOrderModal}
          onOrderCreated={handleRefresh}
        />
      )}

      {showSelectDriverModal && (
        <SelectDriverModal
          orderId={selectedOrder?.id || ''}
          isOpen={showSelectDriverModal}
          onClose={closeSelectDriverModal}
          onAssign={handleRefresh}
        />
      )}
    </div>
  )
}