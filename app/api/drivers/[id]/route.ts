import { NextRequest, NextResponse } from "next/server"
import { query } from '@/lib/db'
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
    frontendLogger.info('api', 'Buscando entregador por ID', {
      driverId: params.id
    });

    // Buscar entregador por ID usando PostgreSQL
    const driverResult = await query(`
      SELECT id, name, email, phone, vehicle_type, vehicle_plate, status, current_location, 
             total_deliveries, average_rating, average_delivery_time, created_at, updated_at, 
             last_active_at, active
      FROM drivers 
      WHERE id = $1 AND (active IS NULL OR active = true)
    `, [params.id])

    if (driverResult.rows.length === 0) {
      const driver = null
      frontendLogger.warn('api', 'Entregador não encontrado', {
        driverId: params.id
      });
      const response = NextResponse.json({
        error: "Entregador não encontrado",
        message: `Não existe entregador com ID ${params.id}`
      }, { status: 404 })
      return addCorsHeaders(response)
    }

    const driver = driverResult.rows[0]

    // Buscar pedidos ativos do entregador se estiver ocupado
    let currentOrders = []
    if (driver.status === 'busy') {
      try {
        const ordersResult = await query(`
          SELECT id, status, total, customer_address, created_at
          FROM orders 
          WHERE driver_id = $1 AND status = 'ON_THE_WAY'
          ORDER BY created_at DESC
        `, [driver.id])

        if (ordersResult.rows.length > 0) {
          currentOrders = ordersResult.rows.map((order: any) => order.id)
        }
      } catch (orderError) {
        frontendLogger.warn('api', 'Erro ao buscar pedidos do entregador', {
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
    frontendLogger.error('api', 'Erro ao buscar entregador', error);
    frontendLogger.info('api', 'Driver ID relacionado ao erro', {
      driverId: params.id
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
    return createAuthErrorResponse(authResult.error || 'Acesso negado', 401)
  }
  
  const admin = authResult.user

  if (!admin) {
    return createAuthErrorResponse('Usuário não encontrado', 401)
  }

  try {
    frontendLogger.info('api', 'Iniciando atualização de entregador', {
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      driverId: params.id
    });
    
    // Usar PostgreSQL direto
    
    // Parse do JSON
    let body
    try {
      body = await request.json()
    } catch (error) {
      frontendLogger.warn('api', 'JSON inválido na atualização de entregador', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        driverId: params.id
      });
      const response = NextResponse.json({ error: "JSON inválido" }, { status: 400 })
      return addCorsHeaders(response)
    }

    // Validação usando Zod
    const validationResult = driverUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      frontendLogger.warn('api', 'Dados inválidos na atualização de entregador', {
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
    const existingResult = await query(`
      SELECT id FROM drivers 
      WHERE id = $1 AND (active IS NULL OR active = true)
    `, [params.id])

    if (existingResult.rows.length === 0) {
      frontendLogger.warn('api', 'Entregador não encontrado na atualização', {
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
      const emailCheckResult = await query(`
        SELECT id FROM drivers 
        WHERE email = $1 AND id != $2
      `, [validatedData.email.toLowerCase(), params.id])

      if (emailCheckResult.rows.length > 0) {
        frontendLogger.warn('api', 'Email já cadastrado na atualização de entregador', {
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
      frontendLogger.warn('api', 'Nenhum campo para atualizar na atualização de entregador', {
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
    const updateFields = Object.keys(updateData).map((key, index) => `${key} = $${index + 2}`).join(', ')
    const updateValues = [params.id, ...Object.values(updateData)]
    
    const updateResult = await query(`
      UPDATE drivers 
      SET ${updateFields}
      WHERE id = $1
      RETURNING *
    `, updateValues)

    const updatedDriver = updateResult.rows[0]

    frontendLogger.info('api', 'Entregador atualizado com sucesso', {
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
    frontendLogger.error('api', 'Erro ao atualizar entregador', error, {
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      driverId: params.id
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
    return createAuthErrorResponse(authResult.error || 'Acesso negado', 401)
  }
  
  const admin = authResult.user

  if (!admin) {
    return createAuthErrorResponse('Usuário não encontrado', 401)
  }

  try {
    frontendLogger.info('api', 'Iniciando remoção de entregador', {
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      driverId: params.id
    });

    // Verificar se o entregador existe
    const driverResult = await query(`
      SELECT id, name, status FROM drivers 
      WHERE id = $1
    `, [params.id])

    if (driverResult.rows.length === 0) {
      const driver = null
      frontendLogger.warn('api', 'Entregador não encontrado na remoção', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        driverId: params.id
      });
      const response = NextResponse.json({
        error: "Entregador não encontrado",
        message: `Não existe entregador com ID ${params.id}`
      }, { status: 404 })
      return addCorsHeaders(response)
    }

    const driver = driverResult.rows[0]

    // Verificar se o entregador está ocupado
    if (driver.status === 'busy') {
      frontendLogger.warn('api', 'Tentativa de remover entregador ocupado', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        driverId: params.id,
        driverName: driver.name,
        driverStatus: driver.status
      });
      const response = NextResponse.json({
        error: "Entregador ocupado",
        message: "Não é possível remover um entregador que está fazendo entregas"
      }, { status: 400 })
      return addCorsHeaders(response)
    }

    // Soft delete - marcar como inativo
    await query(`
      UPDATE drivers 
      SET active = false, updated_at = $1
      WHERE id = $2
    `, [new Date().toISOString(), params.id])

    frontendLogger.info('api', 'Entregador removido com sucesso', {
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
    frontendLogger.error('api', 'Erro ao remover entregador', error, {
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      driverId: params.id
    });
    
    const response = NextResponse.json({
      error: "Erro interno do servidor",
      message: "Erro ao remover entregador do banco de dados"
    }, { status: 500 })
    return addCorsHeaders(response)
  }
}