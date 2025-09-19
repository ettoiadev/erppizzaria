import { useState } from "react"
import type { Order } from "../types"

export function useModals() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [cancelNotes, setCancelNotes] = useState("")
  const [showManualOrderModal, setShowManualOrderModal] = useState(false)
  const [showSelectDriverModal, setShowSelectDriverModal] = useState(false)

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order)
  }

  const closeOrderDetails = () => {
    setSelectedOrder(null)
  }

  const openCancelModal = (order: Order) => {
    setSelectedOrder(order)
    setCancelNotes("")
  }

  const closeCancelModal = () => {
    setSelectedOrder(null)
    setCancelNotes("")
  }

  const openManualOrderModal = () => {
    setShowManualOrderModal(true)
  }

  const closeManualOrderModal = () => {
    setShowManualOrderModal(false)
  }

  const openSelectDriverModal = () => {
    setShowSelectDriverModal(true)
  }

  const closeSelectDriverModal = () => {
    setShowSelectDriverModal(false)
  }

  return {
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
  }
}