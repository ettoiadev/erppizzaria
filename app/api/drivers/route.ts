import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log("[DRIVERS] Iniciando busca de entregadores usando Supabase")
    
    const supabase = getSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    console.log(`[DRIVERS] Executando query Supabase com status: ${status}`)

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

    console.log(`[DRIVERS] Encontrados ${drivers?.length || 0} entregadores`)

    // Se não há entregadores, criar alguns de exemplo
    if (!drivers || drivers.length === 0) {
      console.log("[DRIVERS] Criando entregadores de exemplo...")
      
      const sampleDrivers = [
        { name: 'João Silva', email: 'joao.silva@entregador.com', phone: '11999999001', vehicle_type: 'motorcycle', vehicle_plate: 'ABC-1234', status: 'available', total_deliveries: 45, average_rating: 4.8, average_delivery_time: 25 },
        { name: 'Maria Santos', email: 'maria.santos@entregador.com', phone: '11999999002', vehicle_type: 'bicycle', vehicle_plate: 'BIC-001', status: 'busy', total_deliveries: 32, average_rating: 4.9, average_delivery_time: 18 },
        { name: 'Pedro Oliveira', email: 'pedro.oliveira@entregador.com', phone: '11999999003', vehicle_type: 'motorcycle', vehicle_plate: 'DEF-5678', status: 'offline', total_deliveries: 67, average_rating: 4.7, average_delivery_time: 30 },
        { name: 'Ana Costa', email: 'ana.costa@entregador.com', phone: '11999999004', vehicle_type: 'scooter', vehicle_plate: 'GHI-9012', status: 'available', total_deliveries: 28, average_rating: 4.6, average_delivery_time: 22 }
      ]

      const { data: newDrivers, error: insertError } = await supabase
        .from('drivers')
        .upsert(sampleDrivers, { onConflict: 'email', ignoreDuplicates: true })
        .select()

      if (insertError) {
        console.warn("[DRIVERS] Erro ao criar entregadores de exemplo:", insertError)
      } else {
        drivers.push(...(newDrivers || []))
      }
    }

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
              console.warn(`[DRIVERS] Erro ao buscar pedidos do entregador ${driver.id}:`, ordersError)
              return { ...driver, currentOrders: [] }
            }

            return {
              ...driver,
              currentOrders: (activeOrders || []).map((order: any) => order.id)
            }
          } catch (orderError) {
            console.warn(`[DRIVERS] Erro ao buscar pedidos do entregador ${driver.id}:`, orderError)
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
    
    const supabase = getSupabaseServerClient()
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
    const { data: existing, error: existingError } = await supabase
      .from('drivers')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .single()

    if (existing) {
      return NextResponse.json({
        error: "Email já cadastrado",
        message: "Já existe um entregador com este email"
      }, { status: 400 })
    }

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