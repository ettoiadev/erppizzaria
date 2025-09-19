import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyAdmin } from '@/lib/auth'
import { frontendLogger } from '@/lib/frontend-logger'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Validar UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(params.id)) {
      return NextResponse.json({ error: "ID de zona inválido" }, { status: 400 })
    }

    frontendLogger.info('Buscando zona de entrega', 'api', { zone_id: params.id })

    const zoneResult = await query(
      'SELECT * FROM delivery_zones WHERE id = $1',
      [params.id]
    )

    if (zoneResult.rows.length === 0) {
      return NextResponse.json({ error: "Zona não encontrada" }, { status: 404 })
    }

    const zone = zoneResult.rows[0]

    // Buscar estatísticas da zona via aplicação
    const addrsResult = await query(
      'SELECT is_deliverable, confidence_score, last_verified FROM geocoded_addresses WHERE delivery_zone_id = $1',
      [params.id]
    )
    const addrs = addrsResult.rows

    const totalAddresses = (addrs || []).length
    const deliverableAddresses = (addrs || []).filter((a: any) => a.is_deliverable).length
    const avgConfidence = (addrs || []).reduce((s: number, a: any) => s + (Number(a.confidence_score) || 0), 0) / (totalAddresses || 1)
    const lastVerified = (addrs || []).reduce((m: string | null, a: any) => {
      const v = a.last_verified
      if (!v) return m
      return !m || new Date(v) > new Date(m) ? v : m
    }, null as string | null)

    return NextResponse.json({
      success: true,
      zone: {
        ...zone,
        stats: {
          total_addresses: totalAddresses,
          deliverable_addresses: deliverableAddresses,
          avg_confidence: totalAddresses ? Number(avgConfidence.toFixed(2)) : null,
          last_address_verified: lastVerified
        }
      }
    })

  } catch (error: any) {
    frontendLogger.logError('Erro ao buscar zona de entrega', { error: error.message }, error, 'api')
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Validar UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(params.id)) {
      return NextResponse.json({ error: "ID de zona inválido" }, { status: 400 })
    }

    const { 
      name, 
      min_distance_km, 
      max_distance_km, 
      delivery_fee, 
      estimated_time_minutes, 
      color_hex, 
      description,
      active
    } = await request.json()

    frontendLogger.info('Atualizando zona de entrega', 'api', { zone_id: params.id })

    const existingResult = await query(
      'SELECT * FROM delivery_zones WHERE id = $1',
      [params.id]
    )

    if (existingResult.rows.length === 0) {
      return NextResponse.json({ error: "Zona não encontrada" }, { status: 404 })
    }

    const existing = existingResult.rows[0]

    // Validações
    if (name && name.trim().length === 0) {
      return NextResponse.json({ error: 'Nome da zona não pode estar vazio' }, { status: 400 })
    }

    if (min_distance_km !== undefined && min_distance_km < 0) {
      return NextResponse.json({ error: 'Distância mínima deve ser >= 0' }, { status: 400 })
    }

    if (max_distance_km !== undefined && min_distance_km !== undefined && max_distance_km <= min_distance_km) {
      return NextResponse.json({ error: 'Distância máxima deve ser maior que a mínima' }, { status: 400 })
    }

    if (delivery_fee !== undefined && delivery_fee < 0) {
      return NextResponse.json({ error: 'Taxa de entrega deve ser >= 0' }, { status: 400 })
    }

    if (estimated_time_minutes !== undefined && estimated_time_minutes <= 0) {
      return NextResponse.json({ error: 'Tempo estimado deve ser > 0' }, { status: 400 })
    }

    // Verificar sobreposição com outras zonas (se mudou distâncias)
    if (min_distance_km !== undefined || max_distance_km !== undefined) {
      const currentZone = existing
      const newMinDist = min_distance_km !== undefined ? min_distance_km : currentZone.min_distance_km
      const newMaxDist = max_distance_km !== undefined ? max_distance_km : currentZone.max_distance_km

      const othersResult = await query(
        'SELECT id, name, min_distance_km, max_distance_km FROM delivery_zones WHERE active = true AND id != $1',
        [params.id]
      )
      const others = othersResult.rows

      const overlapping = (others || []).find((o: any) => {
        const min = Number(o.min_distance_km)
        const max = Number(o.max_distance_km)
        return (min <= newMinDist && max >= newMinDist) ||
               (min <= newMaxDist && max >= newMaxDist) ||
               (min >= newMinDist && max <= newMaxDist)
      })

      if (overlapping) {
        return NextResponse.json({
          error: `Sobreposição detectada com a zona "${overlapping.name}" (${overlapping.min_distance_km}km - ${overlapping.max_distance_km}km)`
        }, { status: 400 })
      }
    }

    const updates: any = {}
    if (name !== undefined) updates.name = name?.trim()
    if (min_distance_km !== undefined) updates.min_distance_km = min_distance_km
    if (max_distance_km !== undefined) updates.max_distance_km = max_distance_km
    if (delivery_fee !== undefined) updates.delivery_fee = delivery_fee
    if (estimated_time_minutes !== undefined) updates.estimated_time_minutes = estimated_time_minutes
    if (color_hex !== undefined) updates.color_hex = color_hex
    if (description !== undefined) updates.description = description
    if (active !== undefined) updates.active = active

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    updates.updated_at = new Date().toISOString()
    
    const updateFields = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ')
    const updateValues = Object.values(updates)
    
    const updatedZoneResult = await query(
      `UPDATE delivery_zones SET ${updateFields} WHERE id = $1 RETURNING *`,
      [params.id, ...updateValues]
    )
    
    if (updatedZoneResult.rows.length === 0) {
      throw new Error('Falha ao atualizar zona')
    }
    
    const updatedZone = updatedZoneResult.rows[0]

    // Se mudou distâncias, invalidar cache de endereços da zona
    if (min_distance_km !== undefined || max_distance_km !== undefined) {
      await query(
        'UPDATE geocoded_addresses SET delivery_zone_id = NULL, last_verified = $1 WHERE delivery_zone_id = $2',
        [new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), params.id]
      )
      frontendLogger.info('Cache invalidado devido à mudança de distâncias', 'api', { zone_id: params.id })
    }

    frontendLogger.info('Zona de entrega atualizada com sucesso', 'api', { zone_id: params.id })

    return NextResponse.json({ 
      success: true,
      message: 'Zona atualizada com sucesso',
      zone: updatedZone
    })

  } catch (error: any) {
    frontendLogger.logError('Erro ao atualizar zona de entrega', { error: error.message, stack: error.stack }, error, 'api')
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Validar UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(params.id)) {
      return NextResponse.json({ error: "ID de zona inválido" }, { status: 400 })
    }

    frontendLogger.info('Deletando zona de entrega', 'api', { zone_id: params.id })

    const existingResult = await query(
      'SELECT name FROM delivery_zones WHERE id = $1',
      [params.id]
    )

    if (existingResult.rows.length === 0) {
      return NextResponse.json({ error: "Zona não encontrada" }, { status: 404 })
    }

    const zoneName = existingResult.rows[0].name

    // Verificar quantas zonas restam
    const zonesActiveResult = await query(
      'SELECT id FROM delivery_zones WHERE active = true',
      []
    )
    const totalZones = zonesActiveResult.rows.length
    
    if (totalZones <= 1) {
      return NextResponse.json({
        error: "Não é possível deletar a última zona de entrega ativa"
      }, { status: 400 })
    }

    // Verificar se há endereços usando esta zona
    const addrRowsResult = await query(
      'SELECT id FROM geocoded_addresses WHERE delivery_zone_id = $1',
      [params.id]
    )
    const addressesCount = addrRowsResult.rows.length

    // Deletar zona (isso também irá limpar as referências em geocoded_addresses devido ao ON DELETE SET NULL)
    const deleteResult = await query(
      'DELETE FROM delivery_zones WHERE id = $1',
      [params.id]
    )
    
    if (deleteResult.rowCount === 0) {
      return NextResponse.json({ error: "Erro ao deletar zona" }, { status: 500 })
    }

    frontendLogger.info('Zona de entrega deletada com sucesso', 'api', { zone_id: params.id })

    return NextResponse.json({ 
      success: true,
      message: `Zona "${zoneName}" deletada com sucesso`,
      affected_addresses: addressesCount
    })

  } catch (error: any) {
    frontendLogger.logError('Erro ao deletar zona de entrega', { error: error.message, stack: error.stack }, error, 'api')
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}