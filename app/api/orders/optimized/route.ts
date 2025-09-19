import { NextRequest, NextResponse } from "next/server"
import { query } from '@/lib/db'
import { ordersRateLimiter } from '@/lib/rate-limiter'
import { frontendLogger } from '@/lib/frontend-logger'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Aplicar rate limiting
    const rateLimitResult = ordersRateLimiter(request)
    if (rateLimitResult && (rateLimitResult as NextResponse).status === 429) {
      return rateLimitResult
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const userId = searchParams.get("userId")
    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")

    // Validar parâmetros
    const parsedLimit = limit ? Math.min(parseInt(limit), 100) : null // Máximo de 100 itens
    const parsedOffset = offset ? Math.max(parseInt(offset), 0) : null // Mínimo 0

    frontendLogger.info('Buscando pedidos otimizados', 'api', { status, limit: parsedLimit, offset: parsedOffset })

    // Construir query SQL otimizada
    let sqlQuery = `
      SELECT 
        o.id,
        o.order_number,
        o.customer_name,
        o.customer_phone,
        o.customer_address,
        o.total,
        o.subtotal,
        o.delivery_fee,
        o.discount,
        o.status,
        o.payment_method,
        o.payment_status,
        o.delivery_type,
        o.notes,
        o.estimated_delivery_time,
        o.created_at,
        o.updated_at,
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
            'special_instructions', oi.special_instructions
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
    `
    
    const queryParams: any[] = []
    const conditions: string[] = []
    
    if (status && status !== 'all') {
      conditions.push(`o.status = $${queryParams.length + 1}`)
      queryParams.push(status)
    }
    
    if (userId) {
      conditions.push(`o.user_id = $${queryParams.length + 1}`)
      queryParams.push(userId)
    }
    
    if (conditions.length > 0) {
      sqlQuery += ' WHERE ' + conditions.join(' AND ')
    }
    
    sqlQuery += ' GROUP BY o.id ORDER BY o.created_at DESC'
    
    if (parsedLimit) {
      sqlQuery += ` LIMIT $${queryParams.length + 1}`
      queryParams.push(parsedLimit)
    }
    
    if (parsedOffset) {
      sqlQuery += ` OFFSET $${queryParams.length + 1}`
      queryParams.push(parsedOffset)
    }
    
    const ordersResult = await query(sqlQuery, queryParams)
    const orders = ordersResult.rows
    
    // Calcular estatísticas
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'RECEIVED' THEN 1 END) as received,
        COUNT(CASE WHEN status = 'PREPARING' THEN 1 END) as preparing,
        COUNT(CASE WHEN status = 'READY' THEN 1 END) as ready,
        COUNT(CASE WHEN status = 'ON_THE_WAY' THEN 1 END) as on_the_way,
        COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) as delivered,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled,
        COALESCE(SUM(CASE WHEN status = 'DELIVERED' THEN total ELSE 0 END), 0) as total_revenue
      FROM orders
      ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}
    `
    
    const statsResult = await query(statsQuery, conditions.length > 0 ? queryParams.slice(0, conditions.length) : [])
    const statistics = statsResult.rows[0]
    
    frontendLogger.info('Pedidos encontrados', 'api', { count: orders.length })

    return NextResponse.json({ 
      orders, 
      statistics, 
      pagination: { 
        total: statistics.total, 
        limit: parsedLimit, 
        offset: parsedOffset || 0 
      },
      meta: {
        cached: false,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    frontendLogger.logError('Erro ao buscar pedidos otimizados', {}, error, 'api')
    return NextResponse.json(
      { 
        error: "Erro interno do servidor",
        message: error.message || "Falha ao carregar pedidos",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}