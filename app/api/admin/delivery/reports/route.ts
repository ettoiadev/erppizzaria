import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth'
import { query } from '@/lib/db'
import { frontendLogger } from '@/lib/frontend-logger'

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

    // Buscar entregas entregues (DELIVERED) com driver_id
    let whereConditions = ['status = $1', 'driver_id IS NOT NULL']
    let params: any[] = ['DELIVERED']
    let paramIndex = 2

    if (startDate) {
      whereConditions.push(`delivered_at >= $${paramIndex}`)
      params.push(new Date(startDate + 'T00:00:00.000Z').toISOString())
      paramIndex++
    }
    if (endDate) {
      whereConditions.push(`delivered_at <= $${paramIndex}`)
      params.push(new Date(endDate + 'T23:59:59.999Z').toISOString())
      paramIndex++
    }
    if (driverId && driverId !== 'all') {
      whereConditions.push(`driver_id = $${paramIndex}`)
      params.push(driverId)
      paramIndex++
    }

    const ordersResult = await query(
      `SELECT id, total, subtotal, delivery_fee, delivered_at, delivery_address, driver_id 
       FROM orders 
       WHERE ${whereConditions.join(' AND ')} 
       ORDER BY delivered_at DESC`,
      params
    )
    const orders = ordersResult.rows

    // Entregadores para filtros e para mapear no relatório
    const driversResult = await query('SELECT id, name, email, phone FROM drivers ORDER BY name')
    const drivers = driversResult.rows
    const driverMap = new Map<string, any>((drivers || []).map((d: any) => [String(d.id), d]))

    // Calcular products_value somando itens do pedido
    const deliveries = [] as any[]
    for (const ord of orders || []) {
      const itemsResult = await query(
        'SELECT unit_price, quantity FROM order_items WHERE order_id = $1',
        [ord.id]
      )
      const items = itemsResult.rows
      const products_value = (items || []).reduce((sum: number, it: any) => sum + (Number(it.unit_price || 0) * Number(it.quantity || 0)), 0) || Number(ord.subtotal || 0)
      const drv = driverMap.get(String(ord.driver_id))
      deliveries.push({
        id: ord.id,
        total: ord.total,
        subtotal: ord.subtotal,
        delivery_fee: ord.delivery_fee,
        delivered_at: ord.delivered_at,
        delivery_address: ord.delivery_address,
        driver_id: ord.driver_id,
        driver_name: drv?.name,
        driver_email: drv?.email,
        driver_phone: drv?.phone,
        products_value,
      })
    }

    frontendLogger.info('Relatório de entregas processado', 'api', {
      driversCount: drivers?.length || 0,
      deliveriesCount: deliveries.length,
      filters: { startDate, endDate, driverId }
    })

    // Agrupar entregas por entregador
    const deliveriesByDriver = deliveries.reduce((acc: any, delivery: any) => {
      const driverId = delivery.driver_id
      if (!driverId) {
        frontendLogger.warn('Entrega sem driver_id encontrada', 'api', { deliveryId: delivery.id })
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
        allDrivers: drivers || [],
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
    if (error instanceof Error) {
      frontendLogger.logError('Erro ao buscar relatório de entregas', {
        errorType: error.constructor.name,
        errorMessage: error.message,
        stack: error.stack?.substring(0, 200) + '...'
      }, error, 'api')
    } else {
      frontendLogger.logError('Erro desconhecido ao buscar relatório de entregas', {
        errorType: typeof error,
        errorValue: String(error)
      }, new Error(String(error)), 'api')
    }
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: 'Não foi possível buscar os dados do relatório'
      },
      { status: 500 }
    )
  }
}