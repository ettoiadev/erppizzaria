import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/postgres'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testando sistema de geolocalização...')

    const tests = []
    let passedTests = 0
    let totalTests = 0

    // Teste 1: Verificar se as tabelas foram criadas
    totalTests++
    try {
      const tablesResult = await query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('delivery_zones', 'geocoded_addresses')
        ORDER BY table_name
      `)
      
      const tableNames = tablesResult.rows.map(row => row.table_name)
      
      if (tableNames.includes('delivery_zones') && tableNames.includes('geocoded_addresses')) {
        tests.push({ test: 'Tabelas criadas', status: 'PASS', details: `Encontradas: ${tableNames.join(', ')}` })
        passedTests++
      } else {
        tests.push({ test: 'Tabelas criadas', status: 'FAIL', error: `Faltando tabelas. Encontradas: ${tableNames.join(', ')}` })
      }
    } catch (error: any) {
      tests.push({ test: 'Tabelas criadas', status: 'FAIL', error: error.message })
    }

    // Teste 2: Verificar configurações de geolocalização
    totalTests++
    try {
      const settingsResult = await query(`
        SELECT COUNT(*) as count FROM admin_settings 
        WHERE setting_type = 'geolocation'
      `)
      
      const count = parseInt(settingsResult.rows[0].count)
      
      if (count >= 8) {
        tests.push({ test: `Configurações geolocalização (${count})`, status: 'PASS' })
        passedTests++
      } else {
        tests.push({ test: 'Configurações geolocalização', status: 'FAIL', error: `Apenas ${count} configurações encontradas` })
      }
    } catch (error: any) {
      tests.push({ test: 'Configurações geolocalização', status: 'FAIL', error: error.message })
    }

    // Teste 3: Verificar zonas de entrega padrão
    totalTests++
    try {
      const zonesResult = await query(`
        SELECT COUNT(*) as count FROM delivery_zones WHERE active = true
      `)
      
      const count = parseInt(zonesResult.rows[0].count)
      
      if (count >= 4) {
        tests.push({ test: `Zonas de entrega (${count})`, status: 'PASS' })
        passedTests++
      } else {
        tests.push({ test: 'Zonas de entrega', status: 'FAIL', error: `Apenas ${count} zonas encontradas` })
      }
    } catch (error: any) {
      tests.push({ test: 'Zonas de entrega', status: 'FAIL', error: error.message })
    }

    // Teste 4: Testar API de configurações (sem auth - deve falhar)
    totalTests++
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/geolocation/settings`)
      
      if (response.status === 401) {
        tests.push({ test: 'API configurações (sem auth)', status: 'PASS', details: 'Corretamente rejeitou sem token' })
        passedTests++
      } else {
        tests.push({ test: 'API configurações (sem auth)', status: 'FAIL', error: `Status ${response.status} - deveria ser 401` })
      }
    } catch (error: any) {
      tests.push({ test: 'API configurações (sem auth)', status: 'FAIL', error: error.message })
    }

    // Teste 5: Testar API de zonas (sem auth - deve falhar)
    totalTests++
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/delivery-zones`)
      
      if (response.status === 401) {
        tests.push({ test: 'API zonas (sem auth)', status: 'PASS', details: 'Corretamente rejeitou sem token' })
        passedTests++
      } else {
        tests.push({ test: 'API zonas (sem auth)', status: 'FAIL', error: `Status ${response.status} - deveria ser 401` })
      }
    } catch (error: any) {
      tests.push({ test: 'API zonas (sem auth)', status: 'FAIL', error: error.message })
    }

    // Teste 6: Testar API de cálculo de entrega (pública - coordenadas de São Paulo)
    totalTests++
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/delivery/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          latitude: -23.5505, 
          longitude: -46.6333 
        })
      })
      
      if (response.status === 200) {
        const data = await response.json()
        if (data.deliverable !== undefined) {
          tests.push({ 
            test: 'API cálculo entrega (coordenadas)', 
            status: 'PASS', 
            details: `Entregável: ${data.deliverable}, Taxa: R$ ${data.delivery_fee || 0}`
          })
          passedTests++
        } else {
          tests.push({ test: 'API cálculo entrega (coordenadas)', status: 'FAIL', error: 'Resposta inválida' })
        }
      } else {
        tests.push({ test: 'API cálculo entrega (coordenadas)', status: 'FAIL', error: `Status ${response.status}` })
      }
    } catch (error: any) {
      tests.push({ test: 'API cálculo entrega (coordenadas)', status: 'FAIL', error: error.message })
    }

    // Teste 7: Verificar índices criados
    totalTests++
    try {
      const indexesResult = await query(`
        SELECT COUNT(*) as count FROM pg_indexes 
        WHERE schemaname = 'public' 
          AND (tablename = 'delivery_zones' OR tablename = 'geocoded_addresses')
      `)
      
      const count = parseInt(indexesResult.rows[0].count)
      
      if (count >= 8) {
        tests.push({ test: `Índices criados (${count})`, status: 'PASS' })
        passedTests++
      } else {
        tests.push({ test: 'Índices criados', status: 'FAIL', error: `Apenas ${count} índices encontrados` })
      }
    } catch (error: any) {
      tests.push({ test: 'Índices criados', status: 'FAIL', error: error.message })
    }

    // Calcular score
    const score = Math.round((passedTests / totalTests) * 100)
    const status = score >= 90 ? 'EXCELLENT' : 
                  score >= 70 ? 'GOOD' : 
                  score >= 50 ? 'WARNING' : 'CRITICAL'

    // Buscar dados detalhados
    const detailedData: Record<string, any> = {}
    
    try {
      const zonesData = await query('SELECT * FROM delivery_zones ORDER BY min_distance_km')
      detailedData.zones = zonesData.rows

      const settingsData = await query(`
        SELECT setting_key, setting_value, description 
        FROM admin_settings 
        WHERE setting_type = 'geolocation'
        ORDER BY setting_key
      `)
      detailedData.settings = settingsData.rows

      const cacheData = await query('SELECT COUNT(*) as count FROM geocoded_addresses')
      detailedData.cached_addresses = parseInt(cacheData.rows[0].count)
    } catch (error) {
      detailedData.error = 'Erro ao buscar dados detalhados'
    }

    // Recomendações
    const recommendations = []
    const failedTests = tests.filter(t => t.status === 'FAIL')
    
    if (failedTests.length > 0) {
      recommendations.push('Corrigir testes que falharam')
    }
    
    if (score < 100) {
      recommendations.push('Executar setup completo se necessário')
    }

    if (!detailedData.settings?.find((s: any) => s.setting_key === 'google_maps_api_key')?.setting_value) {
      recommendations.push('Configurar chave da API do Google Maps para geocodificação')
    }

    return NextResponse.json({
      success: true,
      status,
      score: `${score}%`,
      summary: {
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        allPassed: passedTests === totalTests
      },
      tests,
      detailedData,
      recommendations,
      geolocation_system: {
        tables_created: ['delivery_zones', 'geocoded_addresses'],
        apis_available: [
          'GET /api/admin/geolocation/settings',
          'PUT /api/admin/geolocation/settings', 
          'GET /api/admin/delivery-zones',
          'POST /api/admin/delivery-zones',
          'GET /api/admin/delivery-zones/[id]',
          'PUT /api/admin/delivery-zones/[id]',
          'DELETE /api/admin/delivery-zones/[id]',
          'POST /api/delivery/calculate'
        ],
        features: [
          'Configuração de localização da pizzaria',
          'Gestão de zonas de entrega',
          'Cálculo automático de taxa por distância',
          'Cache de geocodificação',
          'Validação de área de entrega',
          'Integração com Google Maps API'
        ]
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Erro no teste de geolocalização:', error)

    return NextResponse.json({
      success: false,
      status: 'CRITICAL',
      error: 'Erro no teste de geolocalização',
      details: {
        message: error.message,
        code: error.code
      }
    }, { status: 500 })
  }
}