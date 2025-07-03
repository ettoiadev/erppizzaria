import { NextRequest, NextResponse } from "next/server"
import { query, getClient } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id
    const { driverId } = await request.json()

    console.log("PATCH /api/orders/[id]/assign-driver - Atribuindo entregador:", { orderId, driverId })

    // Validação básica
    if (!driverId) {
      return NextResponse.json(
        { error: "Driver ID é obrigatório" },
        { status: 400 }
      )
    }

    // Verificar se o entregador existe e está disponível
    const driverQuery = `
      SELECT id, name, status, vehicle_type
      FROM drivers 
      WHERE id = $1
    `
    const driverResult = await query(driverQuery, [driverId])

    if (driverResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Entregador não encontrado" },
        { status: 404 }
      )
    }

    const driver = driverResult.rows[0]
    if (driver.status !== 'available') {
      return NextResponse.json(
        { error: "Entregador não está disponível" },
        { status: 400 }
      )
    }

    // Verificar se o pedido existe e está em preparo
    const orderQuery = `
      SELECT id, status, user_id, driver_id
      FROM orders 
      WHERE id = $1
    `
    const orderResult = await query(orderQuery, [orderId])

    if (orderResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      )
    }

    const order = orderResult.rows[0]
    if (order.status !== 'PREPARING') {
      return NextResponse.json(
        { error: "Pedido deve estar em preparo para atribuir entregador" },
        { status: 400 }
      )
    }

    // Usar getClient para transação
    const { client, release } = await getClient()
    
    try {
      await client.query('BEGIN')

      // 1. Atualizar o pedido com o entregador e mudar status para ON_THE_WAY
      const updateOrderQuery = `
        UPDATE orders 
        SET 
          driver_id = $1,
          status = 'ON_THE_WAY',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING 
          id, status, total, delivery_address, driver_id,
          created_at, updated_at
      `
      const updateOrderResult = await client.query(updateOrderQuery, [driverId, orderId])

      // 2. Atualizar status do entregador para busy
      const updateDriverQuery = `
        UPDATE drivers 
        SET 
          status = 'busy',
          last_active_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, name, status
      `
      const updateDriverResult = await client.query(updateDriverQuery, [driverId])

      await client.query('COMMIT')

      console.log("Entregador atribuído com sucesso:", {
        order: updateOrderResult.rows[0],
        driver: updateDriverResult.rows[0]
      })

      return NextResponse.json({
        message: "Entregador atribuído com sucesso",
        order: updateOrderResult.rows[0],
        driver: updateDriverResult.rows[0]
      })

    } catch (error) {
      await client.query('ROLLBACK')
      console.error("Erro na transação:", error)
      throw error
    } finally {
      release()
    }

  } catch (error: any) {
    console.error("Erro ao atribuir entregador:", error)
    
    // Tratamento específico de erros PostgreSQL
    if (error.code) {
      switch (error.code) {
        case '23505': // unique_violation
          return NextResponse.json(
            { error: "Entregador já atribuído a outro pedido" },
            { status: 400 }
          )
        case '23503': // foreign_key_violation
          return NextResponse.json(
            { error: "Referência inválida entre pedido e entregador" },
            { status: 400 }
          )
        case '22P02': // invalid_text_representation (UUID inválido)
          return NextResponse.json(
            { error: "ID inválido fornecido" },
            { status: 400 }
          )
        case '42883': // undefined_function 
          return NextResponse.json(
            { error: "Erro de estrutura do banco de dados" },
            { status: 500 }
          )
        default:
          console.error("Erro PostgreSQL não tratado:", error.code, error.message)
      }
    }

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

    // Buscar informações do pedido e entregador atual
    const orderQuery = `
      SELECT id, status, driver_id
      FROM orders 
      WHERE id = $1
    `
    const orderResult = await query(orderQuery, [orderId])

    if (orderResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      )
    }

    const order = orderResult.rows[0]
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

    // Usar getClient para transação
    const { client, release } = await getClient()
    
    try {
      await client.query('BEGIN')

      // 1. Remover entregador do pedido e voltar status para PREPARING
      const updateOrderQuery = `
        UPDATE orders 
        SET 
          driver_id = NULL,
          status = 'PREPARING',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, status, driver_id
      `
      const updateOrderResult = await client.query(updateOrderQuery, [orderId])

      // 2. Verificar se o entregador tem outros pedidos ativos
      const activeOrdersQuery = `
        SELECT COUNT(*) as count
        FROM orders 
        WHERE driver_id = $1 
        AND status IN ('ON_THE_WAY')
      `
      const activeOrdersResult = await client.query(activeOrdersQuery, [order.driver_id])

      // 3. Se não tem outros pedidos, voltar entregador para available
      if (parseInt(activeOrdersResult.rows[0].count) === 0) {
        const updateDriverQuery = `
          UPDATE drivers 
          SET 
            status = 'available',
            last_active_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING id, name, status
        `
        await client.query(updateDriverQuery, [order.driver_id])
      }

      await client.query('COMMIT')

      console.log("Entregador removido com sucesso:", updateOrderResult.rows[0])

      return NextResponse.json({
        message: "Entregador removido com sucesso",
        order: updateOrderResult.rows[0]
      })

    } catch (error) {
      await client.query('ROLLBACK')
      console.error("Erro na transação:", error)
      throw error
    } finally {
      release()
    }

  } catch (error: any) {
    console.error("Erro ao remover entregador:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    )
  }
} 