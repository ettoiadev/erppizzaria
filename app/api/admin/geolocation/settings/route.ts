import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'
import { verifyAdmin } from '@/lib/auth'

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

    console.log('[GEOLOCATION_SETTINGS] Buscando configurações...')

    const supabase = getSupabaseServerClient()
    const { data: rows, error } = await supabase
      .from('admin_settings')
      .select('setting_key, setting_value, description')
      .eq('setting_type', 'geolocation')
      .order('setting_key')
    if (error) throw error
    const settings: GeolocationSettingsMap = {}
    ;(rows || []).forEach((row: any) => { settings[row.setting_key] = row.setting_value })

    console.log('[GEOLOCATION_SETTINGS] Configurações encontradas:', Object.keys(settings).length)

    return NextResponse.json({ 
      success: true,
      settings,
      count: rows?.length || 0
    })

  } catch (error: any) {
    console.error('[GEOLOCATION_SETTINGS] Erro ao buscar configurações:', error)
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

    console.log('[GEOLOCATION_SETTINGS] Atualizando configurações:', Object.keys(settings))

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

    const supabase = getSupabaseServerClient()
    for (const [key, value] of Object.entries(settings)) {
      const { error } = await supabase
        .from('admin_settings')
        .update({ setting_value: value, updated_at: new Date().toISOString() })
        .eq('setting_key', key)
        .eq('setting_type', 'geolocation')
      if (!error) updatedCount++
    }

    console.log('[GEOLOCATION_SETTINGS] Configurações atualizadas:', updatedCount)

    // Se mudou coordenadas da pizzaria, limpar cache de distâncias
    if (settings.pizzaria_latitude || settings.pizzaria_longitude) {
      await supabase.from('geocoded_addresses').update({ distance_km: null, delivery_zone_id: null, last_verified: new Date(Date.now() - 365*24*60*60*1000).toISOString() }).not('distance_km', 'is', null)
      console.log('[GEOLOCATION_SETTINGS] Cache de distâncias limpo devido à mudança de coordenadas')
    }

    return NextResponse.json({ 
      success: true,
      message: 'Configurações atualizadas com sucesso',
      updated_count: updatedCount
    })

  } catch (error: any) {
    console.error('[GEOLOCATION_SETTINGS] Erro ao atualizar configurações:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}