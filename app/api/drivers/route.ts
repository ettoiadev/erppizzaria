import { NextRequest, NextResponse } from "next/server"
import { query } from '@/lib/postgres'

export async function GET(request: NextRequest) {
  try {
    console.log("[DRIVERS] Iniciando busca de entregadores usando PostgreSQL")
    
    // Primeiro, garantir que a tabela drivers existe
    await query(`
      CREATE TABLE IF NOT EXISTS public.drivers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        vehicle_type VARCHAR(50) NOT NULL CHECK (vehicle_type IN ('motorcycle', 'bicycle', 'car', 'scooter')),
        vehicle_plate VARCHAR(20),
        status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('available', 'busy', 'offline')),
        current_location JSONB,
        total_deliveries INTEGER DEFAULT 0,
        average_rating DECIMAL(3,2) DEFAULT 0.00,
        average_delivery_time INTEGER DEFAULT 0,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Criar índices se não existem
    await query('CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_drivers_active ON drivers(active)');
    await query('CREATE INDEX IF NOT EXISTS idx_drivers_email ON drivers(email)');

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    // Construir query com filtros
    let whereClause = 'WHERE (active IS NULL OR active = true)'
    const queryParams: any[] = []

    // Filtrar por status se especificado
    if (status && status !== "all") {
      whereClause += ' AND status = $1'
      queryParams.push(status)
    }

    console.log(`[DRIVERS] Executando query PostgreSQL com status: ${status}`)

    // Executar query principal
    const driversResult = await query(`
      SELECT 
        id, name, email, phone, vehicle_type, vehicle_plate, 
        status, current_location, total_deliveries, average_rating, 
        average_delivery_time, created_at, updated_at, last_active_at, active
      FROM drivers 
      ${whereClause}
      ORDER BY 
        CASE status 
          WHEN 'available' THEN 1 
          WHEN 'busy' THEN 2 
          WHEN 'offline' THEN 3 
          ELSE 4 
        END,
        name ASC
    `, queryParams);

    const drivers = driversResult.rows;
    console.log(`[DRIVERS] Encontrados ${drivers.length} entregadores`)

    // Se não há entregadores, criar alguns de exemplo
    if (drivers.length === 0) {
      console.log("[DRIVERS] Criando entregadores de exemplo...")
      
      await query(`
        INSERT INTO drivers (name, email, phone, vehicle_type, vehicle_plate, status, total_deliveries, average_rating, average_delivery_time) VALUES
        ('João Silva', 'joao.silva@entregador.com', '11999999001', 'motorcycle', 'ABC-1234', 'available', 45, 4.8, 25),
        ('Maria Santos', 'maria.santos@entregador.com', '11999999002', 'bicycle', 'BIC-001', 'busy', 32, 4.9, 18),
        ('Pedro Oliveira', 'pedro.oliveira@entregador.com', '11999999003', 'motorcycle', 'DEF-5678', 'offline', 67, 4.7, 30),
        ('Ana Costa', 'ana.costa@entregador.com', '11999999004', 'scooter', 'GHI-9012', 'available', 28, 4.6, 22)
        ON CONFLICT (email) DO NOTHING
      `);

      // Buscar novamente após inserir
      const newDriversResult = await query(`
        SELECT 
          id, name, email, phone, vehicle_type, vehicle_plate, 
          status, current_location, total_deliveries, average_rating, 
          average_delivery_time, created_at, updated_at, last_active_at, active
        FROM drivers 
        ${whereClause}
        ORDER BY 
          CASE status 
            WHEN 'available' THEN 1 
            WHEN 'busy' THEN 2 
            WHEN 'offline' THEN 3 
            ELSE 4 
          END,
          name ASC
      `, queryParams);

      drivers.push(...newDriversResult.rows);
    }

    // Buscar pedidos ativos para entregadores ocupados
    const driversWithOrders = await Promise.all(
      drivers.map(async (driver: any) => {
        if (driver.status === 'busy') {
          try {
            // Adicionar coluna driver_id na tabela orders se não existir
            await query(`
              ALTER TABLE orders 
              ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL
            `);

            const ordersResult = await query(`
              SELECT id FROM orders 
              WHERE driver_id = $1 AND status = 'OUT_FOR_DELIVERY'
            `, [driver.id]);

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
      total: drivers.length,
      available: drivers.filter((d: any) => d.status === 'available').length,
      busy: drivers.filter((d: any) => d.status === 'busy').length,
      offline: drivers.filter((d: any) => d.status === 'offline').length,
      averageDeliveryTime: drivers.length > 0 
        ? Math.round(drivers.reduce((sum: number, d: any) => sum + (d.average_delivery_time || 0), 0) / drivers.length)
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
    const existingResult = await query(`
      SELECT id FROM drivers WHERE email = $1 LIMIT 1
    `, [email.trim().toLowerCase()]);

    if (existingResult.rows.length > 0) {
      return NextResponse.json({
        error: "Email já cadastrado",
        message: "Já existe um entregador com este email"
      }, { status: 400 })
    }

    // Inserir novo entregador
    const newDriverResult = await query(`
      INSERT INTO drivers (
        name, email, phone, vehicle_type, vehicle_plate, 
        current_location, status, total_deliveries, average_rating, 
        average_delivery_time, active, created_at, updated_at, last_active_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 'offline', 0, 0.00, 0, true, NOW(), NOW(), NOW()
      ) RETURNING *
    `, [
      name.trim(),
      email.trim().toLowerCase(),
      phone.trim(),
      vehicleType,
      vehiclePlate?.trim().toUpperCase() || null,
      currentLocation ? JSON.stringify(currentLocation) : null
    ]);

    const newDriver = newDriverResult.rows[0];
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