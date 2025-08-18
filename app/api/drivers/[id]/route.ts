import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from '@/lib/supabase'
import { frontendLogger } from '@/lib/logger'
import { validateAdminAuth, createAuthErrorResponse, addCorsHeaders } from '@/lib/auth-utils'
import { z } from 'zod'

// Schema para atualização de driver
const driverUpdateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres").trim().optional(),
  email: z.string().email("Email deve ser válido").optional(),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos").max(15, "Telefone deve ter no máximo 15 dígitos").optional(),
  vehicle_type: z.enum(["motorcycle", "car", "bicycle"], { errorMap: () => ({ message: "Tipo de veículo deve ser motorcycle, car ou bicycle" }) }).optional(),
  vehicle_plate: z.string().min(7, "Placa deve ter pelo menos 7 caracteres").max(8, "Placa deve ter no máximo 8 caracteres").optional(),
  status: z.enum(["available", "busy", "offline"], { errorMap: () => ({ message: "Status deve ser available, busy ou offline" }) }).optional(),
  active: z.boolean().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    frontendLogger.info('Buscando entregador por ID', 'api', {
      driverId: params.id
    });

    const supabase = getSupabaseServerClient()

    // Buscar entregador por ID usando Supabase
    const { data: driver, error } = await supabase
      .from('drivers')
      .select('id, name, email, phone, vehicle_type, vehicle_plate, status, current_location, total_deliveries, average_rating, average_delivery_time, created_at, updated_at, last_active_at, active')
      .eq('id', params.id)
      .or('active.is.null,active.eq.true')
      .single()

    if (error || !driver) {
      frontendLogger.warn('Entregador não encontrado', 'api', {
        driverId: params.id,
        error: error?.message
      });
      const response = NextResponse.json({
        error: "Entregador não encontrado",
        message: `Não existe entregador com ID ${params.id}`
      }, { status: 404 })
      return addCorsHeaders(response)
    }

    // Buscar pedidos ativos do entregador se estiver ocupado
    let currentOrders = []
    if (driver.status === 'busy') {
      try {
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('id, status, total, customer_address, created_at')
          .eq('driver_id', driver.id)
          .eq('status', 'ON_THE_WAY')
          .order('created_at', { ascending: false })

        if (!ordersError && orders) {
          currentOrders = orders.map((order: any) => order.id)
        }
      } catch (orderError) {
        frontendLogger.warn('Erro ao buscar pedidos do entregador', 'api', {
          driverId: driver.id,
          error: orderError
        });
      }
    }

    const response = NextResponse.json({
      driver: {
        ...driver,
        currentOrders
      }
    })
    return addCorsHeaders(response)

  } catch (error: any) {
    frontendLogger.error('Erro ao buscar entregador', 'api', {
      driverId: params.id,
      error: error.message
    });
    
    const response = NextResponse.json({
      error: "Erro interno do servidor",
      message: "Erro ao buscar entregador no banco de dados"
    }, { status: 500 })
    return addCorsHeaders(response)
  }
}

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
    frontendLogger.info('Iniciando atualização de entregador', 'api', {
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      driverId: params.id
    });
    
    const supabase = getSupabaseServerClient()
    
    // Parse do JSON
    let body
    try {
      body = await request.json()
    } catch (error) {
      frontendLogger.warn('JSON inválido na atualização de entregador', 'api', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        driverId: params.id
      });
      const response = NextResponse.json({ error: "JSON inválido" }, { status: 400 })
      return addCorsHeaders(response)
    }

    // Validação usando Zod
    const validationResult = driverUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      frontendLogger.warn('Dados inválidos na atualização de entregador', 'api', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        driverId: params.id,
        errors: validationResult.error.errors
      });
      const response = NextResponse.json({ 
        error: "Dados inválidos", 
        details: validationResult.error.errors 
      }, { status: 400 })
      return addCorsHeaders(response)
    }

    const validatedData = validationResult.data

    // Verificar se o entregador existe
    const { data: existing, error: existingError } = await supabase
      .from('drivers')
      .select('id')
      .eq('id', params.id)
      .or('active.is.null,active.eq.true')
      .single()

    if (existingError || !existing) {
      frontendLogger.warn('Entregador não encontrado na atualização', 'api', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        driverId: params.id
      });
      const response = NextResponse.json({
        error: "Entregador não encontrado",
        message: `Não existe entregador com ID ${params.id}`
      }, { status: 404 })
      return addCorsHeaders(response)
    }

    // Preparar campos para atualização
    const updateData: any = {}

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name
    }

    if (validatedData.email !== undefined) {
      // Verificar se email já existe em outro entregador
      const { data: emailCheck, error: emailError } = await supabase
        .from('drivers')
        .select('id')
        .eq('email', validatedData.email.toLowerCase())
        .neq('id', params.id)
        .single()

      if (emailCheck) {
        frontendLogger.warn('Email já cadastrado na atualização de entregador', 'api', {
          adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
          driverId: params.id,
          email: validatedData.email.replace(/(.{2}).*(@.*)/, '$1***$2')
        });
        const response = NextResponse.json({
          error: "Email já cadastrado",
          message: "Este email já está sendo usado por outro entregador"
        }, { status: 400 })
        return addCorsHeaders(response)
      }

      updateData.email = validatedData.email.toLowerCase()
    }

    if (validatedData.phone !== undefined) {
      updateData.phone = validatedData.phone
    }

    if (validatedData.vehicle_type !== undefined) {
      updateData.vehicle_type = validatedData.vehicle_type
    }

    if (validatedData.vehicle_plate !== undefined) {
      updateData.vehicle_plate = validatedData.vehicle_plate?.toUpperCase() || null
    }

    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status
      updateData.last_active_at = new Date().toISOString()
    }

    if (validatedData.active !== undefined) {
      updateData.active = validatedData.active
    }

    // Sempre atualizar updated_at
    updateData.updated_at = new Date().toISOString()

    if (Object.keys(updateData).length === 1) { // Apenas updated_at
      frontendLogger.warn('Nenhum campo para atualizar na atualização de entregador', 'api', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        driverId: params.id
      });
      const response = NextResponse.json({
        error: "Nenhum campo para atualizar",
        message: "Forneça pelo menos um campo para atualização"
      }, { status: 400 })
      return addCorsHeaders(response)
    }

    // Executar atualização
    const { data: updatedDriver, error: updateError } = await supabase
      .from('drivers')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) throw updateError

    frontendLogger.info('Entregador atualizado com sucesso', 'api', {
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      driverId: params.id,
      driverName: updatedDriver.name,
      updatedFields: Object.keys(updateData).filter(key => key !== 'updated_at')
    });

    const response = NextResponse.json({
      message: "Entregador atualizado com sucesso",
      driver: updatedDriver
    })
    return addCorsHeaders(response)

  } catch (error: any) {
    frontendLogger.error('Erro ao atualizar entregador', 'api', {
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      driverId: params.id,
      error: error.message
    });
    
    const response = NextResponse.json({
      error: "Erro interno do servidor",
      message: "Erro ao atualizar entregador no banco de dados",
      details: error.message
    }, { status: 500 })
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
    frontendLogger.info('Iniciando remoção de entregador', 'api', {
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      driverId: params.id
    });

    const supabase = getSupabaseServerClient()

    // Verificar se o entregador existe
    const { data: driver, error: existingError } = await supabase
      .from('drivers')
      .select('id, name, status')
      .eq('id', params.id)
      .single()

    if (existingError || !driver) {
      frontendLogger.warn('Entregador não encontrado na remoção', 'api', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        driverId: params.id
      });
      const response = NextResponse.json({
        error: "Entregador não encontrado",
        message: `Não existe entregador com ID ${params.id}`
      }, { status: 404 })
      return addCorsHeaders(response)
    }

    // Verificar se o entregador está ocupado
    if (driver.status === 'busy') {
      frontendLogger.warn('Tentativa de remover entregador ocupado', 'api', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        driverId: params.id,
        driverName: driver.name,
        status: driver.status
      });
      const response = NextResponse.json({
        error: "Entregador ocupado",
        message: "Não é possível remover um entregador que está fazendo entregas"
      }, { status: 400 })
      return addCorsHeaders(response)
    }

    // Soft delete - marcar como inativo
    const { error: deleteError } = await supabase
      .from('drivers')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', params.id)

    if (deleteError) throw deleteError

    frontendLogger.info('Entregador removido com sucesso', 'api', {
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      driverId: params.id,
      driverName: driver.name
    });

    const response = NextResponse.json({
      message: "Entregador removido com sucesso",
      driver: {
        id: params.id,
        name: driver.name
      }
    })
    return addCorsHeaders(response)

  } catch (error: any) {
    frontendLogger.error('Erro ao remover entregador', 'api', {
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      driverId: params.id,
      error: error.message
    });
    
    const response = NextResponse.json({
      error: "Erro interno do servidor",
      message: "Erro ao remover entregador do banco de dados"
    }, { status: 500 })
    return addCorsHeaders(response)
  }
}