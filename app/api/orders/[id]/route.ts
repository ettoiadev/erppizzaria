import { NextResponse, type NextRequest } from "next/server"
import { query } from '@/lib/db'
import { frontendLogger } from '@/lib/frontend-logger'
import { validateAdminAuth, createAuthErrorResponse, addCorsHeaders, createOptionsHandler } from '@/lib/auth-utils'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Schema para atualização de pedidos
const orderUpdateSchema = z.object({
  status: z.enum(['RECEIVED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']).optional(),
  delivery_instructions: z.string().max(500, "Instruções devem ter no máximo 500 caracteres").optional(),
  estimated_delivery_time: z.string().datetime().optional().nullable()
});

// Schema para atualização parcial de pedidos
const orderPatchSchema = z.object({
  status: z.enum(['RECEIVED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']).optional(),
  delivery_instructions: z.string().max(500, "Instruções devem ter no máximo 500 caracteres").optional(),
  estimated_delivery_time: z.string().datetime().optional().nullable()
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    frontendLogger.info('Buscando pedido por ID', 'api', {
      orderId: params.id
    });

    // Validar se o ID é um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(params.id)) {
      frontendLogger.warn('ID de pedido inválido fornecido', 'api', {
        orderId: params.id
      });
      const response = NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
      return addCorsHeaders(response)
    }

    // Buscar pedido com itens
    const orderResult = await query(`
      SELECT 
        o.*,
        json_agg(
          json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price,
            'product_name', p.name,
            'product_description', p.description
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = $1
      GROUP BY o.id
    `, [params.id])

    if (orderResult.rows.length === 0) {
      frontendLogger.warn('Pedido não encontrado', 'api', {
        orderId: params.id
      });
      const response = NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
      return addCorsHeaders(response)
    }
    
    const order = orderResult.rows[0]
    frontendLogger.info('Pedido encontrado com sucesso', 'api', {
      orderId: order.id,
      itemsCount: order.items?.length || 0
    });
    const response = NextResponse.json(order)
    return addCorsHeaders(response)
  } catch (error: any) {
    frontendLogger.logError('Erro ao buscar pedido', {
      orderId: params.id
    }, error, 'api');
    const response = NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    return addCorsHeaders(response)
  }
}

export async function PUT(
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
    frontendLogger.info('Iniciando atualização de pedido', 'api', {
      adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
      orderId: params.id
    });

    // Parse do JSON
    let body
    try {
      body = await request.json()
    } catch (error) {
      frontendLogger.warn('JSON inválido na atualização de pedido', 'api', {
        adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
        orderId: params.id
      });
      const response = NextResponse.json({ error: "JSON inválido" }, { status: 400 })
      return addCorsHeaders(response)
    }

    // Validação usando Zod
    const validationResult = orderUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      frontendLogger.warn('Dados inválidos na atualização de pedido', 'api', {
        adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
        orderId: params.id,
        errors: validationResult.error.errors
      });
      const response = NextResponse.json({ 
        error: "Dados inválidos", 
        details: validationResult.error.errors 
      }, { status: 400 })
      return addCorsHeaders(response)
    }

    const validatedData = validationResult.data

    // Verificar se há campos para atualizar
    const hasUpdates = Object.keys(validatedData).length > 0
    if (!hasUpdates) {
      frontendLogger.warn('Nenhum campo válido para atualização', 'api', {
        adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
        orderId: params.id
      });
      const response = NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 })
      return addCorsHeaders(response)
    }

    // Construir query de atualização dinamicamente
    const updateFields = []
    const updateValues = []
    let paramIndex = 1
    
    updateFields.push('updated_at = $' + paramIndex++)
    updateValues.push(new Date().toISOString())
    
    if (validatedData.status) {
      updateFields.push('status = $' + paramIndex++)
      updateValues.push(validatedData.status)
    }
    if (validatedData.delivery_instructions !== undefined) {
      updateFields.push('notes = $' + paramIndex++)
      updateValues.push(validatedData.delivery_instructions)
    }
    if (validatedData.estimated_delivery_time !== undefined) {
      updateFields.push('estimated_delivery_time = $' + paramIndex++)
      updateValues.push(validatedData.estimated_delivery_time)
    }
    
    updateValues.push(params.id) // Para o WHERE
    
    const updateQuery = `
      UPDATE orders 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `
    
    const updateResult = await query(updateQuery, updateValues)
    
    if (updateResult.rows.length === 0) {
      frontendLogger.warn('Pedido não encontrado para atualização', 'api', {
        adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
        orderId: params.id
      });
      const response = NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
      return addCorsHeaders(response)
    }
    
    const data = updateResult.rows[0]
    
    frontendLogger.info('Pedido atualizado com sucesso', 'api', {
      adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
      orderId: params.id,
      updatedFields: Object.keys(validatedData)
    });
    
    const response = NextResponse.json({ message: "Pedido atualizado com sucesso", order: data })
    return addCorsHeaders(response)
  } catch (error: any) {
    frontendLogger.logError('Erro ao atualizar pedido', {
      adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
      orderId: params.id
    }, error, 'api');
    const response = NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    return addCorsHeaders(response)
  }
}

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
    frontendLogger.info('Iniciando exclusão de pedido', 'api', {
      adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
      orderId: params.id
    });

    // Primeiro, verificar se o pedido existe
    const existingOrderResult = await query(
      'SELECT id, status FROM orders WHERE id = $1',
      [params.id]
    )

    if (existingOrderResult.rows.length === 0) {
      frontendLogger.warn('Pedido não encontrado para exclusão', 'api', {
        adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
        orderId: params.id
      });
      const response = NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
      return addCorsHeaders(response)
    }

    const existingOrder = existingOrderResult.rows[0]

    // Verificar se o pedido pode ser excluído (apenas RECEIVED ou CANCELLED)
    if (!['RECEIVED', 'CANCELLED'].includes(existingOrder.status)) {
      frontendLogger.warn('Tentativa de exclusão de pedido com status inválido', 'api', {
        adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
        orderId: params.id,
        currentStatus: existingOrder.status
      });
      const response = NextResponse.json({ 
        error: "Apenas pedidos com status RECEIVED ou CANCELLED podem ser excluídos" 
      }, { status: 400 })
      return addCorsHeaders(response)
    }

    // Excluir o pedido (os itens serão excluídos automaticamente por CASCADE)
    await query('DELETE FROM orders WHERE id = $1', [params.id])

    frontendLogger.info('Pedido excluído com sucesso', 'api', {
      adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
      orderId: params.id,
      previousStatus: existingOrder.status
    });

    const response = NextResponse.json({ message: "Pedido excluído com sucesso" })
    return addCorsHeaders(response)
  } catch (error: any) {
    frontendLogger.logError('Erro ao excluir pedido', {
      adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
      orderId: params.id
    }, error, 'api');
    const response = NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    return addCorsHeaders(response)
  }
}