import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth'
import { query } from '@/lib/postgres'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const driverId = searchParams.get('driverId')

  try {
    // Verificar autenticação de admin
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    const admin = await verifyAdmin(token)
    if (!admin) {
      return NextResponse.json(
        { error: 'Acesso negado - usuário não é admin' },
        { status: 403 }
      )
    }

    // Construir query base para buscar entregas
    let whereConditions = ["o.status = 'DELIVERED'", "o.driver_id IS NOT NULL"]
    let queryParams: any[] = []
    let paramCount = 0

    // Filtrar por data
    if (startDate) {
      paramCount++
      whereConditions.push(`o.delivered_at >= $${paramCount}`)
      queryParams.push(new Date(startDate + 'T00:00:00.000Z'))
    }

    if (endDate) {
      paramCount++
      whereConditions.push(`o.delivered_at <= $${paramCount}`)
      queryParams.push(new Date(endDate + 'T23:59:59.999Z'))
    }

    // Filtrar por entregador específico
    if (driverId && driverId !== 'all') {
      paramCount++
      whereConditions.push(`o.driver_id = $${paramCount}`)
      queryParams.push(driverId)
    }

    const whereClause = whereConditions.join(' AND ')

    // Query principal para buscar entregas com detalhes
    const deliveriesQuery = `
      SELECT 
        o.id,
        o.total,
        o.subtotal,
        o.delivery_fee,
        o.delivered_at,
        o.delivery_address,
        o.driver_id,
        d.name as driver_name,
        d.email as driver_email,
        d.phone as driver_phone,
        -- Calcular valor dos produtos (pizzas)
        COALESCE(
          (SELECT SUM(oi.price * oi.quantity) 
           FROM order_items oi 
           WHERE oi.order_id = o.id), 
          o.subtotal
        ) as products_value
      FROM orders o
      INNER JOIN drivers d ON o.driver_id = d.id
      WHERE ${whereClause}
      ORDER BY o.delivered_at DESC
    `

    const deliveriesResult = await query(deliveriesQuery, queryParams)
    const deliveries = deliveriesResult.rows

    // Query para buscar todos os entregadores (para filtros)
    const driversQuery = `
      SELECT id, name, email, phone
      FROM drivers
      ORDER BY name
    `
    const driversResult = await query(driversQuery)
    const drivers = driversResult.rows

    console.log(`[DELIVERY_REPORT] Encontrados ${drivers.length} entregadores`)
    console.log(`[DELIVERY_REPORT] Encontradas ${deliveries.length} entregas entregues`)
    console.log(`[DELIVERY_REPORT] Filtros aplicados: startDate=${startDate}, endDate=${endDate}, driverId=${driverId}`)

    // Agrupar entregas por entregador
    const deliveriesByDriver = deliveries.reduce((acc: any, delivery: any) => {
      const driverId = delivery.driver_id
      if (!driverId) {
        console.log(`[DELIVERY_REPORT] Entrega ${delivery.id} sem driver_id - ignorando`)
        return acc
      }

      if (!acc[driverId]) {
        acc[driverId] = {
          driver: {
            id: driverId,
            name: delivery.driver_name,
            email: delivery.driver_email,
            phone: delivery.driver_phone
          },
          deliveries: [],
          totalDeliveries: 0,
          totalEarnings: 0
        }
      }

      acc[driverId].deliveries.push({
        id: delivery.id,
        total: parseFloat(delivery.total),
        subtotal: parseFloat(delivery.subtotal),
        delivery_fee: parseFloat(delivery.delivery_fee),
        products_value: parseFloat(delivery.products_value),
        delivered_at: delivery.delivered_at,
        delivery_address: delivery.delivery_address
      })

      acc[driverId].totalDeliveries++
      return acc
    }, {})

    // Converter para array
    const reportData = Object.values(deliveriesByDriver)

    return NextResponse.json({
      success: true,
      data: {
        deliveriesByDriver: reportData,
        allDrivers: drivers,
        summary: {
          totalDeliveries: deliveries.length,
          totalDrivers: Object.keys(deliveriesByDriver).length,
          dateRange: {
            start: startDate,
            end: endDate
          }
        }
      }
    })

  } catch (error) {
    console.error('Erro ao buscar relatório de entregas:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: 'Não foi possível buscar os dados do relatório'
      },
      { status: 500 }
    )
  }
}