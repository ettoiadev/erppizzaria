import { Clock, Bike, CheckCircle, Package, type LucideIcon } from "lucide-react"
import { statusIcons, paymentMethodMapping } from "./constants"
import type { NextAction } from "./types"

// Função para formatar moeda
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

// Função para formatar data e hora
export const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("pt-BR")
}

// Função para obter ícone do status
export const getStatusIcon = (status: string): LucideIcon => {
  return statusIcons[status as keyof typeof statusIcons] || Package
}

// Função para obter próxima ação baseada no status atual
export const getNextStatus = (currentStatus: string): NextAction | null => {
  switch (currentStatus) {
    case "RECEIVED":
      return { status: "PREPARING", label: "Iniciar Preparo", icon: Clock }
    case "PREPARING":
      return { status: "ON_THE_WAY", label: "Enviar para Entrega", icon: Bike }
    case "ON_THE_WAY":
      return { status: "DELIVERED", label: "Marcar como Entregue", icon: CheckCircle }
    default:
      return null
  }
}

// Função para mapear método de pagamento para português
export const mapPaymentMethodToPortuguese = (backendValue: string): string => {
  return paymentMethodMapping[backendValue] || backendValue
}

// Função auxiliar para obter label do status
export const getStatusLabel = (status: string) => {
  const statusLabels: Record<string, string> = {
    'RECEIVED': 'Recebidos',
    'PREPARING': 'Preparando',
    'ON_THE_WAY': 'Saiu para Entrega',
    'DELIVERED': 'Entregues',
    'CANCELLED': 'Cancelados'
  }
  return statusLabels[status] || status
}