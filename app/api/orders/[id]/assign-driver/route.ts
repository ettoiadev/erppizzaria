import { NextRequest, NextResponse } from "next/server"
import { query } from '@/lib/db'
import { frontendLogger } from '@/lib/frontend-logger'
import { validateAdminAuth, createAuthErrorResponse, addCorsHeaders } from '@/lib/auth-utils'
import { z } from 'zod'

// Schema para validação de atribuição de entregador
const assignDriverSchema = z.object({
  driverId: z.string().uuid('ID do entregador deve ser um UUID válido')
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Validar autenticação de admin
  const authResult = await validateAdminAuth(request)    
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error || 'Acesso negado', 401)
  }
  
  const admin = authResult.user
  if (!admin) {
    return createAuthErrorResponse('Usuário não encontrado', 401)
  }

  try {
    const orderId = params.id
    
    frontendLogger.info('Iniciando atribuição de entregador', 'api', {
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      orderId
    });

    // Parse do JSON
    let body
    try {
      body = await request.json()
    } catch (error) {
      frontendLogger.warn('JSON inválido na atribuição de entregador', 'api', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        orderId
      });
      const response = NextResponse.json({ error: "JSON inválido" }, { status: 400 })
      return addCorsHeaders(response)
    }

    // Validação usando Zod
    const validationResult = assignDriverSchema.safeParse(body)
    if (!validationResult.success) {
      frontendLogger.warn('Dados inválidos na atribuição de entregador', 'api', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        orderId,
        errors: validationResult.error.errors
      });
      const response = NextResponse.json({ 
        error: "Dados inválidos", 
        details: validationResult.error.errors 
      }, { status: 400 })
      return addCorsHeaders(response)
    }

    const { driverId } = validationResult.data

    // Verificar se o entregador existe e está disponível usando PostgreSQL
    const driverResult = await query(
      'SELECT id, name, status FROM drivers WHERE id = $1 AND (active IS NULL OR active = true)',
      [driverId]
    )
    const driver = driverResult.rows[0]

    if (!driver) {
      frontendLogger.warn('Entregador não encontrado na atribuição', 'api', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        orderId,
        driverId
      });
      const response = NextResponse.json({ error: "Entregador não encontrado" }, { status: 404 })
      return addCorsHeaders(response)
    }

    if (driver.status !== 'available') {
      frontendLogger.warn('Entregador não disponível para atribuição', 'api', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        orderId,
        driverId,
        driverStatus: driver.status
      });
      const response = NextResponse.json({ error: "Entregador não está disponível" }, { status: 400 })
      return addCorsHeaders(response)
    }

    // Verificar se o pedido existe e está em preparo usando PostgreSQL
    const orderResult = await query(
      'SELECT id, status, driver_id, customer_address FROM orders WHERE id = $1',
      [orderId]
    )
    const order = orderResult.rows[0]

    if (!order) {
      frontendLogger.warn('Pedido não encontrado na atribuição de entregador', 'api', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        orderId,
        driverId
      });
      const response = NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
      return addCorsHeaders(response)
    }

    if (order.status !== 'PREPARING' && order.status !== 'READY') {
      frontendLogger.warn('Pedido não disponível para atribuição de entregador', 'api', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        orderId,
        driverId,
        orderStatus: order.status
      });
      const response = NextResponse.json({ error: "Pedido não está disponível para atribuição de entregador" }, { status: 400 })
      return addCorsHeaders(response)
    }

    // Usar transação PostgreSQL para garantir consistência
    try {
      // Iniciar transação
      await query('BEGIN')
      
      try {
        // 1. Atualizar o pedido com o entregador e mudar status para ON_THE_WAY
        const orderUpdateResult = await query(
          `UPDATE orders 
           SET driver_id = $1, status = 'ON_THE_WAY', updated_at = $2
           WHERE id = $3
           RETURNING id, status, total, customer_address, driver_id, created_at, updated_at`,
          [driverId, new Date().toISOString(), orderId]
        )
        const updatedOrder = orderUpdateResult.rows[0]

        if (!updatedOrder) {
          throw new Error('Falha ao atualizar pedido')
        }

        // 2. Atualizar status do entregador para busy
        const driverUpdateResult = await query(
          `UPDATE drivers 
           SET status = 'busy', last_active_at = $1, updated_at = $2
           WHERE id = $3
           RETURNING id, name, status`,
          [new Date().toISOString(), new Date().toISOString(), driverId]
        )
        const updatedDriver = driverUpdateResult.rows[0]

        if (!updatedDriver) {
          throw new Error('Falha ao atualizar entregador')
        }
        
        // Confirmar transação
        await query('COMMIT')

        frontendLogger.info('Entregador atribuído com sucesso', 'api', {
          adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
          orderId: updatedOrder.id,
          driverId: updatedDriver.id,
          driverName: updatedDriver.name,
          orderStatus: updatedOrder.status
        });

        const response = NextResponse.json({
          message: "Entregador atribuído com sucesso",
          order: updatedOrder,
          driver: updatedDriver
        })
        return addCorsHeaders(response)
        
      } catch (innerError) {
        // Reverter transação em caso de erro
        await query('ROLLBACK')
        throw innerError
      }

    } catch (transactionError) {
      frontendLogger.logError('Erro na operação de atribuição de entregador', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        orderId,
        driverId
      }, transactionError as Error, 'api');
      throw transactionError;
    }

  } catch (error: any) {
    frontendLogger.logError('Erro ao atribuir entregador', {
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      orderId: params.id
    }, error, 'api');
    
    const response = NextResponse.json({
      error: "Erro interno do servidor",
      message: "Erro ao atribuir entregador ao pedido",
      details: error.message
    }, { status: 500 })
    return addCorsHeaders(response)
  }
}