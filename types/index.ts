export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  categoryId: string
  available: boolean
  showImage?: boolean
  productNumber?: number
  sizes?: ProductSize[]
  toppings?: ProductTopping[]
}

export interface ProductSize {
  name: string
  price: number
}

export interface ProductTopping {
  name: string
  price: number
}

export interface Category {
  id: string
  name: string
  description: string
  image: string
  sort_order?: number
  active?: boolean
}

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  size?: string
  toppings?: string[]
  notes?: string
  isHalfAndHalf?: boolean
  halfAndHalf?: {
    firstHalf: {
      productId: string
      productName: string
      toppings?: string[]
    }
    secondHalf: {
      productId: string
      productName: string
      toppings?: string[]
    }
  }
}

export interface Order {
  id: string
  status: "RECEIVED" | "PREPARING" | "ON_THE_WAY" | "DELIVERED" | "CANCELLED"
  total: number
  items: CartItem[]
  customer: {
    name: string
    phone: string
    address: string
  }
  paymentMethod: string
  createdAt: string
  estimatedDelivery?: string
}

export interface User {
  id: string
  name: string
  email: string
  role: "CUSTOMER" | "ADMIN" | "KITCHEN" | "DELIVERY"
}
