import { NextRequest, NextResponse } from "next/server"
import { query } from '@/lib/db'
import { frontendLogger } from '@/lib/frontend-logger'
import { validateAdminAuth, createAuthErrorResponse, addCorsHeaders } from '@/lib/auth-utils'
import { z } from 'zod'
import { createSecureResponse, createSecureErrorResponse, sanitizeInput, logSuspiciousActivity } from '@/lib/security-utils'

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
    return createAuthErrorResponse(authResult.error || 'Acesso negado', 401)
  }
  
  const admin = authResult.user
  if (!admin) {
    return createAuthErrorResponse('Usuário não encontrado', 401)
  }

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
      return createSecureErrorResponse('JSON inválido', 400, request, 'warn')
    }

    // Validação usando Zod
    const validationResult = orderStatusUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      frontendLogger.warn('Dados inválidos na atualização de status', 'api', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        orderId,
        errors: validationResult.error.errors
      });
      logSuspiciousActivity(request, 'Invalid order status update data', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        orderId,
        errors: validationResult.error.errors
      })
      return createSecureErrorResponse('Dados inválidos', 400, request, 'warn')
    }

    const { status, notes } = validationResult.data

    // Buscar pedido atual para validar transição de status
    const currentOrderResult = await query(
      'SELECT id, status FROM orders WHERE id = $1',
      [orderId]
    )
    
    if (currentOrderResult.rows.length === 0) {
      frontendLogger.warn('Pedido não encontrado para atualização de status', 'api', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        orderId
      });
      return createSecureErrorResponse('Pedido não encontrado', 404, request, 'warn')
    }
    
    const currentOrder = currentOrderResult.rows[0]

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
      logSuspiciousActivity(request, 'Invalid status regression attempt', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        orderId,
        currentStatus: currentOrder.status,
        newStatus: status
      })
      return createSecureErrorResponse('Não é possível voltar o status do pedido', 400, request, 'warn')
    }

    // Atualizar status do pedido
    const updateFields = ['status = $1', 'updated_at = $2']
    const updateValues = [status, new Date().toISOString()]
    let paramIndex = 3
    
    if (notes) {
      updateFields.push(`notes = $${paramIndex++}`)
      updateValues.push(notes)
    }
    
    updateValues.push(orderId) // Para o WHERE
    
    const updateQuery = `
      UPDATE orders 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `
    
    const updateResult = await query(updateQuery, updateValues)
    const updatedOrder = updateResult.rows[0]

    frontendLogger.info('Status do pedido atualizado com sucesso', 'api', {
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      orderId,
      previousStatus: currentOrder.status,
      newStatus: status,
      hasNotes: !!notes
    });

    // Log da atualização de status (removido sistema realtime)
    frontendLogger.info('Status do pedido atualizado - evento registrado', 'api', {
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      orderId,
      event: 'order_status_updated'
    });

    return createSecureResponse({
      message: "Status atualizado com sucesso",
      order: updatedOrder
    }, 200, request)

  } catch (error: any) {
    frontendLogger.logError('Erro ao atualizar status do pedido', {
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      orderId: params.id
    }, error, 'api');
    
    return createSecureErrorResponse('Erro interno do servidor', 500, request, 'error')
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
    return createAuthErrorResponse(authResult.error || 'Acesso negado', 401)
  }
  
  const admin = authResult.user
  if (!admin) {
    return createAuthErrorResponse('Usuário não encontrado', 401)
  }

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
    frontendLogger.logError('Erro ao cancelar pedido via DELETE', {
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      orderId: params.id
    }, error, 'api');
    
    return createSecureErrorResponse('Erro interno do servidor', 500, request, 'error')
  }
}