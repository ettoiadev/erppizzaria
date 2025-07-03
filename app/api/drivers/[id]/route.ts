import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[DRIVERS] Buscando entregador ID: ${params.id}`)

    // Verificar se tabela drivers existe
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'drivers'
      ) as table_exists
    `)

    if (!tableCheck.rows[0].table_exists) {
      return NextResponse.json({
        error: "Tabela drivers não encontrada",
        message: "Execute o script setup-drivers-system.sql no pgAdmin4 primeiro"
      }, { status: 404 })
    }

    // Buscar entregador por ID
    const result = await query(`
      SELECT 
        id, name, email, phone, vehicle_type, vehicle_plate,
        status, current_location, total_deliveries, average_rating,
        average_delivery_time, created_at, updated_at, last_active_at
      FROM drivers 
      WHERE id = $1
    `, [params.id])

    if (result.rows.length === 0) {
      return NextResponse.json({
        error: "Entregador não encontrado",
        message: `Não existe entregador com ID ${params.id}`
      }, { status: 404 })
    }

    const driver = result.rows[0]

    // Buscar pedidos ativos do entregador
    let currentOrders = []
    if (driver.status === 'busy') {
      try {
        const ordersResult = await query(
          "SELECT id FROM orders WHERE driver_id = $1 AND status = 'ON_THE_WAY'",
          [driver.id]
        )
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
    
    if (error.code === 'ECONNREFUSED') {
      return NextResponse.json({
        error: "Não foi possível conectar ao PostgreSQL",
        message: "Verifique se o PostgreSQL está rodando"
      }, { status: 503 })
    }

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

    // Verificar se tabela drivers existe
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'drivers'
      ) as table_exists
    `)

    if (!tableCheck.rows[0].table_exists) {
      return NextResponse.json({
        error: "Tabela drivers não encontrada",
        message: "Execute o script setup-drivers-system.sql no pgAdmin4 primeiro"
      }, { status: 404 })
    }

    // Verificar se entregador existe
    const existsResult = await query(
      "SELECT id FROM drivers WHERE id = $1",
      [params.id]
    )

    if (existsResult.rows.length === 0) {
      return NextResponse.json({
        error: "Entregador não encontrado",
        message: `Não existe entregador com ID ${params.id}`
      }, { status: 404 })
    }

    // Construir query de atualização dinamicamente
    const updateFields = []
    const updateValues = []
    let paramCount = 1

    if (name !== undefined) {
      updateFields.push(`name = $${paramCount}`)
      updateValues.push(name)
      paramCount++
    }

    if (email !== undefined) {
      updateFields.push(`email = $${paramCount}`)
      updateValues.push(email)
      paramCount++
    }

    if (phone !== undefined) {
      updateFields.push(`phone = $${paramCount}`)
      updateValues.push(phone)
      paramCount++
    }

    if (vehicleType !== undefined) {
      updateFields.push(`vehicle_type = $${paramCount}`)
      updateValues.push(vehicleType)
      paramCount++
    }

    if (vehiclePlate !== undefined) {
      updateFields.push(`vehicle_plate = $${paramCount}`)
      updateValues.push(vehiclePlate)
      paramCount++
    }

    if (currentLocation !== undefined) {
      updateFields.push(`current_location = $${paramCount}`)
      updateValues.push(currentLocation)
      paramCount++
    }

    if (status !== undefined) {
      updateFields.push(`status = $${paramCount}`)
      updateValues.push(status)
      paramCount++
    }

    // Sempre atualizar updated_at
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`)

    // Se há mudança de status, atualizar last_active_at
    if (status !== undefined) {
      updateFields.push(`last_active_at = CURRENT_TIMESTAMP`)
    }

    if (updateFields.length === 0) {
      return NextResponse.json({
        error: "Nenhum campo para atualizar",
        message: "Forneça pelo menos um campo para atualizar"
      }, { status: 400 })
    }

    // Adicionar WHERE clause
    updateValues.push(params.id)
    const whereClause = `WHERE id = $${paramCount}`

    const updateQuery = `
      UPDATE drivers 
      SET ${updateFields.join(', ')}
      ${whereClause}
      RETURNING 
        id, name, email, phone, vehicle_type, vehicle_plate,
        status, current_location, total_deliveries, average_rating,
        average_delivery_time, created_at, updated_at, last_active_at
    `

    const result = await query(updateQuery, updateValues)
    const updatedDriver = result.rows[0]

    // Buscar pedidos atuais se necessário
    let currentOrders = []
    if (updatedDriver.status === 'busy') {
      try {
        const ordersResult = await query(
          "SELECT id FROM orders WHERE driver_id = $1 AND status = 'ON_THE_WAY'",
          [updatedDriver.id]
        )
        currentOrders = ordersResult.rows.map((order: any) => order.id)
      } catch (orderError) {
        console.warn(`[DRIVERS] Erro ao buscar pedidos:`, orderError)
      }
    }

    console.log(`[DRIVERS] Entregador ${params.id} atualizado com sucesso`)

    return NextResponse.json({
      driver: {
        ...updatedDriver,
        currentOrders
      },
      message: "Entregador atualizado com sucesso"
    })

  } catch (error: any) {
    console.error(`[DRIVERS] Erro ao atualizar entregador ${params.id}:`, error)
    
    if (error.code === '23505') {
      return NextResponse.json({
        error: "Email já cadastrado",
        message: "Já existe outro entregador com este email"
      }, { status: 400 })
    }

    if (error.code === 'ECONNREFUSED') {
      return NextResponse.json({
        error: "Não foi possível conectar ao PostgreSQL",
        message: "Verifique se o PostgreSQL está rodando"
      }, { status: 503 })
    }

    return NextResponse.json({
      error: "Erro interno do servidor",
      message: "Erro ao atualizar entregador no banco de dados"
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[DRIVERS] Iniciando exclusão do entregador ID: ${params.id}`)

    // Verificar se tabela drivers existe
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'drivers'
      ) as table_exists
    `)

    if (!tableCheck.rows[0].table_exists) {
      console.error('[DRIVERS] Tabela drivers não encontrada')
      return NextResponse.json({
        error: "Tabela drivers não encontrada",
        message: "Execute o script setup-drivers-system.sql no pgAdmin4 primeiro"
      }, { status: 404 })
    }

    // Verificar se entregador existe
    const existsResult = await query(
      "SELECT id, name, status, total_deliveries FROM drivers WHERE id = $1",
      [params.id]
    )

    if (existsResult.rows.length === 0) {
      console.error(`[DRIVERS] Entregador ${params.id} não encontrado`)
      return NextResponse.json({
        error: "Entregador não encontrado",
        message: `Não existe entregador com ID ${params.id}`
      }, { status: 404 })
    }

    const driver = existsResult.rows[0]
    console.log(`[DRIVERS] Verificando dependências para ${driver.name}`)

    // Verificar se existe coluna driver_id na tabela orders
    let hasDriverIdColumn = false
    try {
      const columnCheck = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'orders' 
          AND column_name = 'driver_id' 
          AND table_schema = 'public'
        ) as column_exists
      `)
      hasDriverIdColumn = columnCheck.rows[0].column_exists
      console.log(`[DRIVERS] Coluna driver_id existe na tabela orders: ${hasDriverIdColumn}`)
    } catch (columnError) {
      console.warn('[DRIVERS] Erro ao verificar coluna driver_id:', columnError)
    }

    // Verificar pedidos associados se a coluna existir
    let activeOrdersCount = 0
    let totalOrdersCount = 0
    let hasOrderHistory = false

    if (hasDriverIdColumn) {
      try {
        // Verificar pedidos ativos (em andamento)
        const activeOrdersResult = await query(
          "SELECT COUNT(*) as count FROM orders WHERE driver_id = $1 AND status IN ('ON_THE_WAY', 'PREPARING')",
          [params.id]
        )
        activeOrdersCount = parseInt(activeOrdersResult.rows[0].count) || 0

        // Verificar histórico total de pedidos
        const totalOrdersResult = await query(
          "SELECT COUNT(*) as count FROM orders WHERE driver_id = $1",
          [params.id]
        )
        totalOrdersCount = parseInt(totalOrdersResult.rows[0].count) || 0
        hasOrderHistory = totalOrdersCount > 0

        console.log(`[DRIVERS] Entregador ${driver.name}: ${activeOrdersCount} pedidos ativos, ${totalOrdersCount} pedidos no histórico`)
      } catch (ordersError) {
        console.warn('[DRIVERS] Erro ao verificar pedidos:', ordersError)
        // Continuar mesmo com erro na verificação de pedidos
      }
    }

    // REGRA 1: Impedir exclusão se há pedidos ativos
    if (activeOrdersCount > 0) {
      console.log(`[DRIVERS] Bloqueando exclusão - ${activeOrdersCount} pedidos ativos`)
      return NextResponse.json({
        error: "Não é possível remover entregador",
        message: `O entregador ${driver.name} possui ${activeOrdersCount} pedido(s) em andamento. Aguarde a conclusão das entregas.`,
        details: {
          activeOrders: activeOrdersCount,
          driverStatus: driver.status
        }
      }, { status: 400 })
    }

    // REGRA 2: Usar soft-delete se há histórico de entregas
    if (hasOrderHistory || (driver.total_deliveries && driver.total_deliveries > 0)) {
      console.log(`[DRIVERS] Aplicando soft-delete - entregador tem histórico de entregas`)
      
      // Verificar se existe coluna 'active' ou 'deleted_at'
      let hasSoftDeleteColumns = false
      try {
        const softDeleteCheck = await query(`
          SELECT 
            EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = 'drivers' AND column_name = 'active' AND table_schema = 'public'
            ) as has_active,
            EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = 'drivers' AND column_name = 'deleted_at' AND table_schema = 'public'
            ) as has_deleted_at
        `)
        
        const result = softDeleteCheck.rows[0]
        hasSoftDeleteColumns = result.has_active || result.has_deleted_at

        if (result.has_active) {
          // Usar coluna 'active'
          await query(
            "UPDATE drivers SET active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
            [params.id]
          )
          console.log(`[DRIVERS] Soft-delete aplicado usando coluna 'active'`)
        } else if (result.has_deleted_at) {
          // Usar coluna 'deleted_at'
          await query(
            "UPDATE drivers SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
            [params.id]
          )
          console.log(`[DRIVERS] Soft-delete aplicado usando coluna 'deleted_at'`)
        }
      } catch (softDeleteError) {
        console.warn('[DRIVERS] Erro na verificação de soft-delete:', softDeleteError)
      }

      // Se não tem colunas de soft-delete, adicionar uma estratégia alternativa
      if (!hasSoftDeleteColumns) {
        console.log(`[DRIVERS] Sem colunas de soft-delete disponíveis, mas preservando por segurança`)
        return NextResponse.json({
          error: "Não é possível remover entregador",
          message: `O entregador ${driver.name} possui histórico de ${totalOrdersCount} entrega(s) e não pode ser removido para preservar os dados históricos.`,
          suggestion: "Considere desativar o entregador em vez de removê-lo.",
          details: {
            totalDeliveries: driver.total_deliveries || 0,
            totalOrders: totalOrdersCount,
            hasHistory: true
          }
        }, { status: 400 })
      }

      return NextResponse.json({
        message: `Entregador ${driver.name} desativado com sucesso`,
        details: {
          action: "soft_delete",
          reason: "preservar_historico",
          totalDeliveries: driver.total_deliveries || 0,
          totalOrders: totalOrdersCount
        }
      })
    }

    // REGRA 3: Delete físico apenas se não há histórico
    console.log(`[DRIVERS] Aplicando delete físico - sem histórico de entregas`)
    
    // Usar transação para garantir consistência
    await query('BEGIN')
    
    try {
      // Remove referências em outras tabelas se necessário
      if (hasDriverIdColumn) {
        // Se existem referências, remove elas primeiro
        await query(
          "UPDATE orders SET driver_id = NULL WHERE driver_id = $1 AND status IN ('CANCELLED', 'DELIVERED')",
          [params.id]
        )
      }

      // Remove o entregador
      const deleteResult = await query(
        "DELETE FROM drivers WHERE id = $1 RETURNING name",
        [params.id]
      )

      if (deleteResult.rows.length === 0) {
        throw new Error('Nenhuma linha foi afetada na exclusão')
      }

      await query('COMMIT')
      console.log(`[DRIVERS] Delete físico concluído para ${driver.name}`)

      return NextResponse.json({
        message: `Entregador ${driver.name} removido com sucesso`,
        details: {
          action: "physical_delete",
          reason: "sem_historico"
        }
      })

    } catch (deleteError) {
      await query('ROLLBACK')
      console.error(`[DRIVERS] Erro durante delete físico:`, deleteError)
      throw deleteError
    }

  } catch (error: any) {
    console.error(`[DRIVERS] Erro ao processar exclusão do entregador ${params.id}:`, error)
    
    // Tratamento específico de erros
    if (error.code === '23503') {
      return NextResponse.json({
        error: "Violação de integridade referencial",
        message: "Este entregador possui pedidos associados e não pode ser removido. Os dados históricos devem ser preservados.",
        suggestion: "Desative o entregador em vez de removê-lo."
      }, { status: 400 })
    }

    if (error.code === 'ECONNREFUSED') {
      return NextResponse.json({
        error: "Falha na conexão com o banco de dados",
        message: "Não foi possível conectar ao PostgreSQL. Verifique se o servidor está rodando."
      }, { status: 503 })
    }

    if (error.code === '42P01') {
      return NextResponse.json({
        error: "Tabela não encontrada",
        message: "A estrutura do banco de dados está incompleta. Execute os scripts de migração."
      }, { status: 500 })
    }

    return NextResponse.json({
      error: "Erro interno do servidor",
      message: "Falha inesperada ao processar a exclusão do entregador.",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
