import { NextRequest, NextResponse } from "next/server"
import { query } from '@/lib/postgres'
import { ordersRateLimiter } from '@/lib/rate-limiter'
import { emitRealtimeEvent, EVENT_ORDER_CREATED, REALTIME_CHANNEL } from '@/lib/realtime'

export async function GET(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const userId = searchParams.get("userId")
    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")

    // Construir query base
    let whereConditions = []
    let params = []
    let paramIndex = 1

    if (status && status !== "all") {
      whereConditions.push(`o.status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    if (userId) {
      whereConditions.push(`o.user_id = $${paramIndex}`)
      params.push(userId)
      paramIndex++
    }

    // Filtrar pedidos não arquivados por padrão
    whereConditions.push(`o.archived_at IS NULL`)

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Query para pedidos
    const ordersQuery = `
      SELECT o.*, 
             p.full_name, p.email, p.phone,
             json_agg(
               json_build_object(
                 'id', oi.id,
                 'product_id', oi.product_id,
                 'name', oi.name,
                 'quantity', oi.quantity,
                 'unit_price', oi.unit_price,
                 'total_price', oi.total_price,
                 'size', oi.size,
                 'toppings', oi.toppings,
                 'special_instructions', oi.special_instructions,
                 'half_and_half', oi.half_and_half
               )
             ) FILTER (WHERE oi.id IS NOT NULL) as order_items
      FROM orders o
      LEFT JOIN profiles p ON o.user_id = p.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id, p.full_name, p.email, p.phone
      ORDER BY o.created_at DESC
      ${limit ? `LIMIT $${paramIndex}` : ''}
      ${offset ? `OFFSET $${paramIndex + (limit ? 1 : 0)}` : ''}
    `

    if (limit) {
      params.push(parseInt(limit))
      paramIndex++
    }
    if (offset) {
      params.push(parseInt(offset))
    }

    const ordersResult = await query(ordersQuery, params)
    
    const orders = ordersResult.rows.map(row => ({
      ...row,
      order_items: row.order_items || [],
      items: row.order_items || [] // Para compatibilidade
    }))

    // Query para estatísticas (sem LIMIT e OFFSET)
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'RECEIVED' THEN 1 END) as received,
        COUNT(CASE WHEN status = 'PREPARING' THEN 1 END) as preparing,
        COUNT(CASE WHEN status = 'ON_THE_WAY' THEN 1 END) as onTheWay,
        COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) as delivered,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled,
        COALESCE(SUM(CASE WHEN status = 'DELIVERED' THEN total ELSE 0 END), 0) as totalRevenue
      FROM orders o
      ${whereClause}
    `

    // Para estatísticas, usar apenas os parâmetros de WHERE (sem LIMIT/OFFSET)
    // Calcular quantos parâmetros remover baseado nos parâmetros de paginação
    const paginationParams = (limit ? 1 : 0) + (offset ? 1 : 0)
    const statsParams = whereConditions.length > 0 ? params.slice(0, -paginationParams) : []
    
    const statsResult = await query(statsQuery, statsParams)
    const statistics = statsResult.rows[0]

    return NextResponse.json({
      orders,
      statistics,
      pagination: {
        total: statistics.total,
        limit: limit ? parseInt(limit) : null,
        offset: offset ? parseInt(offset) : 0
      }
    })

  } catch (error: any) {
    console.error("❌ Erro ao buscar pedidos:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Aplicar rate limiting mais restritivo para criação de pedidos
    const rateLimitResult = ordersRateLimiter(request)
    // Somente interromper o fluxo se o rate limiter BLOQUEAR (status 429)
    if (rateLimitResult && (rateLimitResult as NextResponse).status === 429) {
      return rateLimitResult
    }

    const body = await request.json()
    // Mapear campos alternativos vindos do frontend
    const user_id = body.user_id ?? body.customerId ?? body.userId
    const customer_name = body.customer_name ?? body.name ?? body.customer_name_full
    const customer_phone = body.customer_phone ?? body.delivery_phone ?? body.phone
    const customer_address = body.customer_address ?? body.delivery_address ?? body.address
    const payment_method = body.payment_method ?? body.paymentMethod
    const total = body.total
    const subtotal = body.subtotal ?? 0
    const delivery_fee = body.delivery_fee ?? 0
    const discount = body.discount ?? 0
    const status = body.status ?? 'RECEIVED'
    const payment_status = body.payment_status ?? 'PENDING'
    const delivery_type = body.delivery_type ?? 'delivery'
    const notes = body.notes ?? body.delivery_instructions ?? null
    const estimated_delivery_time = body.estimated_delivery_time ?? null
    const items = Array.isArray(body.items) ? body.items : []

    // Validar dados obrigatórios
    if (!user_id || !customer_name || !customer_phone || !customer_address || !total || !payment_method) {
      return NextResponse.json(
        { error: "Dados obrigatórios não fornecidos" },
        { status: 400 }
      )
    }

    console.log("🍕 Criando novo pedido:", { customer_name, total, payment_method })

    // Inserir pedido
    const orderResult = await query(`
      INSERT INTO orders (
        user_id, customer_name, delivery_phone, delivery_address, 
        total, subtotal, delivery_fee, discount, status, 
        payment_method, payment_status, delivery_instructions, 
        estimated_delivery_time
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      user_id, customer_name, customer_phone, customer_address,
      total, subtotal, delivery_fee, discount, status,
      payment_method, payment_status, notes, estimated_delivery_time
    ])

    const order = orderResult.rows[0]

    // Inserir itens do pedido (tolerante a diferentes formatos vindos do frontend)
    if (items.length > 0) {
      for (const item of items) {
        const productId = item.product_id ?? item.id ?? null
        const name = item.name ?? 'Produto'
        const quantity = item.quantity ?? 1
        const unitPrice = item.unit_price ?? item.price ?? null
        const totalPrice = item.total_price ?? (unitPrice != null && quantity != null ? unitPrice * quantity : null)
        const size = item.size ?? null
        const toppings = item.toppings ? JSON.stringify(item.toppings) : null
        const specialInstructions = item.special_instructions ?? item.notes ?? null
        const halfAndHalf = item.half_and_half
          ? JSON.stringify(item.half_and_half)
          : (item.halfAndHalf ? JSON.stringify(item.halfAndHalf) : null)

        await query(`
          INSERT INTO order_items (
            order_id, product_id, name, quantity, unit_price, total_price,
            size, toppings, special_instructions, half_and_half
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          order.id,
          productId,
          name,
          quantity,
          unitPrice,
          totalPrice,
          size,
          toppings,
          specialInstructions,
          halfAndHalf
        ])
      }
    }

    console.log("✅ Pedido criado com sucesso:", order.id)

    // Emitir evento Realtime para novos pedidos
    try {
      await emitRealtimeEvent(EVENT_ORDER_CREATED, { orderId: order.id, order })
    } catch (e) {
      console.warn('⚠️ Falha ao emitir evento Realtime (order_created):', (e as Error)?.message)
    }

    return NextResponse.json({
      id: order.id,
      message: "Pedido criado com sucesso",
      order: {
        ...order,
        items
      }
    })

  } catch (error: any) {
    console.error("❌ Erro ao criar pedido:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error?.message },
      { status: 500 }
    )
  }
}
