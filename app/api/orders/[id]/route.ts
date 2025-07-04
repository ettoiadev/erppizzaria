import { NextResponse, type NextRequest } from "next/server"
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("GET /api/orders/[id] - Buscando pedido:", params.id)

    // Buscar pedido básico usando Supabase
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', params.id)
      .single()

    if (orderError) {
      if (orderError.code === 'PGRST116') {
        console.log("Pedido não encontrado:", params.id)
        return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
      }
      throw orderError
    }

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
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id)

    if (itemsError) {
      console.error("Erro ao buscar itens do pedido:", itemsError)
      throw itemsError
    }

    // Para cada item, buscar dados do produto
    const processedItems = []
    for (const item of orderItems || []) {
      let productData = null
      if (item.product_id) {
        const { data: product } = await supabase
          .from('products')
          .select('name, description, image')
          .eq('id', item.product_id)
          .single()
        
        productData = product
      }

      processedItems.push({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        price: item.unit_price, // Alias para compatibilidade
        size: item.size,
        toppings: item.toppings,
        special_instructions: item.special_instructions,
        // Aplicar lógica COALESCE no frontend
        name: productData?.name || item.name || 'Produto'
      })
    }

    console.log("Pedido encontrado:", order.id, "com", processedItems.length, "itens")

    // Normalizar dados para compatibilidade
    const normalizedOrder = {
      ...order,
      // Aplicar lógica COALESCE no frontend
      full_name: customerData?.full_name || null,
      phone: customerData?.phone || null,
      order_items: processedItems,
      items: processedItems, // Adicionar alias 'items'
      customer: {
        name: customerData?.full_name || "Cliente",
        phone: customerData?.phone || order.delivery_phone,
        address: order.delivery_address
      },
      createdAt: order.created_at,
      estimatedDelivery: order.estimated_delivery_time,
      paymentMethod: order.payment_method
    }

    console.log("Dados normalizados:", {
      id: normalizedOrder.id,
      items_count: normalizedOrder.items.length,
      customer_name: normalizedOrder.customer.name
    })

    return NextResponse.json(normalizedOrder)
  } catch (error) {
    console.error("Error fetching order:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, delivery_instructions, estimated_delivery_time } = body

    // Preparar dados para atualização
    const updateData: any = {}

    if (status) {
      updateData.status = status
    }

    if (delivery_instructions !== undefined) {
      updateData.delivery_instructions = delivery_instructions
    }

    if (estimated_delivery_time) {
      updateData.estimated_delivery_time = estimated_delivery_time
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 })
    }

    updateData.updated_at = new Date().toISOString()

    // Atualizar usando Supabase
    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({ 
      message: "Pedido atualizado com sucesso",
      order: updatedOrder 
    })
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Primeiro verificar se o pedido existe
    const { data: order, error: checkError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', params.id)
      .single()

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
      }
      throw checkError
    }

    // Apenas permitir exclusão de certos status
    if (!['RECEIVED', 'CANCELLED'].includes(order.status)) {
      return NextResponse.json({ 
        error: "Não é possível excluir pedidos em andamento" 
      }, { status: 400 })
    }

    // Excluir pedido usando Supabase (isso irá fazer cascade delete dos order_items devido à foreign key)
    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ message: "Pedido excluído com sucesso" })
  } catch (error) {
    console.error("Error deleting order:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
