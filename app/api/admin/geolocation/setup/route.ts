import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/postgres'
import { verifyAdmin } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.split(" ")[1]
    
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 })
    }

    const admin = await verifyAdmin(token)
    if (!admin) {
      return NextResponse.json({ error: "Acesso negado - apenas administradores" }, { status: 403 })
    }

    console.log('🚀 Iniciando setup de geolocalização...')

    // 1. Criar tabela de zonas de entrega
    await query(`
      CREATE TABLE IF NOT EXISTS delivery_zones (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL,
          min_distance_km DECIMAL(5,2) NOT NULL DEFAULT 0,
          max_distance_km DECIMAL(5,2) NOT NULL,
          delivery_fee DECIMAL(8,2) NOT NULL,
          estimated_time_minutes INTEGER NOT NULL DEFAULT 45,
          active BOOLEAN DEFAULT true,
          color_hex VARCHAR(7) DEFAULT '#3B82F6',
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT chk_distance_order CHECK (max_distance_km > min_distance_km),
          CONSTRAINT chk_positive_fee CHECK (delivery_fee >= 0),
          CONSTRAINT chk_positive_time CHECK (estimated_time_minutes > 0)
      )
    `)
    console.log('✅ Tabela delivery_zones criada')

    // 2. Criar tabela de cache de geocodificação
    await query(`
      CREATE TABLE IF NOT EXISTS geocoded_addresses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          address_text TEXT NOT NULL,
          formatted_address TEXT,
          latitude DECIMAL(10,8),
          longitude DECIMAL(11,8),
          city VARCHAR(100),
          state VARCHAR(50),
          postal_code VARCHAR(20),
          country VARCHAR(50) DEFAULT 'Brasil',
          distance_km DECIMAL(5,2),
          delivery_zone_id UUID REFERENCES delivery_zones(id) ON DELETE SET NULL,
          is_deliverable BOOLEAN DEFAULT true,
          geocoding_service VARCHAR(50) DEFAULT 'google',
          confidence_score DECIMAL(3,2) DEFAULT 1.0,
          last_verified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(address_text)
      )
    `)
    console.log('✅ Tabela geocoded_addresses criada')

    // 3. Criar índices para performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_delivery_zones_distance ON delivery_zones(min_distance_km, max_distance_km)',
      'CREATE INDEX IF NOT EXISTS idx_delivery_zones_active ON delivery_zones(active)',
      'CREATE INDEX IF NOT EXISTS idx_delivery_zones_created ON delivery_zones(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_geocoded_addresses_text ON geocoded_addresses(address_text)',
      'CREATE INDEX IF NOT EXISTS idx_geocoded_addresses_coords ON geocoded_addresses(latitude, longitude)',
      'CREATE INDEX IF NOT EXISTS idx_geocoded_addresses_distance ON geocoded_addresses(distance_km)',
      'CREATE INDEX IF NOT EXISTS idx_geocoded_addresses_zone ON geocoded_addresses(delivery_zone_id)',
      'CREATE INDEX IF NOT EXISTS idx_geocoded_addresses_verified ON geocoded_addresses(last_verified DESC)'
    ]

    for (const indexQuery of indexes) {
      await query(indexQuery)
    }
    console.log('✅ Índices criados')

    // 4. Criar função e trigger para updated_at
    await query(`
      CREATE OR REPLACE FUNCTION update_delivery_zones_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `)

    await query(`
      DROP TRIGGER IF EXISTS trigger_update_delivery_zones_updated_at ON delivery_zones
    `)

    await query(`
      CREATE TRIGGER trigger_update_delivery_zones_updated_at
          BEFORE UPDATE ON delivery_zones
          FOR EACH ROW
          EXECUTE FUNCTION update_delivery_zones_updated_at()
    `)
    console.log('✅ Triggers criados')

    // 5. Verificar se admin_settings tem a coluna setting_type
    try {
      await query(`ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS setting_type VARCHAR(50) DEFAULT 'general'`)
      await query(`ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS description TEXT`)
      console.log('✅ Colunas adicionadas na admin_settings')
    } catch (error) {
      console.log('⚠️ Colunas já existem ou erro ao adicionar:', error)
    }

    // 6. Inserir configurações de geolocalização
    const geoSettings = [
      ['pizzaria_latitude', '-23.5505', 'geolocation', 'Latitude da pizzaria'],
      ['pizzaria_longitude', '-46.6333', 'geolocation', 'Longitude da pizzaria'],
      ['pizzaria_address', 'Rua das Pizzas, 123 - Centro, São Paulo - SP', 'geolocation', 'Endereço completo da pizzaria'],
      ['max_delivery_radius_km', '15', 'geolocation', 'Raio máximo de entrega em km'],
      ['google_maps_api_key', '', 'geolocation', 'Chave da API do Google Maps'],
      ['enable_geolocation_delivery', 'true', 'geolocation', 'Habilitar cálculo por geolocalização'],
      ['fallback_delivery_fee', '8.00', 'geolocation', 'Taxa padrão quando não conseguir calcular'],
      ['geocoding_cache_hours', '168', 'geolocation', 'Horas para manter cache (168 = 1 semana)']
    ]

    for (const [key, value, type, desc] of geoSettings) {
      await query(`
        INSERT INTO admin_settings (setting_key, setting_value, setting_type, description) 
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (setting_key) DO UPDATE SET
          setting_type = EXCLUDED.setting_type,
          description = EXCLUDED.description
      `, [key, value, type, desc])
    }
    console.log('✅ Configurações de geolocalização inseridas')

    // 7. Inserir zonas de entrega padrão
    const defaultZones = [
      ['Centro - Entrega Grátis', 0, 3, 0.00, 25, '#10B981', 'Região central com entrega gratuita'],
      ['Zona Próxima', 3.01, 7, 5.00, 35, '#3B82F6', 'Bairros próximos ao centro'],
      ['Zona Intermediária', 7.01, 12, 8.00, 45, '#F59E0B', 'Bairros intermediários'],
      ['Zona Distante', 12.01, 15, 12.00, 60, '#EF4444', 'Limite da área de entrega']
    ]

    // Verificar se já existem zonas
    const existingZones = await query('SELECT COUNT(*) as count FROM delivery_zones')
    const zonesCount = parseInt(existingZones.rows[0].count)

    if (zonesCount === 0) {
      for (const [name, minDist, maxDist, fee, time, color, desc] of defaultZones) {
        await query(`
          INSERT INTO delivery_zones (name, min_distance_km, max_distance_km, delivery_fee, estimated_time_minutes, color_hex, description)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [name, minDist, maxDist, fee, time, color, desc])
      }
      console.log('✅ Zonas de entrega padrão inseridas')
    } else {
      console.log('⚠️ Zonas já existem, pulando inserção')
    }

    // 8. Verificar setup
    const finalZonesCount = await query('SELECT COUNT(*) as count FROM delivery_zones')
    const finalSettingsCount = await query(`SELECT COUNT(*) as count FROM admin_settings WHERE setting_type = 'geolocation'`)

    const setupResult = {
      success: true,
      message: 'Setup de geolocalização concluído com sucesso!',
      details: {
        zones_created: parseInt(finalZonesCount.rows[0].count),
        settings_created: parseInt(finalSettingsCount.rows[0].count),
        tables_created: ['delivery_zones', 'geocoded_addresses'],
        indexes_created: indexes.length,
        triggers_created: 1
      }
    }

    console.log('🎉 Setup concluído:', setupResult)

    return NextResponse.json(setupResult)

  } catch (error: any) {
    console.error('❌ Erro no setup de geolocalização:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro no setup de geolocalização',
      details: {
        message: error.message,
        code: error.code,
        hint: error.hint
      }
    }, { status: 500 })
  }
}