import { NextRequest, NextResponse } from "next/server"
import { supabase } from '@/lib/supabase'

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

    // Verificar se o entregador existe e está disponível usando Supabase
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id, name, status')
      .eq('id', driverId)
      .single()

    if (driverError) {
      if (driverError.code === 'PGRST116') {
        return NextResponse.json(
          { error: "Entregador não encontrado" },
          { status: 404 }
        )
      }
      throw driverError
    }

    if (driver.status !== 'available') {
      return NextResponse.json(
        { error: "Entregador não está disponível" },
        { status: 400 }
      )
    }

    // Verificar se o pedido existe e está em preparo usando Supabase
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, driver_id')
      .eq('id', orderId)
      .single()

    if (orderError) {
      if (orderError.code === 'PGRST116') {
        return NextResponse.json(
          { error: "Pedido não encontrado" },
          { status: 404 }
        )
      }
      throw orderError
    }

    if (order.status !== 'PREPARING') {
      return NextResponse.json(
        { error: "Pedido deve estar em preparo para atribuir entregador" },
        { status: 400 }
      )
    }

    // Usar transação do Supabase RPC ou fazer atualizações sequenciais
    // Como o Supabase não suporta transações diretas no client, vamos fazer as atualizações sequenciais
    
    try {
      // 1. Atualizar o pedido com o entregador e mudar status para ON_THE_WAY
      const { data: updatedOrder, error: updateOrderError } = await supabase
        .from('orders')
        .update({
          driver_id: driverId,
          status: 'ON_THE_WAY',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select('id, status, total, delivery_address, driver_id, created_at, updated_at')
        .single()

      if (updateOrderError) {
        throw updateOrderError
      }

      // 2. Atualizar status do entregador para busy
      const { data: updatedDriver, error: updateDriverError } = await supabase
        .from('drivers')
        .update({
          status: 'busy',
          last_active_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', driverId)
        .select('id, name, status')
        .single()

      if (updateDriverError) {
        // Se falhar ao atualizar o driver, reverter o pedido
        await supabase
          .from('orders')
          .update({
            driver_id: null,
            status: 'PREPARING',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId)
        
        throw updateDriverError
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

    } catch (error) {
      console.error("Erro ao atribuir entregador:", error)
      throw error
    }

  } catch (error: any) {
    console.error("Erro ao atribuir entregador:", error)
    
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id

    console.log("DELETE /api/orders/[id]/assign-driver - Removendo entregador:", orderId)

    // Buscar informações do pedido usando Supabase
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, driver_id')
      .eq('id', orderId)
      .single()

    if (orderError) {
      if (orderError.code === 'PGRST116') {
        return NextResponse.json(
          { error: "Pedido não encontrado" },
          { status: 404 }
        )
      }
      throw orderError
    }

    if (!order.driver_id) {
      return NextResponse.json(
        { error: "Pedido não tem entregador atribuído" },
        { status: 400 }
      )
    }

    if (order.status === 'DELIVERED') {
      return NextResponse.json(
        { error: "Não é possível remover entregador de pedido já entregue" },
        { status: 400 }
      )
    }

    try {
      // 1. Remover entregador do pedido e voltar status para PREPARING
      const { data: updatedOrder, error: updateOrderError } = await supabase
        .from('orders')
        .update({
          driver_id: null,
          status: 'PREPARING',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select('id, status, driver_id')
        .single()

      if (updateOrderError) {
        throw updateOrderError
      }

      // 2. Verificar se o entregador tem outros pedidos ativos
      const { count: activeOrdersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('driver_id', order.driver_id)
        .in('status', ['ON_THE_WAY'])

      // 3. Se não tem outros pedidos, voltar entregador para available
      if ((activeOrdersCount || 0) === 0) {
        const { error: updateDriverError } = await supabase
          .from('drivers')
          .update({
            status: 'available',
            last_active_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', order.driver_id)

        if (updateDriverError) {
          console.error("Erro ao atualizar status do entregador:", updateDriverError)
          // Não falhar a operação se não conseguir atualizar o driver
        }
      }

      console.log("Entregador removido com sucesso:", updatedOrder)

      return NextResponse.json({
        message: "Entregador removido com sucesso",
        order: updatedOrder
      })

    } catch (error) {
      console.error("Erro ao remover entregador:", error)
      throw error
    }

  } catch (error: any) {
    console.error("Erro ao remover entregador:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    )
  }
} 