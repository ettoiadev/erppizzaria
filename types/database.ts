/**
 * Interfaces TypeScript para entidades do banco de dados
 * Alinhadas com o esquema do PostgreSQL
 */

// Interface para configurações administrativas
export interface AdminSetting {
  id: string // UUID
  setting_key: string // Campo obrigatório
  setting_value: any // JSONB - Campo obrigatório
  setting_type?: string // Campo opcional
  created_at?: string
  updated_at?: string
}

// Interface para cupons de usuário
export interface UserCoupon {
  id: string // UUID
  user_id?: string // UUID - Campo opcional
  coupon_id?: string // UUID - Campo opcional
  used_at?: string // timestamp - Campo opcional
  created_at?: string
  updated_at?: string
}

// Interface para motoristas (drivers) - complementando as existentes
export interface Driver {
  id: string // UUID
  name: string // Campo obrigatório
  email?: string // Campo opcional
  phone?: string // Campo opcional
  vehicle_type?: string // Campo opcional
  vehicle_plate?: string // Campo opcional
  status?: string // Campo opcional com default 'available'
  current_location?: any // JSONB - Campo opcional
  total_deliveries?: number // Campo opcional com default 0
  average_rating?: number // Campo opcional
  average_delivery_time?: number // Campo opcional
  last_active_at?: string // timestamp - Campo opcional
  active?: boolean // Campo opcional com default true
  created_at?: string
  updated_at?: string
}

// Interface para endereços de clientes
export interface CustomerAddress {
  id: string // UUID
  user_id?: string // UUID - Campo opcional
  name?: string // Campo opcional
  street?: string // Campo opcional
  number?: string // Campo opcional
  complement?: string // Campo opcional
  neighborhood?: string // Campo opcional
  city?: string // Campo opcional
  state?: string // Campo opcional
  zip_code?: string // Campo opcional
  is_default?: boolean // Campo opcional com default false
  created_at?: string
  updated_at?: string
}

// Interface para categorias
export interface Category {
  id: string // UUID
  name: string // Campo obrigatório
  description?: string // Campo opcional
  image?: string // Campo opcional
  active?: boolean // Campo opcional com default true
  sort_order?: number // Campo opcional
  created_at?: string
  updated_at?: string
}

// Interface para produtos
export interface Product {
  id: string // UUID
  category_id?: string // UUID - Campo opcional
  name: string // Campo obrigatório
  description?: string // Campo opcional
  price: number // Campo obrigatório com default 0
  image?: string // Campo opcional
  sizes?: any // JSONB - Campo opcional
  toppings?: any // JSONB - Campo opcional
  available?: boolean // Campo opcional com default true
  show_image?: boolean // Campo opcional com default true
  active?: boolean // Campo opcional com default true
  product_number?: number // Campo opcional
  created_at?: string
  updated_at?: string
}

// Interface para perfis de usuário
export interface UserProfile {
  id: string // UUID
  email: string // Campo obrigatório
  password_hash?: string // Campo opcional
  full_name?: string // Campo opcional
  phone?: string // Campo opcional
  role: string // Campo obrigatório com default 'customer'
  customer_code?: string // Campo opcional
  active?: boolean // Campo opcional com default true
  created_at?: string
  updated_at?: string
}

// Interface para pedidos
export interface Order {
  id: string // UUID
  order_number?: number // Campo opcional
  user_id?: string // UUID - Campo opcional
  driver_id?: string // UUID - Campo opcional
  customer_code?: string // Campo opcional
  customer_name?: string // Campo opcional
  customer_phone?: string // Campo opcional
  customer_address?: string // Campo opcional
  delivery_address?: string // Campo opcional
  subtotal?: number // Campo opcional com default 0
  delivery_fee?: number // Campo opcional com default 0
  discount?: number // Campo opcional com default 0
  total?: number // Campo opcional com default 0
  status: string // Campo obrigatório com default 'PENDING'
  payment_method?: string // Campo opcional
  payment_status?: string // Campo opcional
  delivery_type?: string // Campo opcional
  notes?: string // Campo opcional
  archived_at?: string // timestamp - Campo opcional
  delivery_phone?: string // Campo opcional
  delivery_instructions?: string // Campo opcional
  estimated_delivery_time?: string // timestamp - Campo opcional
  created_at?: string
  updated_at?: string
}

// Interface para itens de pedido
export interface OrderItem {
  id: string // UUID
  order_id?: string // UUID - Campo opcional
  product_id?: string // UUID - Campo opcional
  name?: string // Campo opcional
  quantity: number // Campo obrigatório com default 1
  unit_price?: number // Campo opcional com default 0
  total_price?: number // Campo opcional com default 0
  size?: string // Campo opcional
  toppings?: any // JSONB - Campo opcional
  special_instructions?: string // Campo opcional
  half_and_half?: any // JSONB - Campo opcional
  created_at?: string
  updated_at?: string
}

// Tipos já exportados como interfaces acima