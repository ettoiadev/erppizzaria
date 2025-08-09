import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth'
import { getSupabaseServerClient } from '@/lib/supabase'

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

    const supabase = getSupabaseServerClient()

    // Buscar entregas entregues (DELIVERED) com driver_id
    let ordersQuery = supabase
      .from('orders')
      .select('id, total, subtotal, delivery_fee, delivered_at, delivery_address, driver_id')
      .eq('status', 'DELIVERED')
      .not('driver_id', 'is', null)
      .order('delivered_at', { ascending: false })

    if (startDate) {
      ordersQuery = ordersQuery.gte('delivered_at', new Date(startDate + 'T00:00:00.000Z').toISOString())
    }
    if (endDate) {
      ordersQuery = ordersQuery.lte('delivered_at', new Date(endDate + 'T23:59:59.999Z').toISOString())
    }
    if (driverId && driverId !== 'all') {
      ordersQuery = ordersQuery.eq('driver_id', driverId)
    }

    const { data: orders, error } = await ordersQuery
    if (error) throw error

    // Entregadores para filtros e para mapear no relatório
    const { data: drivers } = await supabase.from('drivers').select('id, name, email, phone').order('name')
    const driverMap = new Map<string, any>((drivers || []).map((d: any) => [String(d.id), d]))

    // Calcular products_value somando itens do pedido
    const deliveries = [] as any[]
    for (const ord of orders || []) {
      const { data: items } = await supabase
        .from('order_items')
        .select('price:unit_price, quantity')
        .eq('order_id', ord.id)
      const products_value = (items || []).reduce((sum: number, it: any) => sum + (Number(it.price || 0) * Number(it.quantity || 0)), 0) || Number(ord.subtotal || 0)
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

    console.log(`[DELIVERY_REPORT] Encontrados ${drivers?.length || 0} entregadores`)
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