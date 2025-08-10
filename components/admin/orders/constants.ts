import { Clock, Phone, MapPin, CreditCard, Package, Bike, CheckCircle, XCircle } from "lucide-react"

export const statusColors = {
  RECEIVED: "bg-blue-500 text-white border-blue-600 shadow-md",
  PREPARING: "bg-yellow-500 text-black border-yellow-600 shadow-md font-bold",
  ON_THE_WAY: "bg-blue-600 text-white border-blue-700 shadow-md font-bold",
  DELIVERED: "bg-green-500 text-white border-green-600 shadow-md",
  CANCELLED: "bg-red-500 text-white border-red-600 shadow-md",
}

export const statusLabels = {
  RECEIVED: "Recebido",
  PREPARING: "Preparando",
  ON_THE_WAY: "Saiu para Entrega",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
}

export const statusIcons = {
  RECEIVED: Package,
  PREPARING: Clock,
  ON_THE_WAY: Bike,
  DELIVERED: CheckCircle,
  CANCELLED: XCircle,
}

// Mapeamento de métodos de pagamento do backend para português
export const paymentMethodMapping: Record<string, string> = {
  "PIX": "PIX",
  "CASH": "Dinheiro",
  "CREDIT_CARD": "Cartão de Crédito", 
  "DEBIT_CARD": "Cartão de Débito",
  "CARD_ON_DELIVERY": "Cartão na Entrega"
}