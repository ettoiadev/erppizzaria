import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { supabaseAdmin } from './supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Interface para tipagem de usuário
export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: 'customer' | 'admin' | 'kitchen' | 'delivery'
  password_hash?: string
  phone?: string
  created_at?: string
  updated_at?: string
}

// Interface para produtos
export interface Product {
  id: number
  name: string
  description?: string
  price: number
  category_id?: number
  image?: string
  available: boolean
  show_image: boolean
  sizes?: any
  toppings?: any
  active: boolean
  product_number?: number
  category_name?: string
}

// Interface para pedidos
export interface Order {
  id: number
  user_id?: string
  customer_name?: string
  customer_phone?: string
  customer_address?: string
  total: number
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'ON_THE_WAY' | 'DELIVERED' | 'CANCELLED'
  payment_method: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX'
  delivery_type: 'delivery' | 'pickup'
  driver_id?: number
  notes?: string
  created_at?: string
  updated_at?: string
}

// =============================================
// FUNÇÕES DE AUTENTICAÇÃO E USUÁRIOS
// =============================================

export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  try {
    if (!email?.trim()) {
      console.log('getUserByEmail: Email vazio fornecido')
      return null
    }

    console.log('🔍 Buscando usuário:', email)
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, password_hash, phone')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('👤 Usuário não encontrado:', email)
        return null
      }
      throw error
    }

    console.log('✅ Usuário encontrado:', {
      id: data.id,
      email: data.email,
      role: data.role,
      hasPassword: !!data.password_hash
    })

    return data
  } catch (error: any) {
    console.error('❌ Erro ao buscar usuário:', error.message)
    return null
  }
}

export async function createUserProfile(userData: {
  email: string
  full_name: string
  role?: string
  password_hash: string
  phone?: string
}): Promise<UserProfile | null> {
  try {
    console.log('👤 Criando usuário:', userData.email)
    
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        email: userData.email.toLowerCase(),
        full_name: userData.full_name,
        role: userData.role || 'customer',
        password_hash: userData.password_hash,
        phone: userData.phone
      })
      .select()
      .single()

    if (error) throw error

    console.log('✅ Usuário criado:', data.email)
    return data
  } catch (error: any) {
    console.error('❌ Erro ao criar usuário:', error.message)
    return null
  }
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)

    if (error) throw error
    
    console.log('✅ Perfil atualizado:', userId)
    return true
  } catch (error: any) {
    console.error('❌ Erro ao atualizar perfil:', error.message)
    return false
  }
}

// =============================================
// FUNÇÕES DE PRODUTOS
// =============================================

export async function getProducts(includeInactive = false): Promise<Product[]> {
  try {
    let query = supabase
      .from('products')
      .select(`
        id, name, description, price, category_id, image, 
        available, show_image, sizes, toppings, active, product_number,
        categories!inner(name)
      `)
      .order('product_number', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })

    if (!includeInactive) {
      query = query.eq('active', true)
    }

    const { data, error } = await query

    if (error) throw error

    // Transformar dados para incluir category_name
    const products = data?.map(product => ({
      ...product,
      category_name: product.categories?.name
    })) || []

    console.log(`📦 ${products.length} produtos carregados`)
    return products
  } catch (error: any) {
    console.error('❌ Erro ao carregar produtos:', error.message)
    return []
  }
}

export async function getProductById(id: number): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *, 
        categories(name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return {
      ...data,
      category_name: data.categories?.name
    }
  } catch (error: any) {
    console.error('❌ Erro ao carregar produto:', error.message)
    return null
  }
}

export async function createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single()

    if (error) throw error
    
    console.log('✅ Produto criado:', data.name)
    return data
  } catch (error: any) {
    console.error('❌ Erro ao criar produto:', error.message)
    return null
  }
}

export async function updateProduct(id: number, updates: Partial<Product>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)

    if (error) throw error
    
    console.log('✅ Produto atualizado:', id)
    return true
  } catch (error: any) {
    console.error('❌ Erro ao atualizar produto:', error.message)
    return false
  }
}

// =============================================
// FUNÇÕES DE CATEGORIAS
// =============================================

export async function getCategories(includeInactive = false) {
  try {
    let query = supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (!includeInactive) {
      query = query.eq('active', true)
    }

    const { data, error } = await query

    if (error) throw error

    console.log(`📂 ${data?.length || 0} categorias carregadas`)
    return data || []
  } catch (error: any) {
    console.error('❌ Erro ao carregar categorias:', error.message)
    return []
  }
}

// =============================================
// FUNÇÕES DE PEDIDOS
// =============================================

export async function getOrders(filters: {
  status?: string
  userId?: string
  limit?: number
  offset?: number
} = {}): Promise<{ orders: any[], total: number }> {
  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        profiles(full_name, email, phone),
        order_items(
          id, name, price, quantity, size, toppings, special_instructions,
          products(name, image)
        )
      `)
      .order('created_at', { ascending: false })

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, error, count } = await query

    if (error) throw error

    console.log(`📋 ${data?.length || 0} pedidos carregados`)
    return {
      orders: data || [],
      total: count || 0
    }
  } catch (error: any) {
    console.error('❌ Erro ao carregar pedidos:', error.message)
    return { orders: [], total: 0 }
  }
}

export async function createOrder(orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>, items: any[]): Promise<Order | null> {
  try {
    console.log('📋 Criando pedido...')
    
    // Criar o pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single()

    if (orderError) throw orderError

    // Criar os itens do pedido
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      size: item.size,
      toppings: item.toppings,
      special_instructions: item.special_instructions,
      half_and_half: item.half_and_half
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    console.log('✅ Pedido criado:', order.id)
    return order
  } catch (error: any) {
    console.error('❌ Erro ao criar pedido:', error.message)
    return null
  }
}

export async function updateOrderStatus(orderId: number, status: Order['status']): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    if (error) throw error
    
    console.log('✅ Status do pedido atualizado:', { orderId, status })
    return true
  } catch (error: any) {
    console.error('❌ Erro ao atualizar status:', error.message)
    return false
  }
}

// =============================================
// FUNÇÕES DE CONFIGURAÇÕES
// =============================================

export async function getAdminSettings(): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('key, value')

    if (error) throw error

    const settings: Record<string, string> = {}
    data?.forEach(setting => {
      settings[setting.key] = setting.value
    })

    return settings
  } catch (error: any) {
    console.error('❌ Erro ao carregar configurações:', error.message)
    return {}
  }
}

export async function updateAdminSetting(key: string, value: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('admin_settings')
      .upsert({ key, value })

    if (error) throw error
    
    console.log('✅ Configuração atualizada:', { key, value })
    return true
  } catch (error: any) {
    console.error('❌ Erro ao atualizar configuração:', error.message)
    return false
  }
}

// =============================================
// FUNÇÕES DE TESTE E UTILITÁRIOS
// =============================================

export async function testConnection(): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (error) throw error

    return {
      success: true,
      message: 'Conexão com Supabase funcionando perfeitamente'
    }
  } catch (error: any) {
    return {
      success: false,
      message: 'Erro na conexão com Supabase',
      error: error.message
    }
  }
}

// Compatibilidade com lib/db.ts existente
export async function query(text: string, params?: any[]) {
  console.warn('⚠️ Usando query() legacy - considere migrar para funções específicas do Supabase')
  
  // Manter algumas queries básicas para compatibilidade
  if (text.includes('SELECT') && text.includes('profiles') && text.includes('email')) {
    const email = params?.[0]
    if (email) {
      const user = await getUserByEmail(email)
      return {
        rows: user ? [user] : [],
        rowCount: user ? 1 : 0
      }
    }
  }
  
  throw new Error('Query não suportada - use funções específicas do Supabase')
}

export async function getClient() {
  return {
    query: async (text: string, params?: any[]) => await query(text, params),
    release: () => {}
  }
}

// Exportar configurações
export const getSupabaseConfig = () => ({
  url: supabaseUrl,
  anonKey: supabaseAnonKey
}) 

export async function ensureAdminUser() {
  const email = 'admin@williamdiskpizza.com'
  const password = 'admin123'
  const nome = 'Administrador'

  // Verificar se já existe
  const { data: existing, error: findError } = await supabaseAdmin.auth.admin.listUsers()
  if (findError) throw findError
  const found = existing?.users?.find(u => u.email === email)
  if (found) return found

  // Criar usuário
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nome }
  })
  if (error) throw error
  return data?.user
} 