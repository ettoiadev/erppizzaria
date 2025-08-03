import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { verifyAdmin } from '@/lib/auth'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

export async function GET(request: NextRequest) {
  const client = await pool.connect()
  
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

    // Verificar se há entregadores
    const driversResult = await client.query('SELECT COUNT(*) as total FROM drivers')
    const driversCount = parseInt(driversResult.rows[0].total)

    // Verificar se há pedidos
    const ordersResult = await client.query('SELECT COUNT(*) as total FROM orders')
    const ordersCount = parseInt(ordersResult.rows[0].total)

    // Verificar pedidos entregues
    const deliveredOrdersResult = await client.query("SELECT COUNT(*) as total FROM orders WHERE status = 'DELIVERED'")
    const deliveredOrdersCount = parseInt(deliveredOrdersResult.rows[0].total)

    // Verificar pedidos entregues com driver_id
    const deliveredWithDriverResult = await client.query("SELECT COUNT(*) as total FROM orders WHERE status = 'DELIVERED' AND driver_id IS NOT NULL")
    const deliveredWithDriverCount = parseInt(deliveredWithDriverResult.rows[0].total)

    // Buscar alguns entregadores de exemplo
    const sampleDriversResult = await client.query('SELECT id, name, email, status FROM drivers LIMIT 5')
    const sampleDrivers = sampleDriversResult.rows

    // Buscar alguns pedidos de exemplo
    const sampleOrdersResult = await client.query(`
      SELECT o.id, o.status, o.total, o.driver_id, o.delivered_at, d.name as driver_name
      FROM orders o
      LEFT JOIN drivers d ON o.driver_id = d.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `)
    const sampleOrders = sampleOrdersResult.rows

    return NextResponse.json({
      success: true,
      data: {
        statistics: {
          driversCount,
          ordersCount,
          deliveredOrdersCount,
          deliveredWithDriverCount
        },
        samples: {
          drivers: sampleDrivers,
          orders: sampleOrders
        },
        analysis: {
          hasDrivers: driversCount > 0,
          hasOrders: ordersCount > 0,
          hasDeliveredOrders: deliveredOrdersCount > 0,
          hasDeliveredWithDriver: deliveredWithDriverCount > 0,
          canGenerateReport: driversCount > 0 && deliveredWithDriverCount > 0
        }
      }
    })

  } catch (error) {
    console.error('Erro ao verificar dados de teste:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: 'Não foi possível verificar os dados'
      },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}