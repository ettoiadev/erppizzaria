import { NextRequest, NextResponse } from "next/server"
import { query, pool } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("[DRIVERS] Iniciando busca de entregadores no PostgreSQL")
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    // Verificar se tabela drivers existe
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'drivers'
      ) as table_exists
    `)

    if (!tableCheck.rows[0].table_exists) {
      console.error("[DRIVERS] Tabela drivers não encontrada no banco williamdiskpizza")
      return NextResponse.json({
        error: "Tabela drivers não encontrada",
        message: "Execute o script setup-drivers-system.sql no pgAdmin4 primeiro",
        drivers: [],
        statistics: {
          total: 0,
          available: 0,
          busy: 0,
          offline: 0,
          averageDeliveryTime: 0
        }
      }, { status: 404 })
    }

    // Verificar se existe coluna 'active' para soft delete
    let hasActiveColumn = false
    try {
      const columnCheck = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'drivers' 
          AND column_name = 'active' 
          AND table_schema = 'public'
        ) as column_exists
      `)
      hasActiveColumn = columnCheck.rows[0].column_exists
      console.log(`[DRIVERS] Coluna 'active' existe: ${hasActiveColumn}`)
    } catch (columnError) {
      console.warn('[DRIVERS] Erro ao verificar coluna active:', columnError)
    }

    // Construir query com filtro de status E filtro de ativos
    let driversQuery = `
      SELECT 
        id, name, email, phone, vehicle_type, vehicle_plate,
        status, current_location, total_deliveries, average_rating,
        average_delivery_time, created_at, updated_at, last_active_at
        ${hasActiveColumn ? ', active' : ''}
      FROM drivers
    `
    
    const params: any[] = []
    let whereConditions: string[] = []

    // Filtrar apenas entregadores ativos (não desativados)
    if (hasActiveColumn) {
      whereConditions.push("(active = true OR active IS NULL)")
    }

    // Filtrar por status se especificado
    if (status && status !== "all") {
      whereConditions.push(`status = $${params.length + 1}`)
      params.push(status)
    }

    // Adicionar condições WHERE se existirem
    if (whereConditions.length > 0) {
      driversQuery += " WHERE " + whereConditions.join(" AND ")
    }
    
    driversQuery += " ORDER BY status DESC, name ASC"

    console.log(`[DRIVERS] Query construída:`, driversQuery)
    console.log(`[DRIVERS] Parâmetros:`, params)

    // Executar query principal
    const result = await query(driversQuery, params)
    console.log(`[DRIVERS] Encontrados ${result.rows.length} entregadores no banco`)

    // Buscar pedidos ativos para entregadores ocupados
    const driversWithOrders = await Promise.all(
      result.rows.map(async (driver: any) => {
        if (driver.status === 'busy') {
          try {
            const ordersResult = await query(
              "SELECT id FROM orders WHERE driver_id = $1 AND status = 'ON_THE_WAY'",
              [driver.id]
            )
            return {
              ...driver,
              currentOrders: ordersResult.rows.map((order: any) => order.id)
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
    const statistics = {
      total: result.rows.length,
      available: result.rows.filter((d: any) => d.status === 'available').length,
      busy: result.rows.filter((d: any) => d.status === 'busy').length,
      offline: result.rows.filter((d: any) => d.status === 'offline').length,
      averageDeliveryTime: result.rows.length > 0 
        ? Math.round(result.rows.reduce((sum: number, d: any) => sum + (d.average_delivery_time || 0), 0) / result.rows.length)
        : 0
    }

    console.log(`[DRIVERS] Retornando dados reais:`, statistics)
    
    return NextResponse.json({
      drivers: driversWithOrders,
      statistics
    })

  } catch (error: any) {
    console.error("[DRIVERS] Erro ao conectar com PostgreSQL:", error)
    
    // Retornar erro específico baseado no tipo
    if (error.code === 'ECONNREFUSED') {
      return NextResponse.json({
        error: "Não foi possível conectar ao PostgreSQL",
        message: "Verifique se o PostgreSQL está rodando na porta 5432",
        drivers: [],
        statistics: { total: 0, available: 0, busy: 0, offline: 0, averageDeliveryTime: 0 }
      }, { status: 503 })
    }

    if (error.code === '3D000') {
      return NextResponse.json({
        error: "Banco de dados williamdiskpizza não encontrado",
        message: "Crie o banco williamdiskpizza no PostgreSQL",
        drivers: [],
        statistics: { total: 0, available: 0, busy: 0, offline: 0, averageDeliveryTime: 0 }
      }, { status: 503 })
    }

    if (error.code === '28P01') {
      return NextResponse.json({
        error: "Falha na autenticação PostgreSQL",
        message: "Verifique as credenciais de acesso ao banco",
        drivers: [],
        statistics: { total: 0, available: 0, busy: 0, offline: 0, averageDeliveryTime: 0 }
      }, { status: 503 })
    }

    return NextResponse.json({
      error: "Erro interno do servidor",
      message: "Erro ao acessar banco de dados",
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

    // Verificar se tabela drivers existe
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'drivers'
      ) as table_exists
    `)

    if (!tableCheck.rows[0].table_exists) {
      return NextResponse.json({
        error: "Tabela drivers não encontrada",
        message: "Execute o script setup-drivers-system.sql no pgAdmin4 primeiro"
      }, { status: 404 })
    }

    // Inserir novo entregador
    const insertQuery = `
      INSERT INTO drivers (
        name, email, phone, vehicle_type, vehicle_plate, 
        current_location, status, last_active_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'offline', CURRENT_TIMESTAMP)
      RETURNING 
        id, name, email, phone, vehicle_type, vehicle_plate,
        status, current_location, total_deliveries, average_rating,
        average_delivery_time, created_at, updated_at, last_active_at
    `

    const result = await query(insertQuery, [
      name, email, phone, vehicleType, vehiclePlate, currentLocation
    ])

    const newDriver = {
      ...result.rows[0],
      currentOrders: []
    }

    console.log(`[DRIVERS] Entregador criado com sucesso: ${newDriver.name}`)

    return NextResponse.json({
      driver: newDriver,
      message: "Entregador criado com sucesso"
    })

  } catch (error: any) {
    console.error("[DRIVERS] Erro ao criar entregador:", error)
    
    if (error.code === '23505') {
      return NextResponse.json({
        error: "Email já cadastrado",
        message: "Já existe um entregador com este email"
      }, { status: 400 })
    }

    if (error.code === 'ECONNREFUSED') {
      return NextResponse.json({
        error: "Não foi possível conectar ao PostgreSQL",
        message: "Verifique se o PostgreSQL está rodando"
      }, { status: 503 })
    }

    return NextResponse.json({
      error: "Erro interno do servidor",
      message: "Erro ao salvar entregador no banco de dados"
    }, { status: 500 })
  }
}
