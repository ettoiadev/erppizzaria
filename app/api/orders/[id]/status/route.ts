import { NextRequest, NextResponse } from "next/server"
import { supabase } from '@/lib/supabase'

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
    const validStatuses = ['RECEIVED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED']
    if (!status || !validStatuses.includes(status)) {
      console.error("Status inválido:", status)
      return NextResponse.json({ 
        error: "Status inválido. Deve ser: " + validStatuses.join(', ') 
      }, { status: 400 })
    }

    console.log("Validação inicial concluída. Buscando pedido no banco...")

    // Verificar se o pedido existe e obter status atual usando Supabase
    const { data: currentOrder, error: orderError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', params.id)
      .single()

    if (orderError) {
      if (orderError.code === 'PGRST116') {
        console.error("Pedido não encontrado:", params.id)
        return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
      }
      throw orderError
    }

    console.log("Pedido encontrado:", currentOrder)

    // Prevenir regressão de status (lógica de negócio opcional)
    const statusOrder = ['RECEIVED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED']
    const currentIndex = statusOrder.indexOf(currentOrder.status)
    const newIndex = statusOrder.indexOf(status)

    if (status !== 'CANCELLED' && currentIndex > newIndex && currentIndex !== -1) {
      console.error("Tentativa de retroceder status:", { currentStatus: currentOrder.status, newStatus: status })
      return NextResponse.json({ 
        error: "Não é possível retroceder o status do pedido" 
      }, { status: 400 })
    }

    console.log("Atualizando status do pedido para:", status)

    // Preparar dados para atualização (aplicar lógica CASE WHEN no frontend)
    const updateData: any = {
      status: status,
      updated_at: new Date().toISOString()
    }

    // Aplicar lógica CASE WHEN no frontend
    if (status === 'DELIVERED') {
      updateData.delivered_at = new Date().toISOString()
    }

    if (status === 'CANCELLED') {
      updateData.cancelled_at = new Date().toISOString()
    }

    console.log("Dados de atualização:", updateData)

    // Atualizar pedido usando Supabase
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error("Erro ao atualizar pedido:", updateError)
      throw updateError
    }

    console.log("Pedido atualizado com sucesso")

    // Tentar inserir histórico de status (opcional - se a tabela não existir, ignorar)
    try {
      console.log("Tentando inserir histórico de status...")
      
      const { error: historyError } = await supabase
        .from('order_status_history')
        .insert({
          order_id: params.id,
          old_status: currentOrder.status,
          new_status: status,
          notes: notes || null,
          changed_at: new Date().toISOString()
        })

      if (historyError) {
        console.warn("Erro ao inserir histórico (ignorando):", historyError.message)
      } else {
        console.log("Histórico de status inserido com sucesso")
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
