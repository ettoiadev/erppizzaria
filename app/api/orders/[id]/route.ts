import { NextResponse, type NextRequest } from "next/server"
import { getOrderById } from '@/lib/db-supabase'
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

    const order = await getOrderById(params.id)
    if (!order) {
      frontendLogger.warn('Pedido não encontrado', 'api', {
        orderId: params.id
      });
      const response = NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
      return addCorsHeaders(response)
    }
    
    frontendLogger.info('Pedido encontrado com sucesso', 'api', {
      orderId: order.id,
      itemsCount: order.items?.length || 0
    });
    const response = NextResponse.json(order)
    return addCorsHeaders(response)
  } catch (error: any) {
    frontendLogger.error('Erro ao buscar pedido', 'api', {
      error: error.message,
      orderId: params.id
    });
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
    return createAuthErrorResponse(authResult.error, authResult.status)
  }
  
  const admin = authResult.user

  try {
    frontendLogger.info('Iniciando atualização de pedido', 'api', {
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      orderId: params.id
    });

    // Parse do JSON
    let body
    try {
      body = await request.json()
    } catch (error) {
      frontendLogger.warn('JSON inválido na atualização de pedido', 'api', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        orderId: params.id
      });
      const response = NextResponse.json({ error: "JSON inválido" }, { status: 400 })
      return addCorsHeaders(response)
    }

    // Validação usando Zod
    const validationResult = orderUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      frontendLogger.warn('Dados inválidos na atualização de pedido', 'api', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
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
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        orderId: params.id
      });
      const response = NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 })
      return addCorsHeaders(response)
    }

    // Atualização via Supabase com dados validados
    const { getSupabaseServerClient } = await import('@/lib/supabase')
    const supabase = getSupabaseServerClient()
    const updates: any = {
      updated_at: new Date().toISOString()
    }
    
    if (validatedData.status) updates.status = validatedData.status
    if (validatedData.delivery_instructions !== undefined) updates.notes = validatedData.delivery_instructions
    if (validatedData.estimated_delivery_time !== undefined) updates.estimated_delivery_time = validatedData.estimated_delivery_time
    
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', params.id)
      .select('*')
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        frontendLogger.warn('Pedido não encontrado para atualização', 'api', {
          adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
          orderId: params.id
        });
        const response = NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
        return addCorsHeaders(response)
      }
      throw error
    }
    
    frontendLogger.info('Pedido atualizado com sucesso', 'api', {
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      orderId: params.id,
      updatedFields: Object.keys(validatedData)
    });
    
    const response = NextResponse.json({ message: "Pedido atualizado com sucesso", order: data })
    return addCorsHeaders(response)
  } catch (error: any) {
    frontendLogger.error('Erro ao atualizar pedido', 'api', {
      error: error.message,
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      orderId: params.id
    });
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
    return createAuthErrorResponse(authResult.error, authResult.status)
  }
  
  const admin = authResult.user

  try {
    frontendLogger.info('Iniciando exclusão de pedido', 'api', {
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      orderId: params.id
    });

    const { getSupabaseServerClient } = await import('@/lib/supabase')
    const supabase = getSupabaseServerClient()

    // Primeiro, verificar se o pedido existe
    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingOrder) {
      frontendLogger.warn('Pedido não encontrado para exclusão', 'api', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        orderId: params.id
      });
      const response = NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
      return addCorsHeaders(response)
    }

    // Verificar se o pedido pode ser excluído (apenas RECEIVED ou CANCELLED)
    if (!['RECEIVED', 'CANCELLED'].includes(existingOrder.status)) {
      frontendLogger.warn('Tentativa de exclusão de pedido com status inválido', 'api', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        orderId: params.id,
        currentStatus: existingOrder.status
      });
      const response = NextResponse.json({ 
        error: "Apenas pedidos com status RECEIVED ou CANCELLED podem ser excluídos" 
      }, { status: 400 })
      return addCorsHeaders(response)
    }

    // Excluir o pedido
    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      throw deleteError
    }

    frontendLogger.info('Pedido excluído com sucesso', 'api', {
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      orderId: params.id,
      previousStatus: existingOrder.status
    });

    const response = NextResponse.json({ message: "Pedido excluído com sucesso" })
    return addCorsHeaders(response)
  } catch (error: any) {
    frontendLogger.error('Erro ao excluir pedido', 'api', {
      error: error.message,
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      orderId: params.id
    });
    const response = NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    return addCorsHeaders(response)
  }
}