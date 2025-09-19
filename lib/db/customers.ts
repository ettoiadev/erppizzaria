/**
 * Operações de banco de dados relacionadas a clientes
 */

import { query } from '../database'

/**
 * Lista todos os clientes
 */
export async function listCustomers() {
  const customersResult = await query(`
    SELECT id, email, full_name, phone, customer_code, created_at, updated_at, role
    FROM profiles
    WHERE role = 'customer'
    ORDER BY created_at DESC
  `)

  const result = [] as any[]
  
  for (const c of customersResult.rows || []) {
    const addrResult = await query(`
      SELECT street, number, neighborhood, city, state, complement, zip_code, label, is_default, created_at
      FROM customer_addresses
      WHERE user_id = $1
      ORDER BY is_default DESC, created_at DESC
      LIMIT 1
    `, [c.id])
    
    const addr = addrResult.rows[0] || null

    const ordersResult = await query(`
      SELECT total, created_at
      FROM orders
      WHERE user_id = $1
    `, [c.id])
    
    const orders = ordersResult.rows

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
  const customerResult = await query(`
    SELECT id, email, full_name, phone, customer_code, created_at, updated_at, role
    FROM profiles
    WHERE id = $1 AND role = 'customer'
  `, [id])
  
  if (customerResult.rows.length === 0) return null
  const c = customerResult.rows[0]

  const addrResult = await query(`
    SELECT id, street, number, neighborhood, city, state, complement, zip_code, label, is_default, created_at
    FROM customer_addresses
    WHERE user_id = $1
    ORDER BY is_default DESC, created_at DESC
    LIMIT 1
  `, [c.id])
  
  const addr = addrResult.rows[0] || null

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
  // Atualizar cliente
  await query(`
    UPDATE profiles 
    SET full_name = $1, email = $2, phone = $3, updated_at = NOW()
    WHERE id = $4 AND role = 'customer'
  `, [input.name, input.email, input.phone ?? null, id])

  if (input.address && (input.address.street || input.address.city)) {
    const existingResult = await query(`
      SELECT id
      FROM customer_addresses
      WHERE user_id = $1
      ORDER BY is_default DESC, created_at DESC
      LIMIT 1
    `, [id])
    
    const existing = existingResult.rows[0] || null

    if (existing) {
      await query(`
        UPDATE customer_addresses 
        SET street = $1, number = $2, neighborhood = $3, city = $4, 
            state = $5, complement = $6, zip_code = $7, updated_at = NOW()
        WHERE id = $8
      `, [
        input.address.street || '',
        input.address.number || '',
        input.address.neighborhood || '',
        input.address.city || '',
        input.address.state || '',
        input.address.complement || '',
        input.address.zip_code || '',
        existing.id
      ])
    } else {
      await query(`
        INSERT INTO customer_addresses (
          user_id, label, is_default, street, number, neighborhood, 
          city, state, complement, zip_code, created_at, updated_at
        ) VALUES (
          $1, 'Principal', true, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
        )
      `, [
        id,
        input.address.street || '',
        input.address.number || '',
        input.address.neighborhood || '',
        input.address.city || '',
        input.address.state || '',
        input.address.complement || '',
        input.address.zip_code || ''
      ])
    }
  }

  return { success: true }
}

/**
 * Busca clientes com filtros
 */
export async function searchCustomers(params: {
  searchTerm?: string
  codeSearch?: string
  limit?: number
}) {
  const { searchTerm = '', codeSearch = '', limit = 10 } = params
  
  let whereConditions = ['role = \'customer\'']
  let queryParams: any[] = []
  let paramIndex = 1
  
  // Busca por código específico
  if (codeSearch) {
    whereConditions.push(`customer_code ILIKE $${paramIndex}`)
    queryParams.push(`%${codeSearch}%`)
    paramIndex++
  }
  
  // Busca por termo geral (nome, email, telefone)
  if (searchTerm) {
    whereConditions.push(`(
      full_name ILIKE $${paramIndex} OR 
      email ILIKE $${paramIndex + 1} OR 
      phone ILIKE $${paramIndex + 2}
    )`)
    queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`)
    paramIndex += 3
  }
  
  const customersResult = await query(`
    SELECT id, email, full_name, phone, customer_code, created_at, updated_at, role
    FROM profiles
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY created_at DESC
    LIMIT $${paramIndex}
  `, [...queryParams, limit])

  const result = [] as any[]
  
  for (const c of customersResult.rows || []) {
    const addrResult = await query(`
      SELECT street, number, neighborhood, city, state, complement, zip_code, label, is_default, created_at
      FROM customer_addresses
      WHERE user_id = $1
      ORDER BY is_default DESC, created_at DESC
      LIMIT 1
    `, [c.id])
    
    const addr = addrResult.rows[0] || null

    const ordersResult = await query(`
      SELECT total, created_at
      FROM orders
      WHERE user_id = $1
    `, [c.id])
    
    const orders = ordersResult.rows

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
 * Deleta cliente
 */
export async function deleteCustomer(id: string) {
  // Verificar se há pedidos
  const ordersResult = await query(`
    SELECT id FROM orders WHERE user_id = $1 LIMIT 1
  `, [id])
  
  if (ordersResult.rows.length > 0) {
    throw new Error('Não é possível excluir cliente com pedidos')
  }
  
  // Deletar endereços primeiro
  await query(`
    DELETE FROM customer_addresses WHERE user_id = $1
  `, [id])
  
  // Deletar cliente
  await query(`
    DELETE FROM profiles WHERE id = $1 AND role = 'customer'
  `, [id])
  
  return { success: true }
}