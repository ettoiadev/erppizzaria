import { NextRequest, NextResponse } from "next/server"
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[DRIVERS] Buscando entregador ID: ${params.id}`)

    // Buscar entregador por ID usando Supabase
    const { data: driver, error } = await supabase
      .from('drivers')
      .select('id, name, email, phone, vehicle_type, vehicle_plate, status, current_location, total_deliveries, average_rating, average_delivery_time, created_at, updated_at, last_active_at, active')
      .eq('id', params.id)
      .single()

    if (error || !driver) {
      console.error(`[DRIVERS] Entregador não encontrado:`, error)
      return NextResponse.json({
        error: "Entregador não encontrado",
        message: `Não existe entregador com ID ${params.id}`
      }, { status: 404 })
    }

    // Buscar pedidos ativos do entregador se estiver ocupado
    let currentOrders = []
    if (driver.status === 'busy') {
      try {
        const { data: orders } = await supabase
          .from('orders')
          .select('id')
          .eq('driver_id', driver.id)
          .eq('status', 'ON_THE_WAY')

        currentOrders = (orders || []).map((order: any) => order.id)
      } catch (orderError) {
        console.warn(`[DRIVERS] Erro ao buscar pedidos do entregador ${driver.id}:`, orderError)
      }
    }

    return NextResponse.json({
      driver: {
        ...driver,
        currentOrders
      }
    })

  } catch (error: any) {
    console.error(`[DRIVERS] Erro ao buscar entregador ${params.id}:`, error)
    
    return NextResponse.json({
      error: "Erro interno do servidor",
      message: "Erro ao buscar entregador no banco de dados"
    }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[DRIVERS] Atualizando entregador ID: ${params.id}`)

    const data = await request.json()
    const { name, email, phone, vehicleType, vehiclePlate, currentLocation, status } = data

    // Verificar se entregador existe
    const { data: existingDriver, error: checkError } = await supabase
      .from('drivers')
      .select('id')
      .eq('id', params.id)
      .single()

    if (checkError || !existingDriver) {
      return NextResponse.json({
        error: "Entregador não encontrado",
        message: `Não existe entregador com ID ${params.id}`
      }, { status: 404 })
    }

    // Construir objeto de atualização
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (vehicleType !== undefined) updateData.vehicle_type = vehicleType
    if (vehiclePlate !== undefined) updateData.vehicle_plate = vehiclePlate
    if (currentLocation !== undefined) updateData.current_location = currentLocation
    if (status !== undefined) {
      updateData.status = status
      updateData.last_active_at = new Date().toISOString()
    }

    // Atualizar entregador usando Supabase
    const { data: updatedDriver, error: updateError } = await supabase
      .from('drivers')
      .update(updateData)
      .eq('id', params.id)
      .select('id, name, email, phone, vehicle_type, vehicle_plate, status, current_location, total_deliveries, average_rating, average_delivery_time, created_at, updated_at, last_active_at, active')
      .single()

    if (updateError) {
      console.error(`[DRIVERS] Erro ao atualizar entregador:`, updateError)
      throw updateError
    }

    // Buscar pedidos atuais se necessário
    let currentOrders = []
    if (updatedDriver.status === 'busy') {
      try {
        const { data: orders } = await supabase
          .from('orders')
          .select('id')
          .eq('driver_id', updatedDriver.id)
          .eq('status', 'ON_THE_WAY')

        currentOrders = (orders || []).map((order: any) => order.id)
      } catch (orderError) {
        console.warn(`[DRIVERS] Erro ao buscar pedidos do entregador ${updatedDriver.id}:`, orderError)
      }
    }

    console.log(`[DRIVERS] Entregador atualizado com sucesso:`, updatedDriver.id)

    return NextResponse.json({
      message: "Entregador atualizado com sucesso",
      driver: {
        ...updatedDriver,
        currentOrders
      }
    })

  } catch (error: any) {
    console.error(`[DRIVERS] Erro ao atualizar entregador ${params.id}:`, error)
    
    return NextResponse.json({
      error: "Erro interno do servidor",
      message: "Erro ao atualizar entregador",
      details: error.message
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[DRIVERS] Iniciando exclusão do entregador ID: ${params.id}`)

    // Verificar se entregador existe
    const { data: existingDriver, error: checkError } = await supabase
      .from('drivers')
      .select('id, name, status')
      .eq('id', params.id)
      .single()

    if (checkError || !existingDriver) {
      return NextResponse.json({
        error: "Entregador não encontrado",
        message: `Não existe entregador com ID ${params.id}`
      }, { status: 404 })
    }

    // Verificar se entregador tem pedidos ativos
    const { data: activeOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('driver_id', params.id)
      .in('status', ['RECEIVED', 'PREPARING', 'ON_THE_WAY'])

    if (activeOrders && activeOrders.length > 0) {
      return NextResponse.json({
        error: "Não é possível excluir entregador",
        message: "Entregador possui pedidos ativos. Finalize ou reassine os pedidos primeiro.",
        activeOrdersCount: activeOrders.length
      }, { status: 400 })
    }

    // Soft delete: marcar como inativo ao invés de deletar
    const { error: deactivateError } = await supabase
      .from('drivers')
      .update({
        active: false,
        status: 'offline',
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (deactivateError) {
      console.error(`[DRIVERS] Erro ao desativar entregador:`, deactivateError)
      throw deactivateError
    }

    console.log(`[DRIVERS] Entregador ${existingDriver.name} desativado com sucesso`)

    return NextResponse.json({
      message: "Entregador removido com sucesso",
      driver: {
        id: params.id,
        name: existingDriver.name,
        status: "removed"
      }
    })

  } catch (error: any) {
    console.error(`[DRIVERS] Erro ao excluir entregador ${params.id}:`, error)
    
    return NextResponse.json({
      error: "Erro interno do servidor",
      message: "Erro ao excluir entregador",
      details: error.message
    }, { status: 500 })
  }
}
