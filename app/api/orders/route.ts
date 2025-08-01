import { type NextRequest, NextResponse } from "next/server"
import { getOrders, createOrder } from "@/lib/orders"
import { verifyToken } from "@/lib/auth"
import { notifyNewOrder } from "@/lib/socket-server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const userId = searchParams.get("userId") || searchParams.get("user_id")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    console.log("GET /api/orders - Fetching orders with params:", { status, userId, limit, offset })

    // Buscar pedidos usando PostgreSQL nativo
    const orders = await getOrders({
      status: status && status !== "all" ? status : undefined,
      user_id: userId || undefined,
      limit,
      offset
    })

    console.log(`✅ ${orders?.length || 0} pedidos carregados`)

    // Processar dados para compatibilidade com o frontend
    const processedOrders = orders.map(order => ({
      ...order,
      // Aplicar lógica do COALESCE no frontend
      customer_display_name: order.full_name || order.customer_name || 'Cliente',
      customer_display_phone: order.delivery_phone || order.phone || '',
      // order_items já vem da query SQL
      profiles: order.full_name ? {
        full_name: order.full_name,
        email: order.email,
        phone: order.phone
      } : null
    }))

    // Calcular estatísticas dos pedidos carregados
    const statistics = {
      total: processedOrders.length,
      received: processedOrders.filter((o) => o.status === "PENDING").length,
      preparing: processedOrders.filter((o) => o.status === "PREPARING").length,
      onTheWay: processedOrders.filter((o) => o.status === "ON_THE_WAY").length,
      delivered: processedOrders.filter((o) => o.status === "DELIVERED").length,
      cancelled: processedOrders.filter((o) => o.status === "CANCELLED").length,
      totalRevenue: processedOrders
        .filter((o) => o.status === "DELIVERED")
        .reduce((sum, o) => sum + Number.parseFloat(o.total.toString()), 0),
    }

    return NextResponse.json({
      orders: processedOrders,
      statistics,
      pagination: {
        limit,
        offset,
        hasMore: processedOrders.length === limit,
      },
    })
  } catch (error: any) {
    console.error("Unexpected error in GET /api/orders:", error)
    return NextResponse.json({ 
      error: "Erro ao buscar pedidos",
      details: error.message,
      code: error.code 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== POST /api/orders - INÍCIO ===")
    
    const body = await request.json()
    console.log("POST /api/orders - Request body completo:", JSON.stringify(body, null, 2))

    // Extrair e validar dados com logs detalhados
    const user_id = body.customerId || body.user_id
    const items = body.items || []
    const total = Number(body.total || 0)
    const subtotal = Number(body.subtotal || total)
    const delivery_fee = Number(body.delivery_fee || 0)
    const delivery_address = body.address || body.delivery_address || ""
    const delivery_phone = body.phone || body.delivery_phone || ""
    const customer_name = body.name || ""
    const payment_method = body.paymentMethod || body.payment_method || "PIX"
    const delivery_instructions = body.notes || body.delivery_instructions || null

    console.log("Dados extraídos:", {
      user_id,
      items_count: items.length,
      total,
      subtotal,
      delivery_fee,
      delivery_address,
      delivery_phone,
      payment_method,
      delivery_instructions
    })

    // Validações com mensagens específicas
    if (!user_id) {
      console.error("ERRO: ID do usuário não fornecido")
      return NextResponse.json({ 
        error: "ID do usuário é obrigatório",
        details: "user_id não foi fornecido no body da requisição" 
      }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error("ERRO: Itens inválidos ou vazios")
      return NextResponse.json({ 
        error: "Itens do pedido são obrigatórios",
        details: "Array de itens está vazio ou inválido" 
      }, { status: 400 })
    }

    if (!delivery_address) {
      console.error("ERRO: Endereço de entrega obrigatório", { delivery_address })
      return NextResponse.json({ 
        error: "Endereço de entrega é obrigatório",
        details: `Endereço: ${delivery_address || 'vazio'}` 
      }, { status: 400 })
    }

    if (total <= 0) {
      console.error("ERRO: Total inválido", { total })
      return NextResponse.json({ 
        error: "Total do pedido deve ser maior que zero",
        details: `Total recebido: ${total}` 
      }, { status: 400 })
    }

    // Preparar dados do pedido usando PostgreSQL
    const orderData = {
      user_id,
      customer_name,
      customer_phone: delivery_phone,
      customer_address: delivery_address,
      total,
      status: "PENDING" as const,
      payment_method: payment_method as any,
      delivery_type: "delivery" as const,
      notes: delivery_instructions
    }

    console.log("Criando pedido com dados:", orderData)

    // Preparar itens do pedido
    const orderItems = items.map(item => {
      let product_id = item.product_id || item.id
      if (product_id) {
        product_id = product_id.toString().replace(/--+$/, '').trim()
      }

      return {
        product_id,
        name: item.name || '',
        price: Number(item.price || item.unit_price || 0),
        quantity: Number(item.quantity || 1),
        size: item.size || null,
        toppings: item.toppings || [],
        special_instructions: item.notes || null,
        half_and_half: item.halfAndHalf || null
      }
    })

    console.log("Criando pedido com itens:", orderItems)

    // Criar o pedido usando PostgreSQL
    const order = await createOrder(orderData, orderItems)

    if (!order) {
      throw new Error('Falha ao criar pedido')
    }

    console.log("Pedido criado com sucesso! ID:", order.id)
    
    // Notificar via Socket.io sobre o novo pedido
    try {
      notifyNewOrder({
        id: order.id,
        status: order.status,
        total: order.total,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        customer_address: order.customer_address,
        payment_method: order.payment_method,
        created_at: order.created_at,
        items: orderItems
      });
      console.log("✅ Notificação Socket.io enviada para novo pedido");
    } catch (socketError) {
      console.warn("⚠️ Erro ao enviar notificação Socket.io:", socketError);
      // Não falhar o pedido por erro de notificação
    }
      
      return NextResponse.json({
        id: order.id,
        status: order.status,
        total: order.total,
        created_at: order.created_at,
        message: "Pedido criado com sucesso!"
      })
      
  } catch (error: any) {
    console.error("=== ERRO COMPLETO NO POST /api/orders ===")
    console.error("Tipo:", error.constructor.name)
    console.error("Mensagem:", error.message)
    console.error("Stack:", error.stack)
    
    if (error.code) {
      console.error("Código PostgreSQL:", error.code)
      console.error("Detalhe:", error.detail)
      console.error("Hint:", error.hint)
    }
    
    // Retornar erro detalhado
    return NextResponse.json({ 
      error: error.message || "Erro interno do servidor",
      details: {
        type: error.constructor.name,
        code: error.code,
        message: error.message,
        hint: error.hint,
        detail: error.detail
      }
    }, { status: 500 })
  }
}
