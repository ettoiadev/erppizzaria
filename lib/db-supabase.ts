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
  id: number
  name: string
  description?: string
  price: number
  category_id?: number
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
  product_id: number | null
  name: string
  quantity: number
  unit_price: number | null
  total_price: number | null
  size?: string | null
  toppings?: any
  special_instructions?: string | null
  half_and_half?: any
}

export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, password_hash, phone, created_at, updated_at')
    .eq('email', email.toLowerCase().trim())
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data as UserProfile | null
}

export async function createUserProfile(userData: {
  email: string
  full_name: string
  role?: string
  password_hash: string
  phone?: string
}): Promise<UserProfile | null> {
  const supabase = getSupabaseServerClient()
  const insert = {
    email: userData.email.toLowerCase(),
    full_name: userData.full_name,
    role: userData.role || 'customer',
    password_hash: userData.password_hash,
    phone: userData.phone ?? null,
  }
  const { data, error } = await supabase
    .from('profiles')
    .insert(insert)
    .select('id, email, full_name, role, password_hash, phone, created_at, updated_at')
    .single()

  if (error) throw error
  return data as UserProfile
}

export async function getCategories(includeInactive = false) {
  const supabase = getSupabaseServerClient()
  let query = supabase.from('categories').select('*')
  if (!includeInactive) {
    query = query.eq('active', true)
  }
  const { data, error } = await query.order('sort_order', { ascending: true, nullsFirst: false })
  if (error) throw error
  return data || []
}

export async function createCategory(input: { name: string; description?: string | null; image?: string | null; sort_order?: number | null }) {
  const supabase = getSupabaseServerClient()
  const payload = {
    name: input.name.trim(),
    description: input.description ?? null,
    image: input.image ?? null,
    sort_order: input.sort_order ?? 0,
    active: true,
  }
  const { data, error } = await supabase
    .from('categories')
    .insert(payload)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateCategorySortOrders(categoryOrders: Array<{ id: number; sort_order: number }>) {
  const supabase = getSupabaseServerClient()
  // Atualiza em lote iterativamente (não há upsert múltiplo por chave sem mergeTo em PostgREST)
  for (const item of categoryOrders) {
    const { error } = await supabase
      .from('categories')
      .update({ sort_order: item.sort_order, updated_at: new Date().toISOString() })
      .eq('id', item.id)
    if (error) throw error
  }
  return true
}

export async function getProductsActive(): Promise<Product[]> {
  const supabase = getSupabaseServerClient()
  // Buscar produtos e nome da categoria com select relacionado
  const { data, error } = await supabase
    .from('products')
    .select('id, name, description, price, category_id, image_url, active, has_sizes, has_toppings, preparation_time, sort_order, created_at, updated_at, categories:name=category_id(name)')
    .eq('active', true)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })
  if (error) throw error

  return (data || []).map((p: any, index: number) => ({
    id: p.id,
    name: p.name || '',
    description: p.description || '',
    price: p.price,
    category_id: p.category_id,
    image: p.image_url || null,
    active: !!p.active,
    has_sizes: !!p.has_sizes,
    has_toppings: !!p.has_toppings,
    preparation_time: p.preparation_time,
    sort_order: p.sort_order ?? index + 1,
    created_at: p.created_at,
    updated_at: p.updated_at,
    category_name: p.categories?.name || '',
  }))
}

export async function createProduct(input: {
  name: string
  description?: string
  price: number
  category_id: number
  image?: string | null
  available?: boolean
  sizes?: any[]
  toppings?: any[]
}) {
  const supabase = getSupabaseServerClient()
  const payload = {
    name: input.name.trim(),
    description: input.description?.trim() || '',
    price: input.price,
    category_id: input.category_id,
    image_url: input.image || null,
    active: input.available !== false,
    has_sizes: Array.isArray(input.sizes) && input.sizes.length > 0,
    has_toppings: Array.isArray(input.toppings) && input.toppings.length > 0,
    preparation_time: 30,
  }
  const { data, error } = await supabase
    .from('products')
    .insert(payload)
    .select('id, name, description, price, category_id, image_url, active, has_sizes, has_toppings, preparation_time, sort_order, created_at, updated_at')
    .single()
  if (error) throw error

  // Buscar nome da categoria
  const { data: cat, error: catErr } = await supabase
    .from('categories')
    .select('name')
    .eq('id', data.category_id)
    .maybeSingle()
  if (catErr) throw catErr

  return {
    ...data,
    image: data.image_url,
    categoryId: data.category_id,
    category_name: cat?.name || '',
    available: !!data.active,
    showImage: true,
    productNumber: data.sort_order || 0,
    sizes: input.sizes || [],
    toppings: input.toppings || [],
  }
}

export async function listOrders(params: { status?: string | null; userId?: string | null; limit?: number | null; offset?: number | null }) {
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
      .insert({ order_id: id, driver_id: null, old_status: null, new_status: status, notes, created_at: new Date().toISOString() })
  }
  return data
}

export async function listCustomers() {
  const supabase = getSupabaseServerClient()
  const { data: customers, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, phone, customer_code, created_at, updated_at, role')
    .eq('role', 'customer')
    .order('created_at', { ascending: false })
  if (error) throw error

  // Endereço principal por usuário (1 query por usuário para manter compat.)
  const result = [] as any[]
  for (const c of customers || []) {
    const { data: addr } = await supabase
      .from('customer_addresses')
      .select('street, number, neighborhood, city, state, complement, zip_code, label, is_default, created_at')
      .eq('user_id', c.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: orders } = await supabase
      .from('orders')
      .select('total, created_at')
      .eq('user_id', c.id)

    const totalOrders = (orders || []).length
    const totalSpent = (orders || []).reduce((sum: number, o: any) => sum + Number(o.total || 0), 0)
    const lastOrderAt = (orders || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.created_at || null

    const parts = [addr?.street, addr?.number, addr?.neighborhood, addr?.city, addr?.state].filter(Boolean)
    const fullAddress = parts.length > 0 ? parts.join(', ') : 'Endereço não cadastrado'

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

    result.push({
      id: c.id,
      customer_code: c.customer_code,
      name: c.full_name || 'Nome não informado',
      email: c.email || 'Email não informado',
      phone: c.phone || 'Telefone não informado',
      address: fullAddress,
      complement: addr?.complement || '',
      street: addr?.street || '',
      number: addr?.number || '',
      neighborhood: addr?.neighborhood || '',
      city: addr?.city || '',
      state: addr?.state || '',
      zip_code: addr?.zip_code || '',
      createdAt: c.created_at,
      lastOrderAt,
      totalOrders,
      totalSpent,
      status,
      favoriteItems: [],
    })
  }

  return result
}

export async function getCustomerById(id: string) {
  const supabase = getSupabaseServerClient()
  const { data: c, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, phone, customer_code, created_at, updated_at, role')
    .eq('id', id)
    .eq('role', 'customer')
    .maybeSingle()
  if (error) throw error
  if (!c) return null

  const { data: addr } = await supabase
    .from('customer_addresses')
    .select('id, street, number, neighborhood, city, state, complement, zip_code, label, is_default, created_at')
    .eq('user_id', c.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return {
    id: c.id,
    customer_code: c.customer_code,
    name: c.full_name || '',
    email: c.email || '',
    phone: c.phone || '',
    address: {
      id: addr?.id || null,
      street: addr?.street || '',
      number: addr?.number || '',
      neighborhood: addr?.neighborhood || '',
      city: addr?.city || '',
      state: addr?.state || '',
      complement: addr?.complement || '',
      zip_code: addr?.zip_code || '',
    },
  }
}

export async function updateCustomerAndAddress(id: string, input: { name: string; email: string; phone?: string | null; address?: any }) {
  const supabase = getSupabaseServerClient()
  // Atualizar cliente
  const { error: upErr } = await supabase
    .from('profiles')
    .update({ full_name: input.name, email: input.email, phone: input.phone ?? null, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('role', 'customer')
  if (upErr) throw upErr

  if (input.address && (input.address.street || input.address.city)) {
    const { data: existing } = await supabase
      .from('customer_addresses')
      .select('id')
      .eq('user_id', id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const addrPayload = {
      street: input.address.street || '',
      number: input.address.number || '',
      neighborhood: input.address.neighborhood || '',
      city: input.address.city || '',
      state: input.address.state || '',
      complement: input.address.complement || '',
      zip_code: input.address.zip_code || '',
      updated_at: new Date().toISOString(),
    }

    if (existing) {
      const { error: addrErr } = await supabase
        .from('customer_addresses')
        .update(addrPayload)
        .eq('id', existing.id)
      if (addrErr) throw addrErr
    } else {
      const { error: addrErr } = await supabase
        .from('customer_addresses')
        .insert({ user_id: id, label: 'Principal', is_default: true, ...addrPayload })
      if (addrErr) throw addrErr
    }
  }

  return { success: true }
}

export async function deleteCustomer(id: string) {
  const supabase = getSupabaseServerClient()
  // Verificar se tem pedidos
  const { data: countData, error: countErr } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', id)
  if (countErr) throw countErr

  const hasOrders = (countData as any)?.length === 0 ? false : true // count head mode returns [] but provides count in header (not accessible here). Fallback simples.

  if (hasOrders) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    await supabase
      .from('profiles')
      .update({
        full_name: `[EXCLUÍDO] Cliente`,
        email: `excluido.${timestamp}@sistema.local`,
        phone: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('role', 'customer')
    await supabase.from('customer_addresses').delete().eq('user_id', id)
  } else {
    await supabase.from('customer_addresses').delete().eq('user_id', id)
    await supabase.from('profiles').delete().eq('id', id).eq('role', 'customer')
  }
  return { success: true }
}

export async function listAddresses(userId: string) {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('customer_addresses')
    .select('*, label')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createAddress(input: { user_id: string; label: string; street: string; number: string; complement?: string | null; neighborhood: string; city: string; state: string; zip_code: string; is_default?: boolean }) {
  const supabase = getSupabaseServerClient()
  if (input.is_default) {
    await supabase.from('customer_addresses').update({ is_default: false }).eq('user_id', input.user_id)
  }
  const { data, error } = await supabase
    .from('customer_addresses')
    .insert({
      user_id: input.user_id,
      label: input.label || 'Endereço',
      street: input.street,
      number: input.number,
      complement: input.complement ?? '',
      neighborhood: input.neighborhood,
      city: input.city,
      state: input.state,
      zip_code: input.zip_code,
      is_default: input.is_default || false,
    })
    .select('*, label')
    .single()
  if (error) throw error
  return data
}

export async function getAddressById(id: string) {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('customer_addresses')
    .select('*, label')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return data
}

export async function updateAddress(id: string, input: { is_default?: boolean; label?: string; street?: string; number?: string; complement?: string; neighborhood?: string; city?: string; state?: string; zip_code?: string }) {
  const supabase = getSupabaseServerClient()
  // Buscar user_id para remoção de outros padrões
  const { data: found, error: findErr } = await supabase.from('customer_addresses').select('user_id').eq('id', id).maybeSingle()
  if (findErr) throw findErr
  if (!found) return null
  if (input.is_default) {
    await supabase.from('customer_addresses').update({ is_default: false }).eq('user_id', found.user_id).neq('id', id)
  }
  const { data, error } = await supabase
    .from('customer_addresses')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, label')
    .single()
  if (error) throw error
  return data
}

export async function deleteAddress(id: string) {
  const supabase = getSupabaseServerClient()
  // Verificar se é padrão e se há outros
  const { data: found, error: findErr } = await supabase
    .from('customer_addresses')
    .select('is_default, user_id')
    .eq('id', id)
    .maybeSingle()
  if (findErr) throw findErr
  if (!found) return { success: true }

  if (found.is_default) {
    const { data: total } = await supabase.from('customer_addresses').select('id', { count: 'exact' }).eq('user_id', found.user_id)
    const hasOthers = (total || []).length > 1
    if (hasOthers) {
      throw new Error('Não é possível excluir o endereço padrão. Defina outro endereço como padrão primeiro.')
    }
  }

  const { error } = await supabase.from('customer_addresses').delete().eq('id', id)
  if (error) throw error
  return { success: true }
}

export async function getAdminSettings(): Promise<Record<string, string>> {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase.from('admin_settings').select('setting_key, setting_value')
  if (error) throw error
  const settings: Record<string, string> = {}
  ;(data || []).forEach((s: any) => {
    settings[s.setting_key] = s.setting_value
  })
  return settings
}

export async function updateAdminSetting(key: string, value: string) {
  const supabase = getSupabaseServerClient()
  // Upsert por chave única
  const { error } = await supabase
    .from('admin_settings')
    .upsert({ setting_key: key, setting_value: value, updated_at: new Date().toISOString() }, { onConflict: 'setting_key' })
  if (error) throw error
  return true
}

export async function saveCustomerAddress(userId: string, addressData: any): Promise<boolean> {
  const supabase = getSupabaseServerClient()
  const payload = {
    user_id: userId,
    label: 'Endereço Principal',
    zip_code: addressData.zipCode,
    street: addressData.street,
    neighborhood: addressData.neighborhood,
    city: addressData.city,
    state: addressData.state,
    number: addressData.number,
    complement: addressData.complement || '',
    is_default: true,
  }
  if (payload.is_default) {
    await supabase.from('customer_addresses').update({ is_default: false }).eq('user_id', userId)
  }
  const { error } = await supabase.from('customer_addresses').insert(payload)
  if (error) throw error
  return true
}


