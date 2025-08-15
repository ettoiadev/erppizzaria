export interface Customer {
  id: string
  customer_code?: string
  name: string
  email: string
  phone: string
  address: string
  complement?: string
  street?: string
  number?: string
  neighborhood?: string
  city?: string
  state?: string
  zip_code?: string
  created_at: string
  last_order_at?: string
  total_orders: number
  total_spent: number
  status: "active" | "inactive" | "vip" | "regular" | "churned"
  favorite_items: string[]
  
  // Compatibilidade com versões antigas (será removido gradualmente)
  createdAt?: string
  lastOrderAt?: string
  totalOrders?: number
  totalSpent?: number
  favoriteItems?: string[]
}

export interface CustomerOrder {
  id: string
  customer_id: string
  date: string
  status: string
  total: number
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  payment_method: string
  
  // Compatibilidade com versões antigas (será removido gradualmente)
  customerId?: string
  paymentMethod?: string
}

export interface DeliveryPerson {
  id: string
  name: string
  email: string
  phone: string
  vehicle_type: "motorcycle" | "bicycle" | "car"
  vehicle_plate: string
  status: "available" | "busy" | "offline"
  current_location: string
  total_deliveries: number
  average_rating: number
  average_delivery_time: number
  created_at: string
  last_active_at: string
  current_orders: string[]
  
  // Compatibilidade com versões antigas (será removido gradualmente)
  vehicleType?: "motorcycle" | "bicycle" | "car"
  vehiclePlate?: string
  currentLocation?: string
  totalDeliveries?: number
  averageRating?: number
  averageDeliveryTime?: number
  createdAt?: string
  lastActiveAt?: string
  currentOrders?: string[]
}
