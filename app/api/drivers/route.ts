import { NextRequest, NextResponse } from "next/server"
import { query } from '@/lib/db'
import { withValidation } from '@/lib/validation-utils'
import { withDatabaseErrorHandling } from '@/lib/error-handler'
import { withPresetRateLimit } from '@/lib/rate-limit-middleware'
import { withPresetSanitization } from '@/lib/sanitization-middleware'
import { withErrorMonitoring } from '@/lib/error-monitoring'
import { withApiLogging } from '@/lib/api-logger-middleware'
import { driverSchema } from '@/lib/validation-schemas'

// Handler GET para buscar entregadores (sem middlewares)
async function getDriversHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    // Construir query com filtros
    let driversQuery = `
      SELECT id, name, email, phone, vehicle_type, vehicle_plate, status, current_location, 
             total_deliveries, average_rating, average_delivery_time, created_at, updated_at, 
             last_active_at, active 
      FROM drivers 
      WHERE (active IS NULL OR active = true)
    `
    const queryParams: any[] = []

    // Filtrar por status se especificado
    if (status && status !== "all") {
      driversQuery += ` AND status = $${queryParams.length + 1}`
      queryParams.push(status)
    }

    driversQuery += ` ORDER BY name`

    const driversResult = await query(driversQuery, queryParams)
    const drivers = driversResult.rows

    // Retornar lista de entregadores (vazia se não houver dados reais)

    // Buscar pedidos ativos do entregador
    const driversWithOrders = await Promise.all(
      (drivers || []).map(async (driver: any) => {
        if (driver.status === 'busy') {
          try {
            const ordersResult = await query(
              `SELECT id, status, total, customer_address, created_at 
               FROM orders 
               WHERE driver_id = $1 AND status = $2 
               ORDER BY created_at DESC 
               LIMIT 5`,
              [driver.id, 'ON_THE_WAY']
            )

            return {
              ...driver,
              currentOrders: ordersResult.rows.map((order: any) => order.id)
            }
          } catch (orderError) {
            return { ...driver, currentOrders: [] }
          }
        }
        return { ...driver, currentOrders: [] }
      })
    )

    // Calcular estatísticas
    const driversList = driversWithOrders || []
    const statistics = {
      total: driversList.length,
      available: driversList.filter((d: any) => d.status === 'available').length,
      busy: driversList.filter((d: any) => d.status === 'busy').length,
      offline: driversList.filter((d: any) => d.status === 'offline').length,
      averageDeliveryTime: driversList.length > 0 
        ? Math.round(driversList.reduce((sum: number, d: any) => sum + (d.average_delivery_time || 0), 0) / driversList.length)
        : 0
    }
    
    return NextResponse.json({
      drivers: driversWithOrders,
      statistics
    })

  } catch (error: any) {
    // O middleware de database error handling vai capturar e tratar este erro
    throw error
  }
}

// Handler POST para criar entregador (sem middlewares)
async function createDriverHandler(
  request: NextRequest,
  validatedData: any
): Promise<NextResponse> {
  try {
    const { name, email, phone, vehicleType, vehiclePlate, currentLocation } = validatedData

    // Dados já validados pelos middlewares

    // Inserir novo entregador
    const insertResult = await query(
      `INSERT INTO drivers (
        name, email, phone, vehicle_type, vehicle_plate, current_location, 
        status, total_deliveries, average_rating, average_delivery_time, active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        phone.trim(),
        vehicleType,
        vehiclePlate?.trim().toUpperCase() || null,
        currentLocation || null,
        'offline',
        0,
        0.00,
        0,
        true
      ]
    )

    const newDriver = insertResult.rows[0]

    // Normalizar resposta
    const normalizedDriver = {
      ...newDriver,
      currentOrders: []
    }

    return NextResponse.json({
      message: "Entregador criado com sucesso",
      driver: normalizedDriver
    })

  } catch (error: any) {
    // O middleware de database error handling vai capturar e tratar este erro
    throw error
  }
}

// Aplicar middlewares para GET
export const GET = withErrorMonitoring(
  withApiLogging(
    withDatabaseErrorHandling(
      getDriversHandler
    )
  )
)

// Aplicar middlewares para POST
export const POST = withErrorMonitoring(
  withApiLogging(
    withPresetRateLimit('public', {},
      withPresetSanitization('userForm', {},
        withValidation(driverSchema,
          withDatabaseErrorHandling(
            createDriverHandler,
            {
              customErrorMessages: {
                unique_violation: 'Email já está em uso por outro entregador',
                foreign_key_violation: 'Referência inválida nos dados do entregador'
              }
            }
          )
        )
      )
    )
  )
)