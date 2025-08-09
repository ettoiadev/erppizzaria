import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id
    const body = await request.json()
    const { driverId } = body

    console.log("PATCH /api/orders/[id]/assign-driver - Atribuindo entregador:", { orderId, driverId })

    // Validações
    if (!driverId) {
      return NextResponse.json(
        { error: "ID do entregador é obrigatório" },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServerClient()

    // Verificar se o entregador existe e está disponível
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id, name, status')
      .eq('id', driverId)
      .or('active.is.null,active.eq.true')
      .single()

    if (driverError || !driver) {
      return NextResponse.json(
        { error: "Entregador não encontrado" },
        { status: 404 }
      )
    }

    if (driver.status !== 'available') {
      return NextResponse.json(
        { error: "Entregador não está disponível" },
        { status: 400 }
      )
    }

    // Verificar se o pedido existe e está em preparo
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, driver_id, customer_address')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      )
    }

    if (order.status !== 'PREPARING' && order.status !== 'READY') {
      return NextResponse.json(
        { error: "Pedido não está disponível para atribuição de entregador" },
        { status: 400 }
      )
    }

    // Usar transação Supabase para garantir consistência
    try {
      // 1. Atualizar o pedido com o entregador e mudar status para ON_THE_WAY
      const { data: updatedOrder, error: orderUpdateError } = await supabase
        .from('orders')
        .update({
          driver_id: driverId,
          status: 'ON_THE_WAY',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select('id, status, total, customer_address, driver_id, created_at, updated_at')
        .single()

      if (orderUpdateError || !updatedOrder) {
        throw new Error('Falha ao atualizar pedido: ' + orderUpdateError?.message)
      }

      // 2. Atualizar status do entregador para busy
      const { data: updatedDriver, error: driverUpdateError } = await supabase
        .from('drivers')
        .update({
          status: 'busy',
          last_active_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', driverId)
        .select('id, name, status')
        .single()

      if (driverUpdateError || !updatedDriver) {
        // Tentar reverter o pedido se o driver falhou
        await supabase
          .from('orders')
          .update({
            driver_id: null,
            status: order.status, // voltar ao status anterior
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId)
        
        throw new Error('Falha ao atualizar entregador: ' + driverUpdateError?.message)
      }

      console.log("Entregador atribuído com sucesso:", {
        order: updatedOrder,
        driver: updatedDriver
      })

      return NextResponse.json({
        message: "Entregador atribuído com sucesso",
        order: updatedOrder,
        driver: updatedDriver
      })

    } catch (transactionError) {
      console.error("Erro na operação de atribuição:", transactionError);
      throw transactionError;
    }

  } catch (error: any) {
    console.error("Erro ao atribuir entregador:", error)
    
    return NextResponse.json({
      error: "Erro interno do servidor",
      message: "Erro ao atribuir entregador ao pedido",
      details: error.message
    }, { status: 500 })
  }
}