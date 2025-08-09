import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'
import { verifyAdmin } from '@/lib/auth'

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

    console.log('[DELIVERY_ZONES] Buscando zonas de entrega...')

    const supabase = getSupabaseServerClient()
    const { data: zonesRows, error: zonesErr } = await supabase
      .from('delivery_zones')
      .select('id, name, min_distance_km, max_distance_km, delivery_fee, estimated_time_minutes, active, color_hex, description, created_at, updated_at')
      .order('min_distance_km', { ascending: true })
    if (zonesErr) throw zonesErr

    // Buscar estatísticas de uso das zonas
    const { data: countAll } = await supabase
      .from('geocoded_addresses')
      .select('delivery_zone_id, is_deliverable')
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
    const supabase = getSupabaseServerClient()
    const { data: overlaps } = await supabase
      .from('delivery_zones')
      .select('id, name, min_distance_km, max_distance_km')
      .eq('active', true)
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

    // Criar zona
    const { data: newZone, error } = await supabase
      .from('delivery_zones')
      .insert({
        name: name.trim(),
        min_distance_km,
        max_distance_km,
        delivery_fee,
        estimated_time_minutes,
        color_hex: color_hex || '#3B82F6',
        description: description || null,
        active,
      })
      .select('*')
      .single()
    if (error) throw error

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