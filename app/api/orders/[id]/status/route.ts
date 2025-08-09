import { NextRequest, NextResponse } from "next/server"
import { updateOrderStatus, getOrderById } from '@/lib/db-supabase'
import { emitRealtimeEvent, EVENT_ORDER_STATUS_UPDATED } from '@/lib/realtime'

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

    // Buscar pedido atual para validar transição de status
    const currentOrder = await getOrderById(orderId)
    if (!currentOrder) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      )
    }

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

    const updatedOrder = await updateOrderStatus(orderId, status, notes || null)

    // Se houver notas, salvar no histórico
    // Histórico já é gerenciado dentro de updateOrderStatus se necessário

    console.log("Status atualizado com sucesso:", updatedOrder)

    // Emitir evento Realtime de atualização de status
    try {
      await emitRealtimeEvent(EVENT_ORDER_STATUS_UPDATED, {
        orderId,
        status,
        order: updatedOrder,
      })
    } catch (e) {
      console.warn('⚠️ Falha ao emitir evento Realtime (order_status_updated):', (e as Error)?.message)
    }

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