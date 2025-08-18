import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from '@/lib/supabase'
import { frontendLogger } from '@/lib/logger'
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
    return createAuthErrorResponse(authResult.error, authResult.status)
  }
  
  const admin = authResult.user

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

    const supabase = getSupabaseServerClient()

    // Verificar se o entregador existe e está disponível
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id, name, status')
      .eq('id', driverId)
      .or('active.is.null,active.eq.true')
      .single()

    if (driverError || !driver) {
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

    // Verificar se o pedido existe e está em preparo
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, driver_id, customer_address')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
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

    } catch (transactionError) {
      frontendLogger.error('Erro na operação de atribuição de entregador', 'api', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        orderId,
        driverId,
        error: transactionError
      });
      throw transactionError;
    }

  } catch (error: any) {
    frontendLogger.error('Erro ao atribuir entregador', 'api', {
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      orderId: params.id,
      error: error.message
    });
    
    const response = NextResponse.json({
      error: "Erro interno do servidor",
      message: "Erro ao atribuir entregador ao pedido",
      details: error.message
    }, { status: 500 })
    return addCorsHeaders(response)
  }
}