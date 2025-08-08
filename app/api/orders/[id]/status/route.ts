import { NextRequest, NextResponse } from "next/server"
import { query } from '@/lib/postgres'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id
    const body = await request.json()
    const { status, notes } = body

    console.log("PATCH /api/orders/[id]/status - Atualizando status:", { orderId, status, notes })

    // Validar status
    const validStatuses = ['RECEIVED', 'PREPARING', 'READY', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED']
    
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Status inválido" },
        { status: 400 }
      )
    }

    // Verificar se o pedido existe
    const orderResult = await query(`
      SELECT id, status FROM orders WHERE id = $1
    `, [orderId]);

    if (orderResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      )
    }

    const currentOrder = orderResult.rows[0];

    // Validar transição de status
    const statusOrder = ['RECEIVED', 'PREPARING', 'READY', 'ON_THE_WAY', 'DELIVERED']
    const currentIndex = statusOrder.indexOf(currentOrder.status)
    const newIndex = statusOrder.indexOf(status)

    if (newIndex < currentIndex && status !== 'CANCELLED') {
      return NextResponse.json(
        { error: "Não é possível voltar o status do pedido" },
        { status: 400 }
      )
    }

    // Atualizar status do pedido
    const updateResult = await query(`
      UPDATE orders 
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [status, orderId]);

    if (updateResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Falha ao atualizar status" },
        { status: 500 }
      )
    }

    const updatedOrder = updateResult.rows[0];

    // Se houver notas, salvar no histórico
    if (notes) {
      await query(`
        INSERT INTO order_status_history (order_id, driver_id, old_status, new_status, notes, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [orderId, null, currentOrder.status, status, notes]);
    }

    console.log("Status atualizado com sucesso:", updatedOrder)

    return NextResponse.json({
      message: "Status atualizado com sucesso",
      order: updatedOrder
    })

  } catch (error: any) {
    console.error("Erro ao atualizar status:", error)
    
    return NextResponse.json({
      error: "Erro interno do servidor",
      message: "Erro ao atualizar status do pedido",
      details: error.message
    }, { status: 500 })
  }
}

// Handle DELETE requests (redirect to PATCH with CANCELLED status)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("=== DELETE /api/orders/[id]/status - REDIRECIONANDO PARA PATCH ===")
    console.log("Order ID:", params.id)
    
    // Parse body to get cancellation notes if provided
    let notes = null
    try {
      const body = await request.json()
      notes = body.notes || body.motivoCancelamento || null
      console.log("Notas de cancelamento:", notes)
    } catch (parseError) {
      console.log("Nenhuma nota de cancelamento fornecida")
    }

    // Create a new request with PATCH method
    const patchRequest = new NextRequest(request.url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        status: 'CANCELLED', 
        notes: notes 
      })
    })

    // Call the PATCH handler
    return await PATCH(patchRequest, { params })
  } catch (error: any) {
    console.error("=== ERRO COMPLETO NO DELETE /api/orders/[id]/status ===")
    console.error("Erro:", error.message)
    
    return NextResponse.json({ 
      error: error.message || "Erro interno do servidor",
      details: {
        type: error.constructor.name,
        message: error.message
      }
    }, { status: 500 })
  }
}