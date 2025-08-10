import { Package, Clock, Bike, CheckCircle, XCircle } from "lucide-react"

export const statusLabels = {
  RECEIVED: "Recebidos",
  PREPARING: "Preparando", 
  ON_THE_WAY: "Saiu para Entrega",
  DELIVERED: "Entregues",
  CANCELLED: "Cancelados",
} as const

export const statusColors = {
  RECEIVED: "bg-blue-500 text-white border-blue-600",
  PREPARING: "bg-yellow-500 text-black border-yellow-600",
  ON_THE_WAY: "bg-orange-500 text-white border-orange-600", 
  DELIVERED: "bg-green-500 text-white border-green-600",
  CANCELLED: "bg-red-500 text-white border-red-600",
} as const

export const statusIcons = {
  RECEIVED: Package,
  PREPARING: Clock,
  ON_THE_WAY: Bike,
  DELIVERED: CheckCircle,
  CANCELLED: XCircle,
} as const

export const columnOrder = ['RECEIVED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'] as const

export type StatusType = keyof typeof statusLabels