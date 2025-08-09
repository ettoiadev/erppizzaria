import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[DRIVERS] Buscando entregador ID: ${params.id}`)

    const supabase = getSupabaseServerClient()

    // Buscar entregador por ID usando Supabase
    const { data: driver, error } = await supabase
      .from('drivers')
      .select('id, name, email, phone, vehicle_type, vehicle_plate, status, current_location, total_deliveries, average_rating, average_delivery_time, created_at, updated_at, last_active_at, active')
      .eq('id', params.id)
      .or('active.is.null,active.eq.true')
      .single()

    if (error || !driver) {
      console.error(`[DRIVERS] Entregador não encontrado: ${params.id}`, error)
      return NextResponse.json({
        error: "Entregador não encontrado",
        message: `Não existe entregador com ID ${params.id}`
      }, { status: 404 })
    }

    // Buscar pedidos ativos do entregador se estiver ocupado
    let currentOrders = []
    if (driver.status === 'busy') {
      try {
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('id, status, total, customer_address, created_at')
          .eq('driver_id', driver.id)
          .eq('status', 'ON_THE_WAY')
          .order('created_at', { ascending: false })

        if (!ordersError && orders) {
          currentOrders = orders.map((order: any) => order.id)
        }
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
    
    const supabase = getSupabaseServerClient()
    const data = await request.json()
    const { name, email, phone, vehicleType, vehiclePlate, status, currentLocation } = data

    // Verificar se o entregador existe
    const { data: existing, error: existingError } = await supabase
      .from('drivers')
      .select('id')
      .eq('id', params.id)
      .or('active.is.null,active.eq.true')
      .single()

    if (existingError || !existing) {
      return NextResponse.json({
        error: "Entregador não encontrado",
        message: `Não existe entregador com ID ${params.id}`
      }, { status: 404 })
    }

    // Preparar campos para atualização
    const updateData: any = {}

    if (name !== undefined) {
      updateData.name = name.trim()
    }

    if (email !== undefined) {
      // Verificar se email já existe em outro entregador
      const { data: emailCheck, error: emailError } = await supabase
        .from('drivers')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .neq('id', params.id)
        .single()

      if (emailCheck) {
        return NextResponse.json({
          error: "Email já cadastrado",
          message: "Este email já está sendo usado por outro entregador"
        }, { status: 400 })
      }

      updateData.email = email.trim().toLowerCase()
    }

    if (phone !== undefined) {
      updateData.phone = phone.trim()
    }

    if (vehicleType !== undefined) {
      updateData.vehicle_type = vehicleType
    }

    if (vehiclePlate !== undefined) {
      updateData.vehicle_plate = vehiclePlate?.trim().toUpperCase() || null
    }

    if (status !== undefined) {
      updateData.status = status
      updateData.last_active_at = new Date().toISOString()
    }

    if (currentLocation !== undefined) {
      updateData.current_location = currentLocation || null
    }

    // Sempre atualizar updated_at
    updateData.updated_at = new Date().toISOString()

    if (Object.keys(updateData).length === 1) { // Apenas updated_at
      return NextResponse.json({
        error: "Nenhum campo para atualizar",
        message: "Forneça pelo menos um campo para atualização"
      }, { status: 400 })
    }

    // Executar atualização
    const { data: updatedDriver, error: updateError } = await supabase
      .from('drivers')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) throw updateError

    console.log(`[DRIVERS] Entregador ${params.id} atualizado com sucesso`)

    return NextResponse.json({
      message: "Entregador atualizado com sucesso",
      driver: updatedDriver
    })

  } catch (error: any) {
    console.error(`[DRIVERS] Erro ao atualizar entregador ${params.id}:`, error)
    
    return NextResponse.json({
      error: "Erro interno do servidor",
      message: "Erro ao atualizar entregador no banco de dados",
      details: error.message
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[DRIVERS] Removendo entregador ID: ${params.id}`)

    const supabase = getSupabaseServerClient()

    // Verificar se o entregador existe
    const { data: driver, error: existingError } = await supabase
      .from('drivers')
      .select('id, name, status')
      .eq('id', params.id)
      .single()

    if (existingError || !driver) {
      return NextResponse.json({
        error: "Entregador não encontrado",
        message: `Não existe entregador com ID ${params.id}`
      }, { status: 404 })
    }

    // Verificar se o entregador está ocupado
    if (driver.status === 'busy') {
      return NextResponse.json({
        error: "Entregador ocupado",
        message: "Não é possível remover um entregador que está fazendo entregas"
      }, { status: 400 })
    }

    // Soft delete - marcar como inativo
    const { error: deleteError } = await supabase
      .from('drivers')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', params.id)

    if (deleteError) throw deleteError

    console.log(`[DRIVERS] Entregador ${driver.name} marcado como inativo`)

    return NextResponse.json({
      message: "Entregador removido com sucesso",
      driver: {
        id: params.id,
        name: driver.name
      }
    })

  } catch (error: any) {
    console.error(`[DRIVERS] Erro ao remover entregador ${params.id}:`, error)
    
    return NextResponse.json({
      error: "Erro interno do servidor",
      message: "Erro ao remover entregador do banco de dados"
    }, { status: 500 })
  }
}