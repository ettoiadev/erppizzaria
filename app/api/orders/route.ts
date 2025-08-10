import { NextRequest, NextResponse } from "next/server"
import { listOrders, createOrder as createOrderSupabase } from '@/lib/db-supabase'
import { ordersRateLimiter } from '@/lib/rate-limiter'
import { emitRealtimeEvent, EVENT_ORDER_CREATED, REALTIME_CHANNEL } from '@/lib/realtime'
import { withApiLogging, createApiLogger } from '@/lib/api-logger-middleware'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

async function getOrdersHandler(request: NextRequest) {
  const logger = createApiLogger(request)
  
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const userId = searchParams.get("userId")
  const limit = searchParams.get("limit")
  const offset = searchParams.get("offset")
  
  const queryParams = {
    status,
    userId,
    limit: limit ? parseInt(limit) : null,
    offset: offset ? parseInt(offset) : null,
  }
  
  logger.info('api', 'Buscando pedidos', {
    filters: {
      status,
      userId: userId ? `user_${userId.substring(0, 8)}***` : null,
      limit,
      offset
    }
  })
  
  logger.logQuery('SELECT orders with filters', queryParams)
  const { orders, statistics } = await listOrders(queryParams)
  
  logger.info('api', 'Pedidos encontrados', {
    count: orders.length,
    total: statistics.total,
    hasFilters: !!(status || userId)
  })
  
  return NextResponse.json({ 
    orders, 
    statistics, 
    pagination: { 
      total: statistics.total, 
      limit: limit ? parseInt(limit) : null, 
      offset: offset ? parseInt(offset) : 0 
    } 
  })
}

export const GET = withApiLogging(getOrdersHandler, {
  logRequests: true,
  logResponses: false, // Não logar response completo para listas
  logErrors: true
})

async function createOrderHandler(request: NextRequest) {
  const logger = createApiLogger(request)
  
  // Aplicar rate limiting mais restritivo para criação de pedidos
  const rateLimitResult = ordersRateLimiter(request)
  // Somente interromper o fluxo se o rate limiter BLOQUEAR (status 429)
  if (rateLimitResult && (rateLimitResult as NextResponse).status === 429) {
    logger.warn('api', 'Rate limit atingido para criação de pedido')
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
  
  logger.info('api', 'Tentativa de criação de pedido', {
    userId: user_id ? `user_${user_id.substring(0, 8)}***` : null,
    customerName: customer_name?.substring(0, 10) + '***',
    total,
    paymentMethod: payment_method,
    itemsCount: items.length,
    deliveryType: delivery_type
  })

  // Validar dados obrigatórios
  if (!user_id || !customer_name || !customer_phone || !customer_address || !total || !payment_method) {
    logger.warn('api', 'Dados obrigatórios ausentes na criação de pedido', {
      hasUserId: !!user_id,
      hasCustomerName: !!customer_name,
      hasCustomerPhone: !!customer_phone,
      hasCustomerAddress: !!customer_address,
      hasTotal: !!total,
      hasPaymentMethod: !!payment_method
    })
    return NextResponse.json(
      { error: "Dados obrigatórios não fornecidos" },
      { status: 400 }
    )
  }

  logger.debug('api', 'Processando itens do pedido', { itemsCount: items.length })
  
  const itemsPayload = (items || []).map((item: any) => ({
    product_id: item.product_id ?? item.id ?? null,
    name: item.name ?? 'Produto',
    quantity: item.quantity ?? 1,
    unit_price: item.unit_price ?? item.price ?? null,
    total_price: item.total_price ?? null,
    size: item.size ?? null,
    toppings: item.toppings ?? null,
    special_instructions: item.special_instructions ?? item.notes ?? null,
    half_and_half: item.half_and_half ?? item.halfAndHalf ?? null,
  }))
  
  logger.debug('api', 'Criando pedido no banco de dados')
  logger.logQuery('INSERT order', {
    userId: user_id,
    total,
    itemsCount: itemsPayload.length
  })
  
  const order = await createOrderSupabase({
    user_id,
    customer_name,
    customer_phone,
    customer_address,
    total,
    subtotal,
    delivery_fee,
    discount,
    status,
    payment_method,
    payment_status,
    notes,
    estimated_delivery_time,
    items: itemsPayload,
  })

  logger.info('api', 'Pedido criado com sucesso', {
    orderId: order.id,
    total,
    paymentMethod: payment_method,
    itemsCount: itemsPayload.length
  })
  
  logger.logPayment(order.id, total, payment_method)

  // Emitir evento Realtime para novos pedidos
  try {
    logger.debug('api', 'Emitindo evento realtime para novo pedido')
    await emitRealtimeEvent(EVENT_ORDER_CREATED, { orderId: order.id, order })
    logger.debug('api', 'Evento realtime emitido com sucesso')
  } catch (e) {
    logger.warn('api', 'Falha ao emitir evento Realtime (não crítico)', e, {
      orderId: order.id,
      eventType: EVENT_ORDER_CREATED
    })
  }

  return NextResponse.json({
    id: order.id,
    message: "Pedido criado com sucesso",
    order: { ...order, items }
  })
}

export const POST = withApiLogging(createOrderHandler, {
  logRequests: true,
  logResponses: true,
  logErrors: true
})
