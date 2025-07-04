import { NextRequest, NextResponse } from "next/server"
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log("[DRIVERS] Iniciando busca de entregadores usando Supabase")
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    // Construir query com filtros usando Supabase
    let query = supabase
      .from('drivers')
      .select('id, name, email, phone, vehicle_type, vehicle_plate, status, current_location, total_deliveries, average_rating, average_delivery_time, created_at, updated_at, last_active_at, active')

    // Filtrar apenas entregadores ativos (aplicar lógica no frontend)
    query = query.or('active.is.null,active.eq.true')

    // Filtrar por status se especificado
    if (status && status !== "all") {
      query = query.eq('status', status)
    }

    // Ordenar resultados
    query = query.order('status', { ascending: false }).order('name', { ascending: true })

    console.log(`[DRIVERS] Executando query Supabase com status: ${status}`)

    // Executar query principal
    const { data: drivers, error } = await query

    if (error) {
      console.error("[DRIVERS] Erro na query Supabase:", error)
      throw error
    }

    console.log(`[DRIVERS] Encontrados ${drivers?.length || 0} entregadores`)

    // Buscar pedidos ativos para entregadores ocupados
    const driversWithOrders = await Promise.all(
      (drivers || []).map(async (driver: any) => {
        if (driver.status === 'busy') {
          try {
            const { data: orders } = await supabase
              .from('orders')
              .select('id')
              .eq('driver_id', driver.id)
              .eq('status', 'ON_THE_WAY')

            return {
              ...driver,
              currentOrders: (orders || []).map((order: any) => order.id)
            }
          } catch (orderError) {
            console.warn(`[DRIVERS] Erro ao buscar pedidos do entregador ${driver.id}:`, orderError)
            return { ...driver, currentOrders: [] }
          }
        }
        return { ...driver, currentOrders: [] }
      })
    )

    // Calcular estatísticas (aplicar lógica de agregação no frontend)
    const allDrivers = drivers || []
    const statistics = {
      total: allDrivers.length,
      available: allDrivers.filter((d: any) => d.status === 'available').length,
      busy: allDrivers.filter((d: any) => d.status === 'busy').length,
      offline: allDrivers.filter((d: any) => d.status === 'offline').length,
      averageDeliveryTime: allDrivers.length > 0 
        ? Math.round(allDrivers.reduce((sum: number, d: any) => sum + (d.average_delivery_time || 0), 0) / allDrivers.length)
        : 0
    }

    console.log(`[DRIVERS] Retornando dados reais:`, statistics)
    
    return NextResponse.json({
      drivers: driversWithOrders,
      statistics
    })

  } catch (error: any) {
    console.error("[DRIVERS] Erro ao buscar entregadores:", error)
    
    return NextResponse.json({
      error: "Erro interno do servidor",
      message: "Erro ao acessar dados dos entregadores",
      drivers: [],
      statistics: { total: 0, available: 0, busy: 0, offline: 0, averageDeliveryTime: 0 }
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[DRIVERS] Iniciando criação de entregador")
    
    const data = await request.json()
    const { name, email, phone, vehicleType, vehiclePlate, currentLocation } = data

    // Validação de dados obrigatórios
    if (!name || !email || !phone || !vehicleType) {
      return NextResponse.json({
        error: "Campos obrigatórios missing",
        message: "name, email, phone e vehicleType são obrigatórios"
      }, { status: 400 })
    }

    // Verificar se já existe entregador com o mesmo email
    const { data: existingDriver } = await supabase
      .from('drivers')
      .select('id')
      .eq('email', email)
      .limit(1)

    if (existingDriver && existingDriver.length > 0) {
      return NextResponse.json({
        error: "Email já cadastrado",
        message: "Já existe um entregador com este email"
      }, { status: 400 })
    }

    // Inserir novo entregador usando Supabase
    const { data: newDriver, error: insertError } = await supabase
      .from('drivers')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        vehicle_type: vehicleType,
        vehicle_plate: vehiclePlate?.trim().toUpperCase() || null,
        current_location: currentLocation || null,
        status: 'offline', // Status inicial
        total_deliveries: 0,
        average_rating: 0,
        average_delivery_time: 0,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_active_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error("[DRIVERS] Erro ao inserir entregador:", insertError)
      throw insertError
    }

    console.log("[DRIVERS] Entregador criado com sucesso:", newDriver.id)

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
    console.error("[DRIVERS] Erro ao criar entregador:", error)
    
    return NextResponse.json({
      error: "Erro interno do servidor",
      message: "Erro ao criar entregador",
      details: error.message
    }, { status: 500 })
  }
}
