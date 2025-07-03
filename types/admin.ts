export interface Customer {
  id: string
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
  createdAt: string
  lastOrderAt?: string
  totalOrders: number
  totalSpent: number
  status: "active" | "inactive" | "vip"
  favoriteItems: string[]
}

export interface CustomerOrder {
  id: string
  customerId: string
  date: string
  status: string
  total: number
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  paymentMethod: string
}

export interface DeliveryPerson {
  id: string
  name: string
  email: string
  phone: string
  vehicleType: "motorcycle" | "bicycle" | "car"
  vehiclePlate: string
  status: "available" | "busy" | "offline"
  currentLocation: string
  totalDeliveries: number
  averageRating: number
  averageDeliveryTime: number
  createdAt: string
  lastActiveAt: string
  currentOrders: string[]
}
