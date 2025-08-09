import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/postgres'

export const dynamic = 'force-dynamic'

// Função para calcular distância usando fórmula de Haversine
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Função para geocodificar endereço usando Google Maps API
async function geocodeAddress(address: string, apiKey: string): Promise<{
  latitude: number
  longitude: number
  formatted_address: string
  city: string
  state: string
  postal_code: string
} | null> {
  try {
    if (!apiKey || apiKey.trim() === '') {
      console.log('[GEOCODING] API key não configurada')
      return null
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&region=br&language=pt-BR`
    )

    const data = await response.json()

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0]
      const location = result.geometry.location

      // Extrair componentes do endereço
      type AddrComp = { types: string[]; long_name?: string; short_name?: string }
      const components: AddrComp[] = (result.address_components || []) as AddrComp[]
      const city = components.find((c: AddrComp) => c.types.includes('locality'))?.long_name || 
                   components.find((c: AddrComp) => c.types.includes('administrative_area_level_2'))?.long_name || ''
      const state = components.find((c: AddrComp) => c.types.includes('administrative_area_level_1'))?.short_name || ''
      const postal_code = components.find((c: AddrComp) => c.types.includes('postal_code'))?.long_name || ''

      return {
        latitude: location.lat,
        longitude: location.lng,
        formatted_address: result.formatted_address,
        city,
        state,
        postal_code
      }
    }

    console.log('[GEOCODING] Erro na API do Google:', data.status, data.error_message)
    return null
  } catch (error) {
    console.error('[GEOCODING] Erro na geocodificação:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { address, latitude, longitude } = await request.json()

    console.log('[DELIVERY_CALC] Calculando entrega para:', { address, latitude, longitude })

    if (!address && (!latitude || !longitude)) {
      return NextResponse.json({ 
        error: 'Endereço ou coordenadas são obrigatórios',
        deliverable: false
      }, { status: 400 })
    }

    // Buscar configurações da pizzaria
    const configResult = await query(`
      SELECT setting_key, setting_value FROM admin_settings 
      WHERE setting_key IN (
        'pizzaria_latitude', 'pizzaria_longitude', 'max_delivery_radius_km', 
        'enable_geolocation_delivery', 'fallback_delivery_fee', 'google_maps_api_key',
        'pizzaria_address'
      )
    `)

    const config: Record<string, string> = {}
    configResult.rows.forEach((row: any) => {
      config[String(row.setting_key)] = String(row.setting_value)
    })

    console.log('[DELIVERY_CALC] Configurações carregadas:', Object.keys(config))

    // Se geolocalização está desabilitada, usar taxa padrão
    if (config.enable_geolocation_delivery !== 'true') {
      return NextResponse.json({
        deliverable: true,
        delivery_fee: parseFloat(config.fallback_delivery_fee || '8.00'),
        estimated_time: 45,
        zone_name: 'Taxa Padrão',
        zone_color: '#6B7280',
        message: 'Cálculo por geolocalização desabilitado',
        method: 'fallback'
      })
    }

    const pizzariaLat = parseFloat(config.pizzaria_latitude || '-23.5505')
    const pizzariaLon = parseFloat(config.pizzaria_longitude || '-46.6333')
    const maxRadius = parseFloat(config.max_delivery_radius_km || '15')

    let targetLat = latitude
    let targetLon = longitude
    let formattedAddress = address
    let cacheKey = address

    // Se não tiver coordenadas, buscar no cache ou geocodificar
    if (!targetLat || !targetLon) {
      console.log('[DELIVERY_CALC] Buscando coordenadas para:', address)

      // Buscar no cache primeiro
      const cacheResult = await query(`
        SELECT 
          latitude, longitude, formatted_address, distance_km, 
          is_deliverable, delivery_zone_id, city, state,
          last_verified
        FROM geocoded_addresses 
        WHERE address_text = $1 
          AND last_verified > NOW() - INTERVAL '7 days'
          AND latitude IS NOT NULL 
          AND longitude IS NOT NULL
      `, [address])

      if (cacheResult.rows.length > 0) {
        const cached = cacheResult.rows[0]
        targetLat = parseFloat(cached.latitude)
        targetLon = parseFloat(cached.longitude)
        formattedAddress = cached.formatted_address || address
        
        console.log('[DELIVERY_CALC] Coordenadas encontradas no cache')

        // Se tem distância cached e ainda é válida, usar diretamente
        if (cached.distance_km && cached.delivery_zone_id) {
          const zoneResult = await query(`
            SELECT * FROM delivery_zones WHERE id = $1 AND active = true
          `, [cached.delivery_zone_id])

          if (zoneResult.rows.length > 0) {
            const zone = zoneResult.rows[0]
            
            console.log('[DELIVERY_CALC] Resultado completo encontrado no cache')
            
            return NextResponse.json({
              deliverable: cached.is_deliverable,
              delivery_fee: cached.is_deliverable ? parseFloat(zone.delivery_fee) : 0,
              estimated_time: cached.is_deliverable ? zone.estimated_time_minutes : 0,
              distance_km: parseFloat(cached.distance_km),
              zone_name: zone.name,
              zone_color: zone.color_hex,
              formatted_address: formattedAddress,
              message: cached.is_deliverable ? `Entrega disponível - ${zone.name}` : 'Fora da área de entrega',
              method: 'cache'
            })
          }
        }
      } else {
        // Geocodificar usando Google Maps API
        console.log('[DELIVERY_CALC] Geocodificando endereço...')
        
        const geocoded = await geocodeAddress(address, config.google_maps_api_key || '')
        
        if (!geocoded) {
          return NextResponse.json({
            deliverable: false,
            error: 'Não foi possível localizar o endereço. Verifique se está correto e tente novamente.',
            message: 'Endereço não encontrado',
            method: 'geocoding_failed'
          }, { status: 400 })
        }

        targetLat = geocoded.latitude
        targetLon = geocoded.longitude
        formattedAddress = geocoded.formatted_address

        console.log('[DELIVERY_CALC] Endereço geocodificado:', { targetLat, targetLon })
      }
    }

    // Calcular distância
    const distance = calculateDistance(pizzariaLat, pizzariaLon, targetLat, targetLon)
    
    console.log('[DELIVERY_CALC] Distância calculada:', distance.toFixed(2), 'km')

    // Verificar se está dentro do raio máximo
    if (distance > maxRadius) {
      // Salvar no cache como não entregável
      if (address) {
        await query(`
          INSERT INTO geocoded_addresses (
            address_text, formatted_address, latitude, longitude, 
            distance_km, is_deliverable, geocoding_service
          )
          VALUES ($1, $2, $3, $4, $5, false, 'google')
          ON CONFLICT (address_text) DO UPDATE SET
            formatted_address = EXCLUDED.formatted_address,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            distance_km = EXCLUDED.distance_km,
            is_deliverable = false,
            delivery_zone_id = NULL,
            last_verified = NOW()
        `, [address, formattedAddress, targetLat, targetLon, distance])
      }

      return NextResponse.json({
        deliverable: false,
        distance_km: distance,
        max_radius_km: maxRadius,
        formatted_address: formattedAddress,
        message: `Endereço fora da área de entrega. Distância: ${distance.toFixed(1)}km (máximo: ${maxRadius}km)`,
        method: 'out_of_range'
      })
    }

    // Buscar zona de entrega apropriada
    const zoneResult = await query(`
      SELECT * FROM delivery_zones 
      WHERE active = true 
        AND min_distance_km <= $1 
        AND max_distance_km >= $1
      ORDER BY min_distance_km ASC
      LIMIT 1
    `, [distance])

    let zone = null
    let deliveryFee = parseFloat(config.fallback_delivery_fee || '8.00')
    let estimatedTime = 45
    let zoneName = 'Taxa Padrão'
    let zoneColor = '#6B7280'

    if (zoneResult.rows.length > 0) {
      zone = zoneResult.rows[0]
      deliveryFee = parseFloat(zone.delivery_fee)
      estimatedTime = zone.estimated_time_minutes
      zoneName = zone.name
      zoneColor = zone.color_hex
    }

    // Salvar/atualizar no cache
    if (address) {
      await query(`
        INSERT INTO geocoded_addresses (
          address_text, formatted_address, latitude, longitude, 
          distance_km, delivery_zone_id, is_deliverable, geocoding_service
        )
        VALUES ($1, $2, $3, $4, $5, $6, true, 'google')
        ON CONFLICT (address_text) DO UPDATE SET
          formatted_address = EXCLUDED.formatted_address,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          distance_km = EXCLUDED.distance_km,
          delivery_zone_id = EXCLUDED.delivery_zone_id,
          is_deliverable = true,
          last_verified = NOW()
      `, [address, formattedAddress, targetLat, targetLon, distance, zone?.id || null])
    }

    console.log('[DELIVERY_CALC] Cálculo concluído:', { deliveryFee, estimatedTime, zoneName })

    return NextResponse.json({
      deliverable: true,
      delivery_fee: deliveryFee,
      estimated_time: estimatedTime,
      distance_km: distance,
      zone_name: zoneName,
      zone_color: zoneColor,
      formatted_address: formattedAddress,
      message: `Entrega disponível - ${zoneName}`,
      method: zone ? 'zone_match' : 'fallback',
      pizzaria_address: config.pizzaria_address
    })

  } catch (error: any) {
    console.error('[DELIVERY_CALC] Erro no cálculo de entrega:', error)
    return NextResponse.json({ 
      deliverable: false,
      error: 'Erro interno do servidor',
      message: 'Não foi possível calcular a entrega. Tente novamente.',
      details: error.message,
      method: 'error'
    }, { status: 500 })
  }
}