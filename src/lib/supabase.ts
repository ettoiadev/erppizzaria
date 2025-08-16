import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Tipos básicos
export interface User {
  id: string
  email: string
  full_name: string
  role: 'customer' | 'admin'
  phone?: string
  created_at: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  category_id: string
  image_url?: string
  active: boolean
  created_at: string
}

export interface Category {
  id: string
  name: string
  description?: string
  active: boolean
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  total: number
  items: OrderItem[]
  delivery_address?: string
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
  notes?: string
}