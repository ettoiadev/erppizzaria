import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from '@/lib/supabase'
import { withValidation } from '@/lib/validation-utils'
import { withDatabaseErrorHandling } from '@/lib/database-error-handler'
import { withPresetRateLimit } from '@/lib/rate-limit-middleware'
import { withPresetSanitization } from '@/lib/sanitization-middleware'
import { withErrorMonitoring } from '@/lib/error-monitoring'
import { withApiLogging } from '@/lib/api-logger-middleware'
import { driverSchema } from '@/lib/validation-schemas'

// Handler GET para buscar entregadores (sem middlewares)
async function getDriversHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = getSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    // Construir query com filtros
    let driversQuery = supabase
      .from('drivers')
      .select('id, name, email, phone, vehicle_type, vehicle_plate, status, current_location, total_deliveries, average_rating, average_delivery_time, created_at, updated_at, last_active_at, active')
      .or('active.is.null,active.eq.true')
      .order('name')

    // Filtrar por status se especificado
    if (status && status !== "all") {
      driversQuery = driversQuery.eq('status', status)
    }

    const { data: drivers, error } = await driversQuery
    if (error) throw error

    // Retornar lista de entregadores (vazia se não houver dados reais)

    // Buscar pedidos ativos do entregador
    const driversWithOrders = await Promise.all(
      (drivers || []).map(async (driver: any) => {
        if (driver.status === 'busy') {
          try {
            const { data: activeOrders, error: ordersError } = await supabase
              .from('orders')
              .select('id, status, total, customer_address, created_at')
              .eq('driver_id', driver.id)
              .eq('status', 'ON_THE_WAY')
              .order('created_at', { ascending: false })
              .limit(5)

            if (ordersError) {
              return { ...driver, currentOrders: [] }
            }

            return {
              ...driver,
              currentOrders: (activeOrders || []).map((order: any) => order.id)
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
    const supabase = getSupabaseServerClient()
    const { name, email, phone, vehicleType, vehiclePlate, currentLocation } = validatedData

    // Dados já validados pelos middlewares

    // Inserir novo entregador
    const { data: newDriver, error: insertError } = await supabase
      .from('drivers')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        vehicle_type: vehicleType,
        vehicle_plate: vehiclePlate?.trim().toUpperCase() || null,
        current_location: currentLocation || null,
        status: 'offline',
        total_deliveries: 0,
        average_rating: 0.00,
        average_delivery_time: 0,
        active: true
      })
      .select()
      .single()

    if (insertError) throw insertError

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