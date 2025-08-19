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
    frontendLogger.info(`Encontrados ${orders.orders.length} pedidos`)
    return addCorsHeaders(NextResponse.json(orders))
  } catch (error: any) {
    frontendLogger.logError('Erro ao buscar pedidos', {}, error, 'api')
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
      frontendLogger.logError('Erro ao fazer parse do JSON:', {}, error as Error, 'api')
      return addCorsHeaders(NextResponse.json({ error: "JSON inválido" }, { status: 400 }))
    }

    // Validação usando Zod
    const validationResult = orderSchema.safeParse(body)
    if (!validationResult.success) {
      frontendLogger.logError('Dados de pedido inválidos:', {}, validationResult.error as Error, 'api')
      return addCorsHeaders(NextResponse.json({ 
        error: "Dados inválidos", 
        details: validationResult.error.errors 
      }, { status: 400 }))
    }

    const validatedData = validationResult.data
  
    // Mapear campos do schema validado
    const user_id = validatedData.userId
    const payment_method = validatedData.paymentMethod || 'cash' // Valor padrão
    const total = validatedData.total
    const notes = validatedData.notes ?? null
    const items = Array.isArray(validatedData.items) ? validatedData.items : []
    const deliveryAddress = validatedData.deliveryAddress
    const couponCode = validatedData.couponCode
    
    // Valores padrão para campos não presentes no schema
    const subtotal = 0
    const delivery_fee = 0
    const discount = 0
    const status = 'RECEIVED'
    const payment_status = 'PENDING'
    const delivery_type = 'delivery'
    const estimated_delivery_time = null
  
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
      customer_name: 'Cliente', // Valor padrão
      customer_phone: '', // Valor padrão
      customer_address: deliveryAddress ? `${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.zipCode}${deliveryAddress.complement ? `, ${deliveryAddress.complement}` : ''}` : '', // Converter objeto para string
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
    addRateLimitHeaders(response, request, 'orders')
    return addCorsHeaders(response)
  } catch (error: any) {
    frontendLogger.logError('Erro ao criar pedido', { error }, error as Error, 'api')
    return addCorsHeaders(NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 }))
  }
}

// Handler OPTIONS para CORS
export const OPTIONS = createOptionsHandler()
