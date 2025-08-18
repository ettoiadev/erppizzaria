import { NextRequest, NextResponse } from "next/server"
import { updateOrderStatus, getOrderById } from '@/lib/db-supabase'
import { emitRealtimeEvent, EVENT_ORDER_STATUS_UPDATED } from '@/lib/realtime'
import { frontendLogger } from '@/lib/logger'
import { validateAdminAuth, createAuthErrorResponse, addCorsHeaders } from '@/lib/auth-utils'
import { z } from 'zod'

// Schema para validação de atualização de status
const orderStatusUpdateSchema = z.object({
  status: z.enum(['RECEIVED', 'PREPARING', 'READY', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED']),
  notes: z.string().optional()
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
    
    frontendLogger.info('Iniciando atualização de status do pedido', 'api', {
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      orderId
    });

    // Parse do JSON
    let body
    try {
      body = await request.json()
    } catch (error) {
      frontendLogger.warn('JSON inválido na atualização de status', 'api', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        orderId
      });
      const response = NextResponse.json({ error: "JSON inválido" }, { status: 400 })
      return addCorsHeaders(response)
    }

    // Validação usando Zod
    const validationResult = orderStatusUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      frontendLogger.warn('Dados inválidos na atualização de status', 'api', {
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

    const { status, notes } = validationResult.data

    // Buscar pedido atual para validar transição de status
    const currentOrder = await getOrderById(orderId)
    if (!currentOrder) {
      frontendLogger.warn('Pedido não encontrado para atualização de status', 'api', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        orderId
      });
      const response = NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
      return addCorsHeaders(response)
    }

    // Validar transição de status
    const statusOrder = ['RECEIVED', 'PREPARING', 'READY', 'ON_THE_WAY', 'DELIVERED']
    const currentIndex = statusOrder.indexOf(currentOrder.status)
    const newIndex = statusOrder.indexOf(status)

    if (newIndex < currentIndex && status !== 'CANCELLED') {
      frontendLogger.warn('Tentativa de regressão de status inválida', 'api', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        orderId,
        currentStatus: currentOrder.status,
        newStatus: status
      });
      const response = NextResponse.json({ error: "Não é possível voltar o status do pedido" }, { status: 400 })
      return addCorsHeaders(response)
    }

    const updatedOrder = await updateOrderStatus(orderId, status, notes || null)

    frontendLogger.info('Status do pedido atualizado com sucesso', 'api', {
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      orderId,
      previousStatus: currentOrder.status,
      newStatus: status,
      hasNotes: !!notes
    });

    // Emitir evento Realtime de atualização de status
    try {
      await emitRealtimeEvent(EVENT_ORDER_STATUS_UPDATED, {
        orderId,
        status,
        order: updatedOrder,
      })
    } catch (e) {
      frontendLogger.warn('Falha ao emitir evento Realtime', 'api', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        orderId,
        event: 'order_status_updated',
        error: (e as Error)?.message
      });
    }

    const response = NextResponse.json({
      message: "Status atualizado com sucesso",
      order: updatedOrder
    })
    return addCorsHeaders(response)

  } catch (error: any) {
    frontendLogger.error('Erro ao atualizar status do pedido', 'api', {
      error: error.message,
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      orderId
    });
    
    const response = NextResponse.json({
      error: "Erro interno do servidor",
      message: "Erro ao atualizar status do pedido",
      details: error.message
    }, { status: 500 })
    return addCorsHeaders(response)
  }
}

// Handle DELETE requests (redirect to PATCH with CANCELLED status)
export async function DELETE(
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
    frontendLogger.info('Iniciando cancelamento de pedido via DELETE', 'api', {
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      orderId: params.id
    });
    
    // Parse body to get cancellation notes if provided
    let notes = null
    try {
      const body = await request.json()
      notes = body.notes || body.motivoCancelamento || null
      if (notes) {
        frontendLogger.info('Notas de cancelamento fornecidas', 'api', {
          adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
          orderId: params.id
        });
      }
    } catch (parseError) {
      frontendLogger.info('Nenhuma nota de cancelamento fornecida', 'api', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        orderId: params.id
      });
    }

    // Create a new request with PATCH method
    const patchRequest = new NextRequest(request.url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || ''
      },
      body: JSON.stringify({ 
        status: 'CANCELLED', 
        notes: notes 
      })
    })

    // Call the PATCH handler
    return await PATCH(patchRequest, { params })
  } catch (error: any) {
    frontendLogger.error('Erro ao cancelar pedido via DELETE', 'api', {
      error: error.message,
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      orderId: params.id
    });
    
    const response = NextResponse.json({ 
      error: error.message || "Erro interno do servidor",
      details: {
        type: error.constructor.name,
        message: error.message
      }
    }, { status: 500 })
    return addCorsHeaders(response)
  }
}