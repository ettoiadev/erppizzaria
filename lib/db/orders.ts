/**
 * Operações de banco de dados relacionadas a pedidos
 */

import { getSupabaseServerClient } from '../supabase'

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

/**
 * Lista pedidos com filtros
 */
export async function listOrders(params: { 
  status?: string | null
  userId?: string | null
  limit?: number | null
  offset?: number | null 
}) {
  const supabase = getSupabaseServerClient()
  
  let query = supabase
    .from('orders')
    .select('*, profiles:profiles!orders_user_id_fkey(full_name, email, phone), order_items(order_id, id, product_id, name, quantity, unit_price, total_price, size, toppings, special_instructions, half_and_half))', { count: 'exact' })
    .is('archived_at', null)

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }
  if (params.userId) {
    query = query.eq('user_id', params.userId)
  }
  if (params.limit) {
    query = query.limit(params.limit)
  }
  if (params.offset) {
    query = query.range(params.offset, (params.offset + (params.limit || 0)) - 1)
  }

  query = query.order('created_at', { ascending: false })

  const { data, error, count } = await query
  if (error) throw error

  // Estatísticas básicas
  const total = count || 0
  const statistics = {
    total,
    received: (data || []).filter((o: any) => o.status === 'RECEIVED').length,
    preparing: (data || []).filter((o: any) => o.status === 'PREPARING').length,
    onTheWay: (data || []).filter((o: any) => o.status === 'ON_THE_WAY').length,
    delivered: (data || []).filter((o: any) => o.status === 'DELIVERED').length,
    cancelled: (data || []).filter((o: any) => o.status === 'CANCELLED').length,
    totalRevenue: (data || []).reduce((sum: number, o: any) => sum + Number(o.total || 0), 0),
  }

  const orders = (data || []).map((o: any) => ({
    ...o,
    order_items: o.order_items || [],
    items: o.order_items || [],
  }))

  return { orders, statistics }
}

/**
 * Cria novo pedido
 */
export async function createOrder(input: {
  user_id: string
  customer_name: string
  customer_phone: string
  customer_address: string
  total: number
  subtotal?: number
  delivery_fee?: number
  discount?: number
  status: string
  payment_method: string
  payment_status?: string
  notes?: string | null
  estimated_delivery_time?: string | null
  items: OrderItemInput[]
}) {
  const supabase = getSupabaseServerClient()

  const orderPayload = {
    user_id: input.user_id,
    customer_name: input.customer_name,
    delivery_phone: input.customer_phone,
    delivery_address: input.customer_address,
    total: input.total,
    subtotal: input.subtotal ?? 0,
    delivery_fee: input.delivery_fee ?? 0,
    discount: input.discount ?? 0,
    status: input.status || 'RECEIVED',
    payment_method: input.payment_method,
    payment_status: input.payment_status || 'PENDING',
    delivery_instructions: input.notes ?? null,
    estimated_delivery_time: input.estimated_delivery_time ?? null,
  }

  const { data: order, error } = await supabase
    .from('orders')
    .insert(orderPayload)
    .select('*')
    .single()
  if (error) throw error

  if (input.items?.length) {
    const itemsPayload = input.items.map((it) => ({
      order_id: order.id,
      product_id: it.product_id,
      name: it.name,
      quantity: it.quantity,
      unit_price: it.unit_price,
      total_price: it.total_price,
      size: it.size ?? null,
      toppings: it.toppings ?? null,
      special_instructions: it.special_instructions ?? null,
      half_and_half: it.half_and_half ?? null,
    }))
    const { error: itemsErr } = await supabase.from('order_items').insert(itemsPayload)
    if (itemsErr) throw itemsErr
  }

  return order
}

/**
 * Busca pedido por ID
 */
export async function getOrderById(id: string) {
  const supabase = getSupabaseServerClient()
  
  const { data: order, error } = await supabase
    .from('orders')
    .select('*, profiles:profiles!orders_user_id_fkey(full_name, email, phone)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!order) return null

  const { data: items, error: itemsErr } = await supabase
    .from('order_items')
    .select('*, products:product_id(name, description, image_url)')
    .eq('order_id', order.id)
    .order('created_at', { ascending: true })
  if (itemsErr) throw itemsErr

  const processedItems = (items || []).map((item: any) => ({
    id: item.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.total_price,
    price: item.unit_price,
    size: item.size,
    toppings: item.toppings,
    special_instructions: item.special_instructions,
    half_and_half: item.half_and_half,
    name: item.products?.name || item.name || 'Produto',
    description: item.products?.description,
    image: item.products?.image_url,
  }))

  return {
    ...order,
    full_name: order.profiles?.full_name || null,
    phone: order.profiles?.phone || null,
    order_items: processedItems,
    items: processedItems,
    customer: {
      name: order.profiles?.full_name || 'Cliente',
      phone: order.profiles?.phone || order.customer_phone,
      address: order.customer_address,
    },
  }
}

/**
 * Atualiza status do pedido
 */
export async function updateOrderStatus(id: string, status: string, notes?: string | null) {
  const supabase = getSupabaseServerClient()
  
  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error

  if (notes) {
    await supabase
      .from('order_status_history')
      .insert({ 
        order_id: id, 
        driver_id: null, 
        old_status: null, 
        new_status: status, 
        notes, 
        created_at: new Date().toISOString() 
      })
  }
  
  return data
}

/**
 * Atualiza status de pagamento
 */
export async function updatePaymentStatus(id: string, paymentStatus: string) {
  const supabase = getSupabaseServerClient()
  
  const { data, error } = await supabase
    .from('orders')
    .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data
}