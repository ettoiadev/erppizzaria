export interface Product {
  id: string
  name: string
  description: string
  price: number
  image?: string
  showImage?: boolean
  available: boolean
  productNumber?: string
  categoryId?: string
  category_name?: string
  sizes?: { name: string; price: number }[]
  toppings?: { name: string; price: number }[]
}

export interface Category {
  id: string
  name: string
  description?: string
  image?: string
  sort_order?: number
  active: boolean
}

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  size?: string
  toppings?: string[]
  notes?: string
  isHalfAndHalf?: boolean
  halfAndHalf?: {
    firstHalf: {
      productId: string
      productName: string
      toppings: string[]
    }
    secondHalf: {
      productId: string
      productName: string
      toppings: string[]
    }
  }
}

export interface Customer {
  id: string
  name: string
  phone: string
  email: string
  customer_code?: string
  primaryAddress?: {
    id: string
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zip_code: string
    label: string
    is_default: boolean | null
  } | null
  totalOrders: number
  createdAt: string
}

export interface CustomerAddress {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zip_code: string
}

export interface ViaCEPResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

export type OrderType = 'balcao' | 'telefone'
export type PaymentMethod = 'PIX' | 'Dinheiro' | 'Cartão de Crédito' | 'Cartão de Débito'