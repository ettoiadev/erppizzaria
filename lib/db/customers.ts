/**
 * Operações de banco de dados relacionadas a clientes
 */

import { getSupabaseServerClient } from '../supabase'

/**
 * Lista todos os clientes
 */
export async function listCustomers() {
  const supabase = getSupabaseServerClient()
  
  const { data: customers, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, phone, customer_code, created_at, updated_at, role')
    .eq('role', 'customer')
    .order('created_at', { ascending: false })
  if (error) throw error

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

/**
 * Busca cliente por ID
 */
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

/**
 * Atualiza cliente e endereço
 */
export async function updateCustomerAndAddress(id: string, input: { 
  name: string
  email: string
  phone?: string | null
  address?: any 
}) {
  const supabase = getSupabaseServerClient()
  
  // Atualizar cliente
  const { error: upErr } = await supabase
    .from('profiles')
    .update({ 
      full_name: input.name, 
      email: input.email, 
      phone: input.phone ?? null, 
      updated_at: new Date().toISOString() 
    })
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

/**
 * Exclui cliente
 */
export async function deleteCustomer(id: string) {
  const supabase = getSupabaseServerClient()
  
  // Verificar se tem pedidos
  const { data: countData, error: countErr } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', id)
  if (countErr) throw countErr

  const hasOrders = (countData as any)?.length === 0 ? false : true

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