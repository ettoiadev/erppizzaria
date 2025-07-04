import { type NextRequest, NextResponse } from "next/server"
import { supabase } from '@/lib/supabase'

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

    console.log("Verificando se o cliente existe...")

    // Verificar se o cliente existe usando Supabase
    const { data: customer, error: customerError } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .eq('id', userId)
      .eq('role', 'customer')
      .single()

    if (customerError) {
      if (customerError.code === 'PGRST116') {
        return NextResponse.json({
          error: "Cliente não encontrado ou inválido"
        }, { status: 404 })
      }
      throw customerError
    }

    console.log("Cliente encontrado:", customer.full_name)

    // Criar pedido manual usando Supabase
    console.log("Criando pedido manual...")
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        status: "RECEIVED",
        total: total,
        subtotal: subtotal,
        delivery_fee: delivery_fee,
        discount: 0,
        payment_method: paymentMethod,
        payment_status: "PENDING",
        delivery_address: finalDeliveryAddress,
        delivery_phone: customerPhone,
        delivery_instructions: notes || null,
        estimated_delivery_time: new Date(Date.now() + 45 * 60 * 1000).toISOString(), // 45 minutos
        customer_name: customerName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (orderError) {
      console.error("Erro ao criar pedido manual:", orderError)
      throw orderError
    }

    console.log("Pedido manual criado com sucesso! ID:", order.id)

    // Inserir itens do pedido usando Supabase
    console.log(`Inserindo ${items.length} itens no pedido manual...`)
    
    const orderItems = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const unit_price = Number(item.price || item.unit_price || 0)
      const quantity = Number(item.quantity || 1)
      
      // Limpar product_id
      let product_id = item.product_id || item.id
      if (product_id) {
        product_id = product_id.toString().replace(/--+$/, '').trim()
      }

      console.log(`Preparando item ${i + 1}:`, {
        product_id,
        name: item.name,
        quantity,
        unit_price,
        size: item.size,
        toppings: item.toppings,
        notes: item.notes,
        isHalfAndHalf: item.isHalfAndHalf,
        halfAndHalf: item.halfAndHalf
      })

      if (!product_id) {
        return NextResponse.json({
          error: `Item ${i + 1} não possui ID do produto`
        }, { status: 400 })
      }

      // Validar UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(product_id)) {
        return NextResponse.json({
          error: `Item ${i + 1} possui ID de produto inválido: ${product_id}`
        }, { status: 400 })
      }

      orderItems.push({
        order_id: order.id,
        product_id: product_id,
        name: item.name || '',
        quantity: quantity,
        unit_price: unit_price,
        total_price: quantity * unit_price,
        size: item.size || null,
        toppings: JSON.stringify(item.toppings || []),
        special_instructions: item.notes || null,
        half_and_half: item.halfAndHalf ? JSON.stringify(item.halfAndHalf) : null
      })
    }

    // Inserir todos os itens de uma vez
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error("Erro ao inserir itens do pedido:", itemsError)
      
      // Tentar deletar o pedido criado se falhar ao inserir itens
      await supabase
        .from('orders')
        .delete()
        .eq('id', order.id)
      
      throw itemsError
    }

    console.log("Todos os itens inseridos com sucesso!")

    // Buscar pedido completo com itens para retornar
    const { data: completeOrder, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          name,
          quantity,
          unit_price,
          total_price,
          size,
          toppings,
          special_instructions,
          half_and_half
        )
      `)
      .eq('id', order.id)
      .single()

    if (fetchError) {
      console.error("Erro ao buscar pedido completo:", fetchError)
      // Não falhar se não conseguir buscar o pedido completo
    }

    console.log("Pedido manual criado com sucesso!")

    return NextResponse.json({
      success: true,
      message: "Pedido manual criado com sucesso!",
      order: completeOrder || order,
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