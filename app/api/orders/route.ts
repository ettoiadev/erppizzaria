import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const userId = searchParams.get("userId") || searchParams.get("user_id")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    console.log("GET /api/orders - Fetching orders with params:", { status, userId, limit, offset })

    // Buscar pedidos usando Supabase de forma simples
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (status && status !== "all") {
      query = query.eq('status', status)
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }

    // Aplicar paginação
    if (offset > 0) {
      query = query.range(offset, offset + limit - 1)
    } else {
      query = query.limit(limit)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error("Error fetching orders:", error)
      throw error
    }

    console.log(`✅ ${orders?.length || 0} pedidos carregados`)

    // Para cada pedido, buscar dados do cliente e itens separadamente (evitando joins complexos)
    const processedOrders = []
    
    for (const order of orders || []) {
      // Buscar dados do cliente se user_id existir
      let customerData = null
      if (order.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, phone')
          .eq('id', order.user_id)
          .single()
        
        customerData = profile
      }

      // Buscar itens do pedido
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('id, name, unit_price, total_price, quantity, size, toppings, special_instructions')
        .eq('order_id', order.id)

      // Processar dados para compatibilidade com o frontend
      const processedOrder = {
        ...order,
        // Aplicar lógica do COALESCE no frontend
        customer_display_name: customerData?.full_name || order.customer_name || 'Cliente',
        customer_display_phone: order.delivery_phone || customerData?.phone || '',
        // Adicionar itens do pedido
        order_items: orderItems || [],
        // Adicionar dados do cliente
        profiles: customerData
      }

      processedOrders.push(processedOrder)
    }

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

    // Preparar dados do pedido usando Supabase diretamente
    const orderData = {
      user_id,
      status: "PENDING",
      total,
      subtotal,
      delivery_fee,
      discount: 0,
      payment_method,
      payment_status: "PENDING",
      delivery_address,
      delivery_phone,
      delivery_instructions,
      estimated_delivery_time: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      customer_name
    }

    console.log("Criando pedido com dados:", orderData)

    // Criar o pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single()

    if (orderError) {
      console.error("Erro ao criar pedido:", orderError)
      throw orderError
    }

    console.log("Pedido criado com sucesso! ID:", order.id)

    // Criar itens do pedido
    const orderItems = items.map(item => {
      let product_id = item.product_id || item.id
      if (product_id) {
        product_id = product_id.toString().replace(/--+$/, '').trim()
      }

      return {
        order_id: order.id,
        product_id,
        name: item.name || '',
        unit_price: Number(item.price || item.unit_price || 0),
        total_price: Number(item.price || item.unit_price || 0) * Number(item.quantity || 1),
        quantity: Number(item.quantity || 1),
        size: item.size || null,
        toppings: item.toppings || [],
        special_instructions: item.notes || null,
        half_and_half: item.halfAndHalf || null
      }
    })

    console.log("Criando itens do pedido:", orderItems)

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error("Erro ao criar itens do pedido:", itemsError)
      throw itemsError
    }

    console.log("Itens do pedido criados com sucesso!")
    
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
