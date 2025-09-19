/**
 * Operações de banco de dados relacionadas a pedidos
 */

import { query } from '../database'

export interface OrderItemInput {
  product_id: string | null // UUID no PostgreSQL
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
  let sql = `
    SELECT 
      o.*,
      p.full_name,
      p.email,
      p.phone,
      COUNT(*) OVER() as total_count
    FROM orders o
    LEFT JOIN profiles p ON o.user_id = p.id
    WHERE o.archived_at IS NULL
  `
  
  const queryParams: any[] = []
  let paramIndex = 1
  
  if (params.status && params.status !== 'all') {
    sql += ` AND o.status = $${paramIndex}`
    queryParams.push(params.status)
    paramIndex++
  }
  
  if (params.userId) {
    sql += ` AND o.user_id = $${paramIndex}`
    queryParams.push(params.userId)
    paramIndex++
  }
  
  sql += ` ORDER BY o.created_at DESC`
  
  if (params.limit) {
    sql += ` LIMIT $${paramIndex}`
    queryParams.push(params.limit)
    paramIndex++
  }
  
  if (params.offset) {
    sql += ` OFFSET $${paramIndex}`
    queryParams.push(params.offset)
  }
  
  const result = await query(sql, queryParams)
  const data = result.rows

  // Buscar itens dos pedidos
  const orderIds = data.map((o: any) => o.id)
  let orderItems: any[] = []
  
  if (orderIds.length > 0) {
    const itemsResult = await query(`
      SELECT 
        oi.*,
        p.name as product_name,
        p.description as product_description,
        p.image_url as product_image_url
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ANY($1)
      ORDER BY oi.created_at ASC
    `, [orderIds])
    orderItems = itemsResult.rows
  }
  
  // Estatísticas básicas
  const total = data.length > 0 ? parseInt(data[0].total_count) : 0
  const statistics = {
    total,
    received: data.filter((o: any) => o.status === 'RECEIVED').length,
    preparing: data.filter((o: any) => o.status === 'PREPARING').length,
    onTheWay: data.filter((o: any) => o.status === 'ON_THE_WAY').length,
    delivered: data.filter((o: any) => o.status === 'DELIVERED').length,
    cancelled: data.filter((o: any) => o.status === 'CANCELLED').length,
    totalRevenue: data.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0),
  }

  const orders = data.map((o: any) => {
    const items = orderItems.filter((item: any) => item.order_id === o.id)
    return {
      ...o,
      order_items: items,
      items: items,
      profiles: {
        full_name: o.full_name,
        email: o.email,
        phone: o.phone
      }
    }
  })

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
  const orderResult = await query(`
    INSERT INTO orders (
      user_id, customer_name, delivery_phone, delivery_address,
      total, subtotal, delivery_fee, discount, status,
      payment_method, payment_status, delivery_instructions,
      estimated_delivery_time, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()
    ) RETURNING *
  `, [
    input.user_id,
    input.customer_name,
    input.customer_phone,
    input.customer_address,
    input.total,
    input.subtotal ?? 0,
    input.delivery_fee ?? 0,
    input.discount ?? 0,
    input.status || 'RECEIVED',
    input.payment_method,
    input.payment_status || 'PENDING',
    input.notes ?? null,
    input.estimated_delivery_time ?? null
  ])
  
  const order = orderResult.rows[0]

  if (input.items?.length) {
    for (const item of input.items) {
      await query(`
        INSERT INTO order_items (
          order_id, product_id, name, quantity, unit_price,
          total_price, size, toppings, special_instructions,
          half_and_half, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
        )
      `, [
        order.id,
        item.product_id,
        item.name,
        item.quantity,
        item.unit_price,
        item.total_price,
        item.size ?? null,
        JSON.stringify(item.toppings) ?? null,
        item.special_instructions ?? null,
        JSON.stringify(item.half_and_half) ?? null
      ])
    }
  }

  return order
}

/**
 * Busca pedido por ID
 */
export async function getOrderById(id: string) {
  const orderResult = await query(`
    SELECT 
      o.*,
      p.full_name,
      p.email,
      p.phone
    FROM orders o
    LEFT JOIN profiles p ON o.user_id = p.id
    WHERE o.id = $1
  `, [id])
  
  if (orderResult.rows.length === 0) return null
  const order = orderResult.rows[0]

  const itemsResult = await query(`
    SELECT 
      oi.*,
      pr.name as product_name,
      pr.description as product_description,
      pr.image_url as product_image_url
    FROM order_items oi
    LEFT JOIN products pr ON oi.product_id = pr.id
    WHERE oi.order_id = $1
    ORDER BY oi.created_at ASC
  `, [order.id])
  
  const items = itemsResult.rows

  const processedItems = (items || []).map((item: any) => ({
    id: item.id,
    order_id: item.order_id,
    product_id: item.product_id,
    name: item.name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.total_price,
    size: item.size,
    toppings: item.toppings ? JSON.parse(item.toppings) : null,
    special_instructions: item.special_instructions,
    half_and_half: item.half_and_half ? JSON.parse(item.half_and_half) : null,
    created_at: item.created_at,
    updated_at: item.updated_at,
    products: {
      name: item.product_name,
      description: item.product_description,
      image_url: item.product_image_url,
    },
  }))

  return {
    ...order,
    profiles: {
      full_name: order.full_name,
      email: order.email,
      phone: order.phone,
    },
    items: processedItems,
  }
}

/**
 * Atualiza status do pedido
 */
export async function updateOrderStatus(id: string, status: string) {
  const result = await query(`
    UPDATE orders 
    SET status = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING *
  `, [status, id])
  
  if (result.rows.length === 0) {
    throw new Error('Order not found')
  }
  
  return result.rows[0]
}

/**
 * Atualiza status de pagamento do pedido
 */
export async function updatePaymentStatus(id: string, paymentStatus: string) {
  const result = await query(`
    UPDATE orders 
    SET payment_status = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING *
  `, [paymentStatus, id])
  
  if (result.rows.length === 0) {
    throw new Error('Order not found')
  }
  
  return result.rows[0]
}