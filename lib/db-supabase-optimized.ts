import { getSupabaseServerClient } from './supabase'

// Tipos compartilhados
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

export interface Product {
  id: string // UUID no Supabase
  name: string
  description?: string
  price: number
  category_id?: string // UUID no Supabase
  image?: string | null
  active: boolean
  has_sizes?: boolean
  has_toppings?: boolean
  preparation_time?: number
  sort_order?: number | null
  created_at?: string
  updated_at?: string
  category_name?: string
}

export interface OrderItemInput {
  product_id: string | null // UUID no Supabase
  name: string
  quantity: number
  unit_price: number | null
  total_price: number | null
  size?: string | null
  toppings?: any
  special_instructions?: string | null
  half_and_half?: any
}

// Função otimizada para buscar pedidos com joins eficientes
export async function listOrdersOptimized(params: { 
  status?: string | null
  userId?: string | null
  limit?: number | null
  offset?: number | null 
}) {
  const supabase = getSupabaseServerClient()
  
  // Query otimizada com joins e seleção específica de campos
  let query = supabase
    .from('orders')
    .select(`
      id,
      user_id,
      customer_name,
      delivery_phone,
      delivery_address,
      total,
      subtotal,
      delivery_fee,
      discount,
      status,
      payment_method,
      payment_status,
      delivery_instructions,
      estimated_delivery_time,
      created_at,
      updated_at,
      profiles:profiles!orders_user_id_fkey(
        full_name,
        email,
        phone
      ),
      order_items(
        id,
        product_id,
        name,
        quantity,
        unit_price,
        total_price,
        size,
        toppings,
        special_instructions,
        half_and_half
      )
    `, { count: 'exact' })
    .is('archived_at', null)

  // Aplicar filtros
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }
  if (params.userId) {
    query = query.eq('user_id', params.userId)
  }

  // Aplicar paginação
  if (params.limit && params.offset !== undefined && params.offset !== null) {
    query = query.range(params.offset, params.offset + params.limit - 1)
  } else if (params.limit) {
    query = query.limit(params.limit)
  }

  // Ordenação
  query = query.order('created_at', { ascending: false })

  const { data, error, count } = await query
  if (error) throw error

  const orders = (data || []).map((o: any) => ({
    ...o,
    order_items: o.order_items || [],
    items: o.order_items || [],
  }))

  // Calcular estatísticas de forma eficiente
  const statistics = {
    total: count || 0,
    received: orders.filter((o: any) => o.status === 'RECEIVED').length,
    preparing: orders.filter((o: any) => o.status === 'PREPARING').length,
    onTheWay: orders.filter((o: any) => o.status === 'ON_THE_WAY').length,
    delivered: orders.filter((o: any) => o.status === 'DELIVERED').length,
    cancelled: orders.filter((o: any) => o.status === 'CANCELLED').length,
    totalRevenue: orders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0),
  }

  return { orders, statistics }
}

// Função otimizada para listar clientes com joins eficientes
export async function listCustomersOptimized() {
  const supabase = getSupabaseServerClient()
  
  // Buscar todos os clientes com endereços em uma única query
  const { data: customersWithAddresses, error: customersError } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      phone,
      customer_code,
      created_at,
      updated_at,
      role,
      customer_addresses(
        street,
        number,
        neighborhood,
        city,
        state,
        complement,
        zip_code,
        label,
        is_default,
        created_at
      )
    `)
    .eq('role', 'customer')
    .order('created_at', { ascending: false })

  if (customersError) throw customersError

  // Buscar todos os pedidos dos clientes em uma única query
  const customerIds = (customersWithAddresses || []).map(c => c.id)
  const { data: allOrders, error: ordersError } = await supabase
    .from('orders')
    .select('user_id, total, created_at')
    .in('user_id', customerIds)

  if (ordersError) throw ordersError

  // Agrupar pedidos por cliente
  const ordersByCustomer = (allOrders || []).reduce((acc: any, order: any) => {
    if (!acc[order.user_id]) {
      acc[order.user_id] = []
    }
    acc[order.user_id].push(order)
    return acc
  }, {})

  // Processar dados dos clientes
  const result = (customersWithAddresses || []).map((c: any) => {
    // Pegar o endereço principal
    const addresses = c.customer_addresses || []
    const primaryAddress = addresses.find((addr: any) => addr.is_default) || 
                          addresses.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

    // Calcular estatísticas dos pedidos
    const customerOrders = ordersByCustomer[c.id] || []
    const totalOrders = customerOrders.length
    const totalSpent = customerOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0)
    const lastOrderAt = customerOrders.length > 0 
      ? customerOrders.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
      : null

    // Montar endereço completo
    let fullAddress = 'Endereço não cadastrado'
    if (primaryAddress) {
      const parts = [
        primaryAddress.street,
        primaryAddress.number,
        primaryAddress.neighborhood,
        primaryAddress.city,
        primaryAddress.state
      ].filter(Boolean)
      
      if (parts.length > 0) {
        fullAddress = parts.join(', ')
      }
    }

    // Calcular status do cliente
    const now = new Date()
    const createdAt = new Date(c.created_at)
    const lastOrderDate = lastOrderAt ? new Date(lastOrderAt) : createdAt
    const lastActivityDate = lastOrderDate > createdAt ? lastOrderDate : createdAt
    const daysSinceLastActivity = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))
    
    let status = 'inactive'
    if (totalOrders >= 20 || totalSpent >= 500) status = 'vip'
    else if (totalOrders >= 5 || totalSpent >= 100) status = 'regular'
    else if (daysSinceLastActivity <= 30) status = 'active'
    else if (daysSinceLastActivity <= 90) status = 'inactive'
    else status = 'churned'

    return {
      id: c.id,
      customer_code: c.customer_code,
      name: c.full_name || 'Nome não informado',
      email: c.email || 'Email não informado',
      phone: c.phone || 'Telefone não informado',
      address: fullAddress,
      complement: primaryAddress?.complement || '',
      street: primaryAddress?.street || '',
      number: primaryAddress?.number || '',
      neighborhood: primaryAddress?.neighborhood || '',
      city: primaryAddress?.city || '',
      state: primaryAddress?.state || '',
      zip_code: primaryAddress?.zip_code || '',
      createdAt: c.created_at,
      lastOrderAt,
      totalOrders,
      totalSpent,
      status,
      favoriteItems: [],
    }
  })

  return result
}

// Função otimizada para buscar produtos com categorias
export async function getProductsActiveOptimized(): Promise<Product[]> {
  const supabase = getSupabaseServerClient()
  
  // Buscar produtos com informações da categoria em uma única query
  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      description,
      price,
      category_id,
      image,
      active,
      sizes,
      toppings,
      preparation_time,
      sort_order,
      created_at,
      updated_at,
      categories(
        name
      )
    `)
    .eq('active', true)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Erro ao buscar produtos:', error)
    throw error
  }

  return (data || []).map((p: any, index: number) => ({
    id: p.id,
    name: p.name || '',
    description: p.description || '',
    price: p.price,
    category_id: p.category_id,
    image: p.image || null,
    active: !!p.active,
    has_sizes: !!(p.sizes && Array.isArray(p.sizes) && p.sizes.length > 0),
    has_toppings: !!(p.toppings && Array.isArray(p.toppings) && p.toppings.length > 0),
    preparation_time: p.preparation_time || 15,
    sort_order: p.sort_order || (index + 1),
    created_at: p.created_at,
    updated_at: p.updated_at,
    category_name: p.categories?.name || '',
  }))
}

// Função otimizada para buscar categorias
export async function getCategoriesOptimized(includeInactive = false) {
  const supabase = getSupabaseServerClient()
  
  let query = supabase
    .from('categories')
    .select('id, name, description, image, sort_order, active, created_at, updated_at')
  
  if (!includeInactive) {
    query = query.eq('active', true)
  }
  
  const { data, error } = await query
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true })
  
  if (error) throw error
  return data || []
}

// Função otimizada para busca de clientes com filtros eficientes
export async function searchCustomersOptimized(params: {
  searchTerm?: string
  codeSearch?: string
  limit?: number
}) {
  const { searchTerm = '', codeSearch = '', limit = 10 } = params
  
  if (!searchTerm && !codeSearch) {
    return []
  }

  const supabase = getSupabaseServerClient()
  
  // Query otimizada com filtros no banco de dados
  let query = supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      phone,
      email,
      customer_code,
      created_at,
      customer_addresses(
        street,
        number,
        neighborhood,
        city,
        state,
        complement,
        zip_code,
        is_default,
        created_at
      )
    `)
    .eq('role', 'customer')

  // Aplicar filtros de busca
  if (codeSearch) {
    query = query.ilike('customer_code', `%${codeSearch}%`)
  } else if (searchTerm) {
    // Buscar por nome, email ou telefone
    const phoneNumbers = searchTerm.replace(/\D/g, '')
    query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${phoneNumbers}%,customer_code.ilike.%${searchTerm}%`)
  }

  query = query
    .order('created_at', { ascending: false })
    .limit(limit)

  const { data: profiles, error } = await query
  if (error) throw error

  // Buscar estatísticas de pedidos para os clientes encontrados
  const customerIds = (profiles || []).map(p => p.id)
  const { data: orders } = await supabase
    .from('orders')
    .select('user_id, total, created_at')
    .in('user_id', customerIds)

  // Agrupar pedidos por cliente
  const ordersByCustomer = (orders || []).reduce((acc: any, order: any) => {
    if (!acc[order.user_id]) {
      acc[order.user_id] = []
    }
    acc[order.user_id].push(order)
    return acc
  }, {})

  // Processar resultados
  const matchingCustomers = (profiles || []).map((profile: any) => {
    // Pegar endereço principal
    const addresses = profile.customer_addresses || []
    const address = addresses.find((addr: any) => addr.is_default) || 
                   addresses.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    
    // Montar endereço completo
    let fullAddress = 'Endereço não cadastrado'
    if (address) {
      const parts = [
        address.street,
        address.number,
        address.neighborhood,
        address.city,
        address.state
      ].filter(Boolean)
      
      if (parts.length > 0) {
        fullAddress = parts.join(', ')
      }
    }

    // Calcular estatísticas
    const customerOrders = ordersByCustomer[profile.id] || []
    const totalOrders = customerOrders.length
    const totalSpent = customerOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0)

    return {
      id: profile.id,
      customer_code: profile.customer_code,
      name: profile.full_name || 'Nome não informado',
      email: profile.email || 'Email não informado',
      phone: profile.phone || 'Telefone não informado',
      address: fullAddress,
      complement: address?.complement || '',
      street: address?.street || '',
      number: address?.number || '',
      neighborhood: address?.neighborhood || '',
      city: address?.city || '',
      state: address?.state || '',
      zip_code: address?.zip_code || '',
      totalOrders,
      totalSpent,
      createdAt: profile.created_at,
    }
  })

  return matchingCustomers
}

// Re-exportar funções originais que não precisam de otimização
export {
  getUserByEmail,
  createUserProfile
} from './db/users'

export {
  createCategory,
  updateCategorySortOrders
} from './db/categories'

export {
  createProduct
} from './db/products'

export {
  createOrder,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus
} from './db/orders'

export {
  getCustomerById,
  updateCustomerAndAddress,
  deleteCustomer
} from './db/customers'

export {
  listAddresses,
  createAddress,
  getAddressById,
  updateAddress,
  deleteAddress,
  saveCustomerAddress
} from './db/addresses'

export {
  getAdminSettings,
  updateAdminSetting
} from './db/settings'