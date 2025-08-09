import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testando sistema de geolocalização...')

    const tests = []
    let passedTests = 0
    let totalTests = 0

    const supabase = getSupabaseServerClient()

    // Teste 1: Verificar se as tabelas foram criadas
    totalTests++
    try {
      const { data: dz, error: dzErr } = await supabase.from('delivery_zones').select('id').limit(1)
      const { data: ga, error: gaErr } = await supabase.from('geocoded_addresses').select('id').limit(1)
      if (!dzErr && !gaErr) {
        tests.push({ test: 'Tabelas criadas', status: 'PASS', details: 'delivery_zones, geocoded_addresses' })
        passedTests++
      } else {
        tests.push({ test: 'Tabelas criadas', status: 'FAIL', error: 'Falha ao acessar tabelas' })
      }
    } catch (error: any) {
      tests.push({ test: 'Tabelas criadas', status: 'FAIL', error: error.message })
    }

    // Teste 2: Verificar configurações de geolocalização
    totalTests++
    try {
      const { data } = await supabase
        .from('admin_settings')
        .select('id', { count: 'exact', head: true })
        .eq('setting_type', 'geolocation')
      const count = (data as any)?.length || 0
      
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
      const { data } = await supabase
        .from('delivery_zones')
        .select('id', { count: 'exact', head: true })
        .eq('active', true)
      const count = (data as any)?.length || 0
      
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
      // Supabase não expõe índices via API; marcamos como não aplicável
      const count = 0
      
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
      const { data: zones } = await supabase.from('delivery_zones').select('*').order('min_distance_km', { ascending: true })
      detailedData.zones = zones || []

      const { data: settings } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value, description')
        .eq('setting_type', 'geolocation')
        .order('setting_key', { ascending: true })
      detailedData.settings = settings || []

      const { data: cached } = await supabase.from('geocoded_addresses').select('id', { count: 'exact', head: true })
      detailedData.cached_addresses = (cached as any)?.length || 0
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