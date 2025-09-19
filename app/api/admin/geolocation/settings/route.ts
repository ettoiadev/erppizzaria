import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyAdmin } from '@/lib/auth'
import { frontendLogger } from '@/lib/frontend-logger'

export const dynamic = 'force-dynamic'

type GeolocationSettingsMap = Record<string, string>

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

    frontendLogger.info('Buscando configurações de geolocalização')

    const result = await query(`
      SELECT setting_key, setting_value, description
      FROM admin_settings
      WHERE setting_type = $1
      ORDER BY setting_key
    `, ['geolocation'])
    
    const settings: GeolocationSettingsMap = {}
    result.rows.forEach((row: any) => { settings[row.setting_key] = row.setting_value })

    frontendLogger.info('Configurações de geolocalização encontradas', 'api', { count: Object.keys(settings).length })

    return NextResponse.json({ 
      success: true,
      settings,
      count: result.rows.length
    })

  } catch (error: any) {
    frontendLogger.logError('Erro ao buscar configurações de geolocalização', { error: error.message, stack: error.stack }, error, 'api')
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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

    const settings = await request.json() as GeolocationSettingsMap

    frontendLogger.info('Atualizando configurações de geolocalização', 'api', { keys: Object.keys(settings) })

    // Validações específicas
    const validations: Record<string, (val: string) => boolean> = {
      pizzaria_latitude: (val) => {
        const lat = parseFloat(val)
        return !isNaN(lat) && lat >= -90 && lat <= 90
      },
      pizzaria_longitude: (val) => {
        const lon = parseFloat(val)
        return !isNaN(lon) && lon >= -180 && lon <= 180
      },
      max_delivery_radius_km: (val) => {
        const radius = parseFloat(val)
        return !isNaN(radius) && radius > 0 && radius <= 100
      },
      fallback_delivery_fee: (val) => {
        const fee = parseFloat(val)
        return !isNaN(fee) && fee >= 0
      },
      geocoding_cache_hours: (val) => {
        const hours = parseInt(val)
        return !isNaN(hours) && hours > 0 && hours <= 8760 // máximo 1 ano
      }
    }

    // Validar configurações
    for (const [key, value] of Object.entries(settings)) {
      if (validations[key] && !validations[key](value)) {
        return NextResponse.json({
          error: `Valor inválido para ${key}: ${value}`
        }, { status: 400 })
      }
    }

    let updatedCount = 0

    for (const [key, value] of Object.entries(settings)) {
      try {
        await query(`
          UPDATE admin_settings
          SET setting_value = $1, updated_at = $2
          WHERE setting_key = $3 AND setting_type = $4
        `, [value, new Date().toISOString(), key, 'geolocation'])
        updatedCount++
      } catch (error: any) {
        // Log error but continue with other settings
        frontendLogger.logError(`Erro ao atualizar configuração ${key}`, { error: error.message }, error, 'api')
      }
    }

    frontendLogger.info('[GEOLOCATION_SETTINGS] Configurações atualizadas:', 'api', { updatedCount })

    // Se mudou coordenadas da pizzaria, limpar cache de distâncias
    if (settings.pizzaria_latitude || settings.pizzaria_longitude) {
      await query(`
        UPDATE geocoded_addresses
        SET distance_km = NULL, delivery_zone_id = NULL, last_verified = $1
        WHERE distance_km IS NOT NULL
      `, [new Date(Date.now() - 365*24*60*60*1000).toISOString()])
      frontendLogger.info('Cache de distâncias limpo devido à mudança de coordenadas')
    }

    return NextResponse.json({ 
      success: true,
      message: 'Configurações atualizadas com sucesso',
      updated_count: updatedCount
    })

  } catch (error: any) {
    frontendLogger.logError('Erro ao atualizar configurações de geolocalização', { error: error.message, stack: error.stack }, error, 'api')
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}