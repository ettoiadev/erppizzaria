import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("GET /api/orders/[id] - Buscando pedido:", params.id)

    const result = await query(
      `
      SELECT o.*, 
             p.full_name, p.phone,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', oi.id,
                   'product_id', oi.product_id,
                   'quantity', oi.quantity,
                   'unit_price', oi.unit_price,
                   'total_price', oi.total_price,
                   'price', oi.unit_price,
                   'size', oi.size,
                   'toppings', oi.toppings,
                   'special_instructions', oi.special_instructions,
                   'name', COALESCE(pr.name, 'Produto')
                 ) ORDER BY oi.created_at
               ) FILTER (WHERE oi.id IS NOT NULL),
               '[]'::json
             ) as order_items
      FROM orders o
      LEFT JOIN profiles p ON o.user_id = p.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products pr ON oi.product_id = pr.id
      WHERE o.id = $1
      GROUP BY o.id, p.full_name, p.phone
      `,
      [params.id]
    )

    if (result.rows.length === 0) {
      console.log("Pedido não encontrado:", params.id)
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    const order = result.rows[0]
    console.log("Pedido encontrado:", order.id, "com", order.order_items?.length || 0, "itens")

    // Normalizar dados para compatibilidade
    const normalizedOrder = {
      ...order,
      items: order.order_items || [], // Adicionar alias 'items'
      customer: {
        name: order.full_name || "Cliente",
        phone: order.phone || order.delivery_phone,
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

    // Build dynamic update query
    const updates = []
    const values = []
    let paramCount = 1

    if (status) {
      updates.push(`status = $${paramCount}`)
      values.push(status)
      paramCount++
    }

    if (delivery_instructions !== undefined) {
      updates.push(`delivery_instructions = $${paramCount}`)
      values.push(delivery_instructions)
      paramCount++
    }

    if (estimated_delivery_time) {
      updates.push(`estimated_delivery_time = $${paramCount}`)
      values.push(estimated_delivery_time)
      paramCount++
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 })
    }

    updates.push(`updated_at = NOW()`)
    values.push(params.id)

    const updateQuery = `
      UPDATE orders 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `

    const result = await query(updateQuery, values)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    const updatedOrder = result.rows[0]
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
    // First check if order exists
    const checkResult = await query(
      'SELECT status FROM orders WHERE id = $1',
      [params.id]
    )

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    const order = checkResult.rows[0]

    // Only allow deletion of certain statuses
    if (!['RECEIVED', 'CANCELLED'].includes(order.status)) {
      return NextResponse.json({ 
        error: "Não é possível excluir pedidos em andamento" 
      }, { status: 400 })
    }

    // Delete order (this will cascade delete order_items due to foreign key constraint)
    const deleteResult = await query(
      'DELETE FROM orders WHERE id = $1 RETURNING id',
      [params.id]
    )

    if (deleteResult.rows.length === 0) {
      return NextResponse.json({ error: "Falha ao excluir pedido" }, { status: 500 })
    }

    return NextResponse.json({ message: "Pedido excluído com sucesso" })
  } catch (error) {
    console.error("Error deleting order:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
