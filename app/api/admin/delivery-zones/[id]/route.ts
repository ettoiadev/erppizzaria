import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/postgres'
import { verifyAdmin } from '@/lib/auth'

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

    console.log('[DELIVERY_ZONE] Buscando zona:', params.id)

    const zoneResult = await query(`
      SELECT * FROM delivery_zones WHERE id = $1
    `, [params.id])

    if (zoneResult.rows.length === 0) {
      return NextResponse.json({ error: "Zona não encontrada" }, { status: 404 })
    }

    const zone = zoneResult.rows[0]

    // Buscar estatísticas da zona
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_addresses,
        COUNT(CASE WHEN is_deliverable = true THEN 1 END) as deliverable_addresses,
        AVG(confidence_score) as avg_confidence,
        MAX(last_verified) as last_address_verified
      FROM geocoded_addresses 
      WHERE delivery_zone_id = $1
    `, [params.id])

    const stats = statsResult.rows[0] || {
      total_addresses: 0,
      deliverable_addresses: 0,
      avg_confidence: null,
      last_address_verified: null
    }

    return NextResponse.json({
      success: true,
      zone: {
        ...zone,
        stats: {
          total_addresses: parseInt(stats.total_addresses),
          deliverable_addresses: parseInt(stats.deliverable_addresses),
          avg_confidence: stats.avg_confidence ? parseFloat(stats.avg_confidence) : null,
          last_address_verified: stats.last_address_verified
        }
      }
    })

  } catch (error: any) {
    console.error('[DELIVERY_ZONE] Erro ao buscar zona:', error)
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

    console.log('[DELIVERY_ZONE] Atualizando zona:', params.id)

    // Verificar se a zona existe
    const existingResult = await query(`
      SELECT * FROM delivery_zones WHERE id = $1
    `, [params.id])

    if (existingResult.rows.length === 0) {
      return NextResponse.json({ error: "Zona não encontrada" }, { status: 404 })
    }

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
      const currentZone = existingResult.rows[0]
      const newMinDist = min_distance_km !== undefined ? min_distance_km : currentZone.min_distance_km
      const newMaxDist = max_distance_km !== undefined ? max_distance_km : currentZone.max_distance_km

      const overlapResult = await query(`
        SELECT id, name, min_distance_km, max_distance_km
        FROM delivery_zones 
        WHERE active = true AND id != $1
          AND (
            (min_distance_km <= $2 AND max_distance_km >= $2) OR
            (min_distance_km <= $3 AND max_distance_km >= $3) OR
            (min_distance_km >= $2 AND max_distance_km <= $3)
          )
      `, [params.id, newMinDist, newMaxDist])

      if (overlapResult.rows.length > 0) {
        const overlapping = overlapResult.rows[0]
        return NextResponse.json({
          error: `Sobreposição detectada com a zona "${overlapping.name}" (${overlapping.min_distance_km}km - ${overlapping.max_distance_km}km)`
        }, { status: 400 })
      }
    }

    // Preparar campos para atualização
    const updateFields = []
    const updateValues = []
    let paramIndex = 1

    const fieldsToUpdate = {
      name: name?.trim(),
      min_distance_km,
      max_distance_km,
      delivery_fee,
      estimated_time_minutes,
      color_hex,
      description,
      active
    }

    Object.entries(fieldsToUpdate).forEach(([field, value]) => {
      if (value !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`)
        updateValues.push(value)
        paramIndex++
      }
    })

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    // Sempre atualizar updated_at
    updateFields.push('updated_at = NOW()')
    updateValues.push(params.id)

    const result = await query(`
      UPDATE delivery_zones 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, updateValues)

    const updatedZone = result.rows[0]

    // Se mudou distâncias, invalidar cache de endereços da zona
    if (min_distance_km !== undefined || max_distance_km !== undefined) {
      await query(`
        UPDATE geocoded_addresses 
        SET delivery_zone_id = NULL, last_verified = NOW() - INTERVAL '1 year'
        WHERE delivery_zone_id = $1
      `, [params.id])
      console.log('[DELIVERY_ZONE] Cache invalidado devido à mudança de distâncias')
    }

    console.log('[DELIVERY_ZONE] Zona atualizada com sucesso:', params.id)

    return NextResponse.json({ 
      success: true,
      message: 'Zona atualizada com sucesso',
      zone: updatedZone
    })

  } catch (error: any) {
    console.error('[DELIVERY_ZONE] Erro ao atualizar zona:', error)
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

    console.log('[DELIVERY_ZONE] Deletando zona:', params.id)

    // Verificar se a zona existe
    const existingResult = await query(`
      SELECT name FROM delivery_zones WHERE id = $1
    `, [params.id])

    if (existingResult.rows.length === 0) {
      return NextResponse.json({ error: "Zona não encontrada" }, { status: 404 })
    }

    const zoneName = existingResult.rows[0].name

    // Verificar quantas zonas restam
    const totalZonesResult = await query(`
      SELECT COUNT(*) as count FROM delivery_zones WHERE active = true
    `)
    
    const totalZones = parseInt(totalZonesResult.rows[0].count)
    
    if (totalZones <= 1) {
      return NextResponse.json({
        error: "Não é possível deletar a última zona de entrega ativa"
      }, { status: 400 })
    }

    // Verificar se há endereços usando esta zona
    const addressesResult = await query(`
      SELECT COUNT(*) as count FROM geocoded_addresses WHERE delivery_zone_id = $1
    `, [params.id])

    const addressesCount = parseInt(addressesResult.rows[0].count)

    // Deletar zona (isso também irá limpar as referências em geocoded_addresses devido ao ON DELETE SET NULL)
    const deleteResult = await query(`
      DELETE FROM delivery_zones WHERE id = $1
    `, [params.id])

    if (deleteResult.rowCount === 0) {
      return NextResponse.json({ error: "Erro ao deletar zona" }, { status: 500 })
    }

    console.log('[DELIVERY_ZONE] Zona deletada com sucesso:', params.id)

    return NextResponse.json({ 
      success: true,
      message: `Zona "${zoneName}" deletada com sucesso`,
      affected_addresses: addressesCount
    })

  } catch (error: any) {
    console.error('[DELIVERY_ZONE] Erro ao deletar zona:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}