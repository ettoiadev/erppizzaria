import { type NextRequest, NextResponse } from "next/server"
import { createOrder as createOrderSupabase } from '@/lib/db-supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log("=== POST /api/orders/manual - INÍCIO ===")
    
    const body = await request.json()
    console.log("POST /api/orders/manual - Request body:", JSON.stringify(body, null, 2))

    // Extrair dados específicos para pedidos manuais
    const items = body.items || []
    const total = Number(body.total || 0)
    const subtotal = Number(body.subtotal || total)
    const delivery_fee = Number(body.delivery_fee || 0)
    const customerId = body.customerId // ID real do cliente
    const customerName = body.name || ""
    const customerPhone = body.phone || ""
    const orderType = body.orderType || "balcao" // "balcao" ou "telefone"
    const paymentMethod = body.paymentMethod || "PIX"
    const notes = body.notes || ""
    const deliveryAddress = body.deliveryAddress || ""

    // Definir endereço baseado no tipo se não fornecido
    const finalDeliveryAddress = deliveryAddress || (orderType === "balcao" ? "Manual (Balcão)" : "Manual (Telefone)")

    console.log("Dados extraídos para pedido manual:", {
      items_count: items.length,
      total,
      subtotal,
      delivery_fee,
      customerId,
      customerName,
      customerPhone,
      orderType,
      paymentMethod,
      deliveryAddress: finalDeliveryAddress
    })

    // Validações específicas para pedidos manuais
    if (!customerId || customerId.trim() === "") {
      return NextResponse.json({ 
        error: "ID do cliente é obrigatório para pedidos manuais" 
      }, { status: 400 })
    }

    if (!customerName || customerName.trim() === "") {
      return NextResponse.json({ 
        error: "Nome do cliente é obrigatório para pedidos manuais" 
      }, { status: 400 })
    }

    if (!customerPhone || customerPhone.trim() === "") {
      return NextResponse.json({ 
        error: "Telefone do cliente é obrigatório para pedidos manuais" 
      }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ 
        error: "Itens do pedido são obrigatórios" 
      }, { status: 400 })
    }

    if (total <= 0) {
      return NextResponse.json({ 
        error: "Total do pedido deve ser maior que zero" 
      }, { status: 400 })
    }

    // Usar ID do cliente real
    const userId = customerId

    // Preparar itens para API Supabase
    const itemsPayload = items.map((item: any) => ({
      product_id: item.product_id || item.id || null,
      name: item.name || '',
      quantity: Number(item.quantity || 1),
      unit_price: Number(item.unit_price ?? item.price ?? 0),
      total_price: Number(item.total_price ?? (Number(item.quantity || 1) * Number(item.unit_price ?? item.price ?? 0))),
      size: item.size || null,
      toppings: item.toppings || null,
      special_instructions: item.notes || null,
      half_and_half: item.halfAndHalf || null,
    }))

    const order = await createOrderSupabase({
      user_id: userId,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_address: finalDeliveryAddress,
      total,
      subtotal,
      delivery_fee,
      discount: 0,
      status: 'RECEIVED',
      payment_method: paymentMethod,
      payment_status: 'PENDING',
      notes: notes || null,
      estimated_delivery_time: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      items: itemsPayload,
    })

    console.log("Pedido manual criado com sucesso!", order.id)

    return NextResponse.json({
      success: true,
      message: "Pedido manual criado com sucesso!",
      order,
      orderId: order.id
    })

  } catch (error: any) {
    console.error("=== ERRO COMPLETO NO POST /api/orders/manual ===")
    console.error("Tipo:", error.constructor.name)
    console.error("Mensagem:", error.message)
    console.error("Stack:", error.stack)
    
    if (error.code) {
      console.error("Código:", error.code)
      console.error("Detalhe:", error.details)
    }

    return NextResponse.json({
      success: false,
      error: "Erro interno do servidor",
      message: error.message || "Não foi possível criar o pedido manual",
      details: {
        type: error.constructor.name,
        code: error.code,
        message: error.message
      }
    }, { status: 500 })
  }
}