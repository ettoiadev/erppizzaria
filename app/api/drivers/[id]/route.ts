import { NextRequest, NextResponse } from "next/server"
import { query } from '@/lib/postgres'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[DRIVERS] Buscando entregador ID: ${params.id}`)

    // Buscar entregador por ID usando PostgreSQL
    const driverResult = await query(`
      SELECT 
        id, name, email, phone, vehicle_type, vehicle_plate, 
        status, current_location, total_deliveries, average_rating, 
        average_delivery_time, created_at, updated_at, last_active_at, active
      FROM drivers 
      WHERE id = $1 AND (active IS NULL OR active = true)
    `, [params.id]);

    if (driverResult.rows.length === 0) {
      console.error(`[DRIVERS] Entregador não encontrado: ${params.id}`)
      return NextResponse.json({
        error: "Entregador não encontrado",
        message: `Não existe entregador com ID ${params.id}`
      }, { status: 404 })
    }

    const driver = driverResult.rows[0];

    // Buscar pedidos ativos do entregador se estiver ocupado
    let currentOrders = []
    if (driver.status === 'busy') {
      try {
        const ordersResult = await query(`
          SELECT id FROM orders 
          WHERE driver_id = $1 AND status = 'OUT_FOR_DELIVERY'
        `, [driver.id]);

        currentOrders = ordersResult.rows.map((order: any) => order.id)
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
    const { name, email, phone, vehicleType, vehiclePlate, status, currentLocation } = data

    // Verificar se o entregador existe
    const existingResult = await query(`
      SELECT id FROM drivers WHERE id = $1 AND (active IS NULL OR active = true)
    `, [params.id]);

    if (existingResult.rows.length === 0) {
      return NextResponse.json({
        error: "Entregador não encontrado",
        message: `Não existe entregador com ID ${params.id}`
      }, { status: 404 })
    }

    // Preparar campos para atualização
    const updateFields = []
    const updateValues = []
    let paramIndex = 1

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex}`)
      updateValues.push(name.trim())
      paramIndex++
    }

    if (email !== undefined) {
      // Verificar se email já existe em outro entregador
      const emailCheckResult = await query(`
        SELECT id FROM drivers WHERE email = $1 AND id != $2
      `, [email.trim().toLowerCase(), params.id]);

      if (emailCheckResult.rows.length > 0) {
        return NextResponse.json({
          error: "Email já cadastrado",
          message: "Este email já está sendo usado por outro entregador"
        }, { status: 400 })
      }

      updateFields.push(`email = $${paramIndex}`)
      updateValues.push(email.trim().toLowerCase())
      paramIndex++
    }

    if (phone !== undefined) {
      updateFields.push(`phone = $${paramIndex}`)
      updateValues.push(phone.trim())
      paramIndex++
    }

    if (vehicleType !== undefined) {
      updateFields.push(`vehicle_type = $${paramIndex}`)
      updateValues.push(vehicleType)
      paramIndex++
    }

    if (vehiclePlate !== undefined) {
      updateFields.push(`vehicle_plate = $${paramIndex}`)
      updateValues.push(vehiclePlate?.trim().toUpperCase() || null)
      paramIndex++
    }

    if (status !== undefined) {
      updateFields.push(`status = $${paramIndex}`)
      updateValues.push(status)
      paramIndex++

      // Atualizar last_active_at quando status muda
      updateFields.push(`last_active_at = NOW()`)
    }

    if (currentLocation !== undefined) {
      updateFields.push(`current_location = $${paramIndex}`)
      updateValues.push(currentLocation ? JSON.stringify(currentLocation) : null)
      paramIndex++
    }

    // Sempre atualizar updated_at
    updateFields.push(`updated_at = NOW()`)

    if (updateFields.length === 1) { // Apenas updated_at
      return NextResponse.json({
        error: "Nenhum campo para atualizar",
        message: "Forneça pelo menos um campo para atualização"
      }, { status: 400 })
    }

    // Adicionar ID no final dos parâmetros
    updateValues.push(params.id)

    // Executar atualização
    const updateResult = await query(`
      UPDATE drivers 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, updateValues);

    const updatedDriver = updateResult.rows[0];
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

    // Verificar se o entregador existe
    const existingResult = await query(`
      SELECT id, name, status FROM drivers WHERE id = $1
    `, [params.id]);

    if (existingResult.rows.length === 0) {
      return NextResponse.json({
        error: "Entregador não encontrado",
        message: `Não existe entregador com ID ${params.id}`
      }, { status: 404 })
    }

    const driver = existingResult.rows[0];

    // Verificar se o entregador está ocupado
    if (driver.status === 'busy') {
      return NextResponse.json({
        error: "Entregador ocupado",
        message: "Não é possível remover um entregador que está fazendo entregas"
      }, { status: 400 })
    }

    // Soft delete - marcar como inativo
    await query(`
      UPDATE drivers 
      SET active = false, updated_at = NOW()
      WHERE id = $1
    `, [params.id]);

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