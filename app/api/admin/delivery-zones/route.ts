import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyAdmin } from '@/lib/auth'
import { frontendLogger } from '@/lib/frontend-logger'

export const dynamic = 'force-dynamic'

interface ZoneStat {
  cached_addresses: number
  deliverable_addresses: number
}

type ZoneStatsMap = Record<string, ZoneStat>

interface StatsRow {
  id: string | number
  name?: string
  cached_addresses: string | number
  deliverable_addresses: string | number
}

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

    frontendLogger.info('Buscando zonas de entrega')

    // Buscar zonas de entrega usando PostgreSQL
    const zonesResult = await query(
      `SELECT id, name, min_distance_km, max_distance_km, delivery_fee, estimated_time_minutes, 
              active, color_hex, description, created_at, updated_at
       FROM delivery_zones 
       ORDER BY min_distance_km ASC`
    )
    const zonesRows = zonesResult.rows

    // Buscar estatísticas de uso das zonas
    const statsResult = await query(
      'SELECT delivery_zone_id, is_deliverable FROM geocoded_addresses'
    )
    const countAll = statsResult.rows
    const statsMap: Record<string, { cached_addresses: number; deliverable_addresses: number }> = {}
    ;(countAll || []).forEach((row: any) => {
      const key = String(row.delivery_zone_id)
      if (!statsMap[key]) statsMap[key] = { cached_addresses: 0, deliverable_addresses: 0 }
      statsMap[key].cached_addresses++
      if (row.is_deliverable) statsMap[key].deliverable_addresses++
    })

    const stats: ZoneStatsMap = Object.fromEntries(Object.entries(statsMap)) as ZoneStatsMap

    const zonesWithStats = (zonesRows || []).map((zone: any) => ({
      ...zone,
      stats: stats[String(zone.id)] || { cached_addresses: 0, deliverable_addresses: 0 }
    }))

    frontendLogger.info('Zonas de entrega encontradas', 'api', { count: zonesWithStats.length })

    return NextResponse.json({ 
      success: true,
      zones: zonesWithStats,
      total: zonesWithStats.length
    })

  } catch (error: any) {
    frontendLogger.logError('Erro ao buscar zonas de entrega', { error: error.message, stack: error.stack })
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

    frontendLogger.info('Criando nova zona de entrega', 'api', { name, min_distance_km, max_distance_km })

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

    // Verificar sobreposição com zonas existentes usando PostgreSQL
    const overlapsResult = await query(
      'SELECT id, name, min_distance_km, max_distance_km FROM delivery_zones WHERE active = true'
    )
    const overlaps = overlapsResult.rows
    const overlapping = (overlaps || []).find((z: any) => (
      (z.min_distance_km <= min_distance_km && z.max_distance_km >= min_distance_km) ||
      (z.min_distance_km <= max_distance_km && z.max_distance_km >= max_distance_km) ||
      (z.min_distance_km >= min_distance_km && z.max_distance_km <= max_distance_km)
    ))
    if (overlapping) {
      return NextResponse.json({
        error: `Sobreposição detectada com a zona "${overlapping.name}" (${overlapping.min_distance_km}km - ${overlapping.max_distance_km}km)`
      }, { status: 400 })
    }

    // Criar zona usando PostgreSQL
    const insertResult = await query(
      `INSERT INTO delivery_zones (name, min_distance_km, max_distance_km, delivery_fee, 
                                   estimated_time_minutes, color_hex, description, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        name.trim(),
        min_distance_km,
        max_distance_km,
        delivery_fee,
        estimated_time_minutes,
        color_hex || '#3B82F6',
        description || null,
        active
      ]
    )
    const newZone = insertResult.rows[0]

    frontendLogger.info('Zona de entrega criada com sucesso', 'api', { zoneId: newZone.id, name: newZone.name })

    return NextResponse.json({ 
      success: true,
      message: 'Zona de entrega criada com sucesso',
      zone: newZone
    })

  } catch (error: any) {
    frontendLogger.logError('Erro ao criar zona de entrega', { error: error.message, stack: error.stack })
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}