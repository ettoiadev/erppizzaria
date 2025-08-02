import { NextRequest, NextResponse } from "next/server"
import { query } from '@/lib/postgres'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("=== PATCH /api/orders/[id]/status - INÍCIO ===")
    console.log("Order ID:", params.id)
    
    const body = await request.json()
    const { status, notes } = body
    
    console.log("Dados recebidos:", { status, notes })

    // Validate status
    const validStatuses = ['RECEIVED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']
    if (!status || !validStatuses.includes(status)) {
      console.error("Status inválido:", status)
      return NextResponse.json({ 
        error: "Status inválido. Deve ser: " + validStatuses.join(', ') 
      }, { status: 400 })
    }

    console.log("Validação inicial concluída. Buscando pedido no banco...")

    // Verificar se o pedido existe e obter status atual usando PostgreSQL
    const currentOrderResult = await query(`
      SELECT id, status FROM orders WHERE id = $1
    `, [params.id]);

    if (currentOrderResult.rows.length === 0) {
      console.error("Pedido não encontrado:", params.id)
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    const currentOrder = currentOrderResult.rows[0];
    console.log("Pedido encontrado:", currentOrder)

    // Prevenir regressão de status (lógica de negócio opcional)
    const statusOrder = ['RECEIVED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED']
    const currentIndex = statusOrder.indexOf(currentOrder.status)
    const newIndex = statusOrder.indexOf(status)

    if (status !== 'CANCELLED' && currentIndex > newIndex && currentIndex !== -1) {
      console.error("Tentativa de retroceder status:", { currentStatus: currentOrder.status, newStatus: status })
      return NextResponse.json({ 
        error: "Não é possível retroceder o status do pedido" 
      }, { status: 400 })
    }

    console.log("Atualizando status do pedido para:", status)

    // Preparar dados para atualização
    const updateFields = ['status = $1', 'updated_at = NOW()']
    const updateValues = [status]
    let paramIndex = 2

    // Aplicar lógica CASE WHEN
    if (status === 'DELIVERED') {
      updateFields.push(`delivered_at = NOW()`)
    }

    if (notes) {
      updateFields.push(`notes = $${paramIndex}`)
      updateValues.push(notes)
      paramIndex++
    }

    console.log("Dados de atualização:", { status, notes })

    // Atualizar pedido usando PostgreSQL
    updateValues.push(params.id);
    const updateResult = await query(`
      UPDATE orders 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, updateValues);

    if (updateResult.rows.length === 0) {
      console.error("Erro ao atualizar pedido - nenhuma linha afetada")
      return NextResponse.json({ error: "Erro ao atualizar pedido" }, { status: 500 })
    }

    const updatedOrder = updateResult.rows[0];
    console.log("Pedido atualizado com sucesso")

    // Tentar inserir histórico de status (opcional - se a tabela não existir, ignorar)
    try {
      console.log("Tentando inserir histórico de status...")
      
      // Primeiro verificar se a tabela existe
      const tableExistsResult = await query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'order_status_history'
        ) as exists
      `);

      if (tableExistsResult.rows[0].exists) {
        await query(`
          INSERT INTO order_status_history (order_id, old_status, new_status, notes, changed_at)
          VALUES ($1, $2, $3, $4, NOW())
        `, [params.id, currentOrder.status, status, notes || null]);

        console.log("Histórico de status inserido com sucesso")
      } else {
        console.log("Tabela order_status_history não existe - pulando histórico")
      }
    } catch (historyError: any) {
      console.warn("Erro ao inserir histórico (ignorando):", historyError.message)
      // Não falhar se a tabela de histórico não existir
    }

    console.log("Operação concluída com sucesso")

    return NextResponse.json({
      message: "Status do pedido atualizado com sucesso",
      order: updatedOrder
    })
  } catch (error: any) {
    console.error("=== ERRO COMPLETO NO PATCH /api/orders/[id]/status ===")
    console.error("Tipo:", error.constructor.name)
    console.error("Mensagem:", error.message)
    console.error("Stack:", error.stack)
    
    if (error.code) {
      console.error("Código:", error.code)
      console.error("Detalhe:", error.details)
    }
    
    return NextResponse.json({ 
      error: error.message || "Erro interno do servidor",
      details: {
        type: error.constructor.name,
        code: error.code,
        message: error.message
      }
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