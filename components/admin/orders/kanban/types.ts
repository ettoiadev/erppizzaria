export interface OrderItem {
  id: string
  name?: string
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
  order_number?: string
  status: keyof typeof import('./constants').statusLabels
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
  profiles: {
    full_name: string
    phone?: string
  }
  customer_display_name?: string
  customer_display_phone?: string
  customer_name?: string
  order_items: OrderItem[]
  items?: OrderItem[] // Added for compatibility with new_code
}

export interface OrdersKanbanProps {
  orders: Order[]
  onStatusUpdate: (orderId: string, newStatus: string, notes?: string) => Promise<void>
  onShowSelectDriverModal: (orderId: string) => void
  onPrintKitchenReceipt: (order: Order) => void
  onShowOrderDetails: (order: Order) => void
  updatingStatus: string | null
  thermalPrintEnabled: boolean
  formatCurrency: (value: number) => string
  formatDateTime: (dateString: string) => string
  mapPaymentMethodToPortuguese: (backendValue: string) => string
  selectedOrder: Order | null
  setSelectedOrder: (order: Order | null) => void
  cancellationNotes: string
  setCancellationNotes: (notes: string) => void
}

export interface OrderCardProps {
  order: Order
  onShowSelectDriverModal: (orderId: string) => void
  onPrintKitchenReceipt: (order: Order) => void
  onStatusUpdate: (orderId: string, newStatus: string, notes?: string) => Promise<void>
  updatingStatus: string | null
  thermalPrintEnabled: boolean
  formatCurrency: (value: number) => string
  formatDateTime: (dateString: string) => string
  mapPaymentMethodToPortuguese: (backendValue: string) => string
  selectedOrder: Order | null
  setSelectedOrder: (order: Order | null) => void
  cancellationNotes: string
  setCancellationNotes: (notes: string) => void
}

export interface KanbanColumnProps {
  status: string
  orders: Order[]
  onStatusUpdate: (orderId: string, newStatus: string, notes?: string) => Promise<void>
  onShowSelectDriverModal: (orderId: string) => void
  onPrintKitchenReceipt: (order: Order) => void
  onShowOrderDetails: (order: Order) => void
  updatingStatus: string | null
  thermalPrintEnabled: boolean
  formatCurrency: (value: number) => string
  formatDateTime: (dateString: string) => string
  mapPaymentMethodToPortuguese: (backendValue: string) => string
  selectedOrder: Order | null
  setSelectedOrder: (order: Order | null) => void
  cancellationNotes: string
  setCancellationNotes: (notes: string) => void
}