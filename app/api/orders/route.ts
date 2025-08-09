import { NextRequest, NextResponse } from "next/server"
import { listOrders, createOrder as createOrderSupabase } from '@/lib/db-supabase'
import { ordersRateLimiter } from '@/lib/rate-limiter'
import { emitRealtimeEvent, EVENT_ORDER_CREATED, REALTIME_CHANNEL } from '@/lib/realtime'

export async function GET(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const userId = searchParams.get("userId")
    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")

    const { orders, statistics } = await listOrders({
      status,
      userId,
      limit: limit ? parseInt(limit) : null,
      offset: offset ? parseInt(offset) : null,
    })
    return NextResponse.json({ orders, statistics, pagination: { total: statistics.total, limit: limit ? parseInt(limit) : null, offset: offset ? parseInt(offset) : 0 } })

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
      order: { ...order, items }
    })

  } catch (error: any) {
    console.error("❌ Erro ao criar pedido:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error?.message },
      { status: 500 }
    )
  }
}
