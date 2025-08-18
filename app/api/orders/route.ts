import { NextRequest, NextResponse } from 'next/server'
import { listOrders, createOrder } from '@/lib/db-supabase'
import { addCorsHeaders, createOptionsHandler } from '@/lib/auth-utils'
import { frontendLogger } from '@/lib/frontend-logger'
import { orderSchema } from '@/lib/validation-schemas'
import { checkRateLimit, addRateLimitHeaders } from '@/lib/simple-rate-limit'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// Handler GET para listar pedidos
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    frontendLogger.info('Buscando lista de pedidos')
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const orders = await listOrders({ status, userId, limit, offset })
    frontendLogger.info(`Encontrados ${orders.length} pedidos`)
    return addCorsHeaders(NextResponse.json(orders))
  } catch (error: any) {
    frontendLogger.error('Erro ao buscar pedidos:', error)
    return addCorsHeaders(NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 }))
  }
}

// Handler POST para criar pedido
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Verificar rate limiting
  const rateLimitCheck = checkRateLimit(request, 'orders')
  if (!rateLimitCheck.allowed) {
    return addCorsHeaders(rateLimitCheck.response!)
  }

  try {
    frontendLogger.info('Criando novo pedido')
    
    // Parse do JSON
    let body
    try {
      body = await request.json()
    } catch (error) {
      frontendLogger.error('Erro ao fazer parse do JSON:', error)
      return addCorsHeaders(NextResponse.json({ error: "JSON inválido" }, { status: 400 }))
    }

    // Validação usando Zod
    const validationResult = orderSchema.safeParse(body)
    if (!validationResult.success) {
      frontendLogger.error('Dados de pedido inválidos:', validationResult.error)
      return addCorsHeaders(NextResponse.json({ 
        error: "Dados inválidos", 
        details: validationResult.error.errors 
      }, { status: 400 }))
    }

    const validatedData = validationResult.data
  
    // Mapear campos alternativos vindos do frontend
    const user_id = validatedData.user_id ?? validatedData.customerId ?? validatedData.userId
    const customer_name = validatedData.customer_name ?? validatedData.name ?? validatedData.customer_name_full
    const customer_phone = validatedData.customer_phone ?? validatedData.delivery_phone ?? validatedData.phone
    const customer_address = validatedData.customer_address ?? validatedData.delivery_address ?? validatedData.address
    const payment_method = validatedData.payment_method ?? validatedData.paymentMethod
    const total = validatedData.total
    const subtotal = validatedData.subtotal ?? 0
    const delivery_fee = validatedData.delivery_fee ?? 0
    const discount = validatedData.discount ?? 0
    const status = validatedData.status ?? 'RECEIVED'
    const payment_status = validatedData.payment_status ?? 'PENDING'
    const delivery_type = validatedData.delivery_type ?? 'delivery'
    const notes = validatedData.notes ?? validatedData.delivery_instructions ?? null
    const estimated_delivery_time = validatedData.estimated_delivery_time ?? null
    const items = Array.isArray(validatedData.items) ? validatedData.items : []
  
    // Processar itens do pedido
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
  
    const order = await createOrder({
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

    frontendLogger.info(`Pedido criado com sucesso: ${order.id}`)
    const response = NextResponse.json({
      id: order.id,
      message: "Pedido criado com sucesso",
      order: { ...order, items }
    })
    addRateLimitHeaders(response, rateLimitCheck.remaining, rateLimitCheck.resetTime)
    return addCorsHeaders(response)
  } catch (error: any) {
    frontendLogger.error('Erro ao criar pedido:', error)
    return addCorsHeaders(NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 }))
  }
}

// Handler OPTIONS para CORS
export const OPTIONS = createOptionsHandler()
