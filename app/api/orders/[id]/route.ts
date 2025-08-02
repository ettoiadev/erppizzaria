import { NextResponse, type NextRequest } from "next/server"
import { query } from '@/lib/postgres'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("GET /api/orders/[id] - Buscando pedido:", params.id)

    // Validar se o ID é um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(params.id)) {
      console.log("ID inválido fornecido:", params.id)
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    // Buscar pedido com dados relacionados usando PostgreSQL
    const orderResult = await query(`
      SELECT 
        o.*,
        p.full_name, p.email, p.phone as profile_phone
      FROM orders o
      LEFT JOIN profiles p ON o.user_id = p.id
      WHERE o.id = $1
    `, [params.id]);

    if (orderResult.rows.length === 0) {
      console.log("Pedido não encontrado:", params.id)
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    const order = orderResult.rows[0];

    // Buscar itens do pedido com dados do produto
    const itemsResult = await query(`
      SELECT 
        oi.*,
        pr.name as product_name,
        pr.description as product_description,
        pr.image_url as product_image
      FROM order_items oi
      LEFT JOIN products pr ON oi.product_id = pr.id
      WHERE oi.order_id = $1
      ORDER BY oi.created_at
    `, [order.id]);

    const orderItems = itemsResult.rows;

    // Processar itens para compatibilidade
    const processedItems = orderItems.map(item => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      price: item.unit_price, // Alias para compatibilidade
      size: item.size,
      toppings: item.toppings,
      special_instructions: item.special_instructions,
      half_and_half: item.half_and_half,
      // Aplicar lógica COALESCE
      name: item.product_name || item.name || 'Produto',
      description: item.product_description,
      image: item.product_image
    }));

    console.log("Pedido encontrado:", order.id, "com", processedItems.length, "itens")

    // Normalizar dados para compatibilidade
    const normalizedOrder = {
      ...order,
      // Aplicar lógica COALESCE
      full_name: order.full_name || null,
      phone: order.profile_phone || null,
      order_items: processedItems,
      items: processedItems, // Adicionar alias 'items'
      customer: {
        name: order.full_name || "Cliente",
        phone: order.profile_phone || order.customer_phone,
        address: order.customer_address
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
  } catch (error: any) {
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
    const updateFields = []
    const updateValues = []
    let paramIndex = 1

    if (status) {
      updateFields.push(`status = $${paramIndex}`)
      updateValues.push(status)
      paramIndex++
    }

    if (delivery_instructions !== undefined) {
      updateFields.push(`notes = $${paramIndex}`)
      updateValues.push(delivery_instructions)
      paramIndex++
    }

    if (estimated_delivery_time) {
      updateFields.push(`estimated_delivery_time = $${paramIndex}`)
      updateValues.push(estimated_delivery_time)
      paramIndex++
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 })
    }

    // Sempre atualizar updated_at
    updateFields.push(`updated_at = NOW()`)

    // Adicionar ID no final
    updateValues.push(params.id)

    // Atualizar usando PostgreSQL
    const updateResult = await query(`
      UPDATE orders 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, updateValues);

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    const updatedOrder = updateResult.rows[0];

    return NextResponse.json({ 
      message: "Pedido atualizado com sucesso",
      order: updatedOrder 
    })
  } catch (error: any) {
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
    const checkResult = await query(`
      SELECT status FROM orders WHERE id = $1
    `, [params.id]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    const order = checkResult.rows[0];

    // Apenas permitir exclusão de certos status
    if (!['RECEIVED', 'CANCELLED'].includes(order.status)) {
      return NextResponse.json({ 
        error: "Não é possível excluir pedidos em andamento" 
      }, { status: 400 })
    }

    // Excluir pedido usando PostgreSQL (cascade delete dos order_items devido à foreign key)
    const deleteResult = await query(`
      DELETE FROM orders WHERE id = $1
    `, [params.id]);

    if (deleteResult.rowCount === 0) {
      return NextResponse.json({ error: "Erro ao excluir pedido" }, { status: 500 })
    }

    return NextResponse.json({ message: "Pedido excluído com sucesso" })
  } catch (error: any) {
    console.error("Error deleting order:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}