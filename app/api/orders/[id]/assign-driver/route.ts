import { NextRequest, NextResponse } from "next/server"
import { query } from '@/lib/postgres'

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

    // Verificar se o entregador existe e está disponível
    const driverResult = await query(`
      SELECT id, name, status FROM drivers 
      WHERE id = $1 AND (active IS NULL OR active = true)
    `, [driverId]);

    if (driverResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Entregador não encontrado" },
        { status: 404 }
      )
    }

    const driver = driverResult.rows[0];

    if (driver.status !== 'available') {
      return NextResponse.json(
        { error: "Entregador não está disponível" },
        { status: 400 }
      )
    }

    // Verificar se o pedido existe e está em preparo
    const orderResult = await query(`
      SELECT id, status, driver_id, customer_address FROM orders 
      WHERE id = $1
    `, [orderId]);

    if (orderResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      )
    }

    const order = orderResult.rows[0];

    if (order.status !== 'PREPARING' && order.status !== 'READY') {
      return NextResponse.json(
        { error: "Pedido não está disponível para atribuição de entregador" },
        { status: 400 }
      )
    }

    // Usar transação para garantir consistência
    try {
      // Iniciar transação
      await query('BEGIN');

      // 1. Atualizar o pedido com o entregador e mudar status para OUT_FOR_DELIVERY
      const updatedOrderResult = await query(`
        UPDATE orders 
        SET 
          driver_id = $1,
          status = 'OUT_FOR_DELIVERY',
          updated_at = NOW()
        WHERE id = $2
        RETURNING id, status, total, customer_address, driver_id, created_at, updated_at
      `, [driverId, orderId]);

      if (updatedOrderResult.rows.length === 0) {
        throw new Error('Falha ao atualizar pedido');
      }

      const updatedOrder = updatedOrderResult.rows[0];

      // 2. Atualizar status do entregador para busy
      const updatedDriverResult = await query(`
        UPDATE drivers 
        SET 
          status = 'busy',
          last_active_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
        RETURNING id, name, status
      `, [driverId]);

      if (updatedDriverResult.rows.length === 0) {
        throw new Error('Falha ao atualizar entregador');
      }

      const updatedDriver = updatedDriverResult.rows[0];

      // Confirmar transação
      await query('COMMIT');

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
      // Reverter transação em caso de erro
      await query('ROLLBACK');
      console.error("Erro na transação de atribuição:", transactionError);
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