// Types for Orders Management

export interface OrderItem {
  id: string
  name?: string // Nome do produto no item
  quantity: number
  unit_price: number
  total_price: number
  size?: string
  toppings?: string[]
  products?: {
    name: string
    description: string
    image: string
  }
  half_and_half?: {
    firstHalf?: {
      productName: string
      toppings: string[]
    }
    secondHalf?: {
      productName: string
      toppings: string[]
    }
  }
  special_instructions?: string
}

export interface Order {
  id: string
  status: keyof typeof statusLabels
  total: number
  subtotal: number
  delivery_fee: number
  discount: number
  payment_method: string
  delivery_address: string
  delivery_phone: string
  delivery_instructions?: string
  estimated_delivery_time?: string
  created_at: string
  updated_at: string
  order_number?: string
  profiles: {
    full_name: string
    phone?: string
  }
  // Novos campos calculados da API para exibição correta do cliente
  customer_display_name?: string
  customer_display_phone?: string
  customer_name?: string
  customer_code?: string
  customer_phone?: string
  order_items: OrderItem[]
}

export interface OrderStatistics {
  total: number
  received: number
  preparing: number
  onTheWay: number
  delivered: number
  cancelled: number
  totalRevenue: number
}

export const statusLabels = {
  RECEIVED: "Recebido",
  PREPARING: "Preparando",
  ON_THE_WAY: "Saiu para Entrega",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
} as const

export type OrderStatus = keyof typeof statusLabels

export interface NextAction {
  status: string
  label: string
  icon: any
}