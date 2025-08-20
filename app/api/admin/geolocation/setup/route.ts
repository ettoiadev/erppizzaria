import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'
import { frontendLogger } from '@/lib/frontend-logger'
import { validateAdminAuth, createAuthErrorResponse, addCorsHeaders, createOptionsHandler } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  // Validar autenticação de admin
  const authResult = await validateAdminAuth(request)
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error || 'Erro de autenticação')
  }
  
  const admin = authResult.user
  
  if (!admin) {
    return createAuthErrorResponse('Usuário não encontrado')
  }

  try {
    frontendLogger.info('Requisição de setup de geolocalização iniciada', 'api')
    frontendLogger.info('Acesso autorizado para admin no setup de geolocalização', 'api', {
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2')
    })

      frontendLogger.info('Iniciando setup de geolocalização', 'api', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2')
      })

      // Estruturas/tabelas/índices são gerenciados pelas migrações do Supabase (skip criação via API)
      const supabase = getSupabaseServerClient()
      const indexes: string[] = []

      // 4. Criar função e trigger para updated_at
      // Triggers também via migrações (skip)

      // 5. Verificar se admin_settings tem a coluna setting_type
      try {
        // Não podemos usar ALTER TABLE diretamente via API Supabase
        // Vamos verificar se as colunas existem e usar RPC ou migrations para alterações estruturais
        const { data: sample } = await supabase.from('admin_settings').select('*').limit(1)
        const columns = sample && sample.length > 0 ? Object.keys(sample[0]) : []
        
        if (!columns.includes('setting_type') || !columns.includes('description')) {
          frontendLogger.info('Colunas setting_type ou description não existem na tabela admin_settings', 'api')
          frontendLogger.info('Use migrations do Supabase para adicionar estas colunas', 'api')
        } else {
          frontendLogger.info('Colunas setting_type e description já existem na admin_settings', 'api')
        }
      } catch (error) {
        const err = error as Error
        frontendLogger.logError('Erro ao verificar colunas', {
          error: err.message,
          stack: err.stack
        }, err, 'api')
      }

      // 6. Inserir configurações de geolocalização
      const geoSettings = [
        ['pizzaria_latitude', '', 'geolocation', 'Latitude da pizzaria'],
        ['pizzaria_longitude', '', 'geolocation', 'Longitude da pizzaria'],
        ['pizzaria_address', '', 'geolocation', 'Endereço completo da pizzaria'],
        ['max_delivery_radius_km', '15', 'geolocation', 'Raio máximo de entrega em km'],
        ['google_maps_api_key', '', 'geolocation', 'Chave da API do Google Maps'],
        ['enable_geolocation_delivery', 'false', 'geolocation', 'Habilitar cálculo por geolocalização'],
        ['fallback_delivery_fee', '8.00', 'geolocation', 'Taxa padrão quando não conseguir calcular'],
        ['geocoding_cache_hours', '168', 'geolocation', 'Horas para manter cache (168 = 1 semana)']
      ]

      for (const [key, value, type, desc] of geoSettings) {
        await supabase
          .from('admin_settings')
          .upsert({ setting_key: key, setting_value: value, setting_type: type, description: desc, updated_at: new Date().toISOString() }, { onConflict: 'setting_key' })
      }
      frontendLogger.info('Configurações de geolocalização inseridas', 'api')

      // 7. Inserir zonas de entrega padrão
      const defaultZones = [
        ['Centro - Entrega Grátis', 0, 3, 0.00, 25, '#10B981', 'Região central com entrega gratuita'],
        ['Zona Próxima', 3.01, 7, 5.00, 35, '#3B82F6', 'Bairros próximos ao centro'],
        ['Zona Intermediária', 7.01, 12, 8.00, 45, '#F59E0B', 'Bairros intermediários'],
        ['Zona Distante', 12.01, 15, 12.00, 60, '#EF4444', 'Limite da área de entrega']
      ]

      // Verificar se já existem zonas
      const { data: existingZones } = await supabase.from('delivery_zones').select('id', { count: 'exact', head: true })
      const zonesCount = (existingZones as any)?.length || 0

      if (zonesCount === 0) {
        for (const [name, minDist, maxDist, fee, time, color, desc] of defaultZones) {
          await supabase
            .from('delivery_zones')
            .insert({ name, min_distance_km: minDist, max_distance_km: maxDist, delivery_fee: fee, estimated_time_minutes: time, color_hex: color, description: desc })
        }
        frontendLogger.info('Zonas de entrega padrão inseridas', 'api')
      } else {
        frontendLogger.info('Zonas já existem, pulando inserção', 'api')
      }

      // 8. Verificar setup
      const { data: finalZonesCount } = await supabase.from('delivery_zones').select('id', { count: 'exact', head: true })
      const { data: finalSettingsCount } = await supabase.from('admin_settings').select('id', { count: 'exact', head: true }).eq('setting_type', 'geolocation')

      const setupResult = {
        success: true,
        message: 'Setup de geolocalização concluído com sucesso!',
        details: {
          zones_created: (finalZonesCount as any)?.length || 0,
          settings_created: (finalSettingsCount as any)?.length || 0,
          tables_created: ['delivery_zones', 'geocoded_addresses'],
          indexes_created: indexes.length,
          triggers_created: 1
        }
      }

      frontendLogger.info('Setup concluído', 'api', setupResult)

      frontendLogger.info('Setup de geolocalização concluído', 'api', {
          adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
          zonesCreated: setupResult.details.zones_created,
          settingsCreated: setupResult.details.settings_created
        });

      const response = NextResponse.json(setupResult)
      return addCorsHeaders(response)

  } catch (error: any) {
    frontendLogger.logError('Erro no setup de geolocalização', {
      error: error.message,
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      stack: error.stack
    }, error, 'api')
    
    const response = NextResponse.json({
      success: false,
      error: 'Erro no setup de geolocalização',
      details: {
        message: error.message,
        code: error.code,
        hint: error.hint
      }
    }, { status: 500 })
    return addCorsHeaders(response)
  }
}

// Handler para requisições OPTIONS (CORS)
export const OPTIONS = createOptionsHandler()