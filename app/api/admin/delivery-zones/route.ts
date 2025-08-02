import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/postgres'
import { verifyAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.split(" ")[1]
    
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 })
    }

    const admin = await verifyAdmin(token)
    if (!admin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    console.log('[DELIVERY_ZONES] Buscando zonas de entrega...')

    const zonesResult = await query(`
      SELECT 
        id, name, min_distance_km, max_distance_km, delivery_fee,
        estimated_time_minutes, active, color_hex, description,
        created_at, updated_at
      FROM delivery_zones 
      ORDER BY min_distance_km ASC
    `)

    // Buscar estatísticas de uso das zonas
    const statsResult = await query(`
      SELECT 
        dz.id,
        dz.name,
        COUNT(ga.id) as cached_addresses,
        COUNT(CASE WHEN ga.is_deliverable = true THEN 1 END) as deliverable_addresses
      FROM delivery_zones dz
      LEFT JOIN geocoded_addresses ga ON dz.id = ga.delivery_zone_id
      GROUP BY dz.id, dz.name
      ORDER BY dz.min_distance_km ASC
    `)

    const stats = {}
    statsResult.rows.forEach(row => {
      stats[row.id] = {
        cached_addresses: parseInt(row.cached_addresses),
        deliverable_addresses: parseInt(row.deliverable_addresses)
      }
    })

    const zonesWithStats = zonesResult.rows.map(zone => ({
      ...zone,
      stats: stats[zone.id] || { cached_addresses: 0, deliverable_addresses: 0 }
    }))

    console.log('[DELIVERY_ZONES] Zonas encontradas:', zonesWithStats.length)

    return NextResponse.json({ 
      success: true,
      zones: zonesWithStats,
      total: zonesWithStats.length
    })

  } catch (error: any) {
    console.error('[DELIVERY_ZONES] Erro ao buscar zonas:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.split(" ")[1]
    
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 })
    }

    const admin = await verifyAdmin(token)
    if (!admin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const { 
      name, 
      min_distance_km, 
      max_distance_km, 
      delivery_fee, 
      estimated_time_minutes, 
      color_hex, 
      description,
      active = true
    } = await request.json()

    console.log('[DELIVERY_ZONES] Criando nova zona:', { name, min_distance_km, max_distance_km })

    // Validações
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Nome da zona é obrigatório' }, { status: 400 })
    }

    if (min_distance_km < 0) {
      return NextResponse.json({ error: 'Distância mínima deve ser >= 0' }, { status: 400 })
    }

    if (max_distance_km <= min_distance_km) {
      return NextResponse.json({ error: 'Distância máxima deve ser maior que a mínima' }, { status: 400 })
    }

    if (delivery_fee < 0) {
      return NextResponse.json({ error: 'Taxa de entrega deve ser >= 0' }, { status: 400 })
    }

    if (estimated_time_minutes <= 0) {
      return NextResponse.json({ error: 'Tempo estimado deve ser > 0' }, { status: 400 })
    }

    // Verificar sobreposição com zonas existentes
    const overlapResult = await query(`
      SELECT id, name, min_distance_km, max_distance_km
      FROM delivery_zones 
      WHERE active = true
        AND (
          (min_distance_km <= $1 AND max_distance_km >= $1) OR
          (min_distance_km <= $2 AND max_distance_km >= $2) OR
          (min_distance_km >= $1 AND max_distance_km <= $2)
        )
    `, [min_distance_km, max_distance_km])

    if (overlapResult.rows.length > 0) {
      const overlapping = overlapResult.rows[0]
      return NextResponse.json({
        error: `Sobreposição detectada com a zona "${overlapping.name}" (${overlapping.min_distance_km}km - ${overlapping.max_distance_km}km)`
      }, { status: 400 })
    }

    // Criar zona
    const result = await query(`
      INSERT INTO delivery_zones (
        name, min_distance_km, max_distance_km, delivery_fee, 
        estimated_time_minutes, color_hex, description, active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      name.trim(), 
      min_distance_km, 
      max_distance_km, 
      delivery_fee, 
      estimated_time_minutes, 
      color_hex || '#3B82F6', 
      description || null,
      active
    ])

    const newZone = result.rows[0]

    console.log('[DELIVERY_ZONES] Zona criada com sucesso:', newZone.id)

    return NextResponse.json({ 
      success: true,
      message: 'Zona de entrega criada com sucesso',
      zone: newZone
    })

  } catch (error: any) {
    console.error('[DELIVERY_ZONES] Erro ao criar zona:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}