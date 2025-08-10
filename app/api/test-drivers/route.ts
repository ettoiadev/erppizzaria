import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testando funcionalidade completa de entregadores...');

    const tests = [];
    let passedTests = 0;
    let totalTests = 0;

    // Teste 1: Verificar se a tabela drivers existe
    totalTests++;
    try {
      const supabase = getSupabaseServerClient();
      const { error } = await supabase.from('drivers').select('id').limit(1);
      if (!error) {
        tests.push({ test: 'Tabela drivers existe', status: 'PASS' });
        passedTests++;
      } else {
        tests.push({ test: 'Tabela drivers existe', status: 'FAIL', error: 'Tabela não encontrada' });
      }
    } catch (error: any) {
      tests.push({ test: 'Tabela drivers existe', status: 'FAIL', error: error.message });
    }

    // Teste 2: Verificar se há entregadores cadastrados
    totalTests++;
    try {
      const supabase = getSupabaseServerClient();
      const { data } = await supabase.from('drivers').select('id', { count: 'exact', head: true }).eq('active', true);
      const count = (data as any)?.length || 0;
      
      if (count > 0) {
        tests.push({ test: `Entregadores cadastrados (${count})`, status: 'PASS' });
        passedTests++;
      } else {
        tests.push({ test: 'Entregadores cadastrados', status: 'FAIL', error: 'Nenhum entregador encontrado' });
      }
    } catch (error: any) {
      tests.push({ test: 'Entregadores cadastrados', status: 'FAIL', error: error.message });
    }

    // Teste 3: Testar API GET /api/drivers
    totalTests++;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/drivers`);
      
      if (response.status === 200) {
        const data = await response.json();
        if (data.drivers && Array.isArray(data.drivers) && data.statistics) {
          tests.push({ 
            test: 'API GET /api/drivers', 
            status: 'PASS', 
            details: `${data.drivers.length} entregadores retornados`
          });
          passedTests++;
        } else {
          tests.push({ test: 'API GET /api/drivers', status: 'FAIL', error: 'Formato de resposta inválido' });
        }
      } else {
        tests.push({ test: 'API GET /api/drivers', status: 'FAIL', error: `Status ${response.status}` });
      }
    } catch (error: any) {
      tests.push({ test: 'API GET /api/drivers', status: 'FAIL', error: error.message });
    }

    // Teste 4: Verificar índices importantes
    totalTests++;
    try {
      tests.push({ test: 'Índices necessários', status: 'SKIP', details: 'Não aplicável via API Supabase' });
    } catch (error: any) {
      tests.push({ test: 'Índices necessários', status: 'FAIL', error: error.message });
    }

    // Teste 5: Verificar estrutura da tabela
    totalTests++;
    try {
      const supabase = getSupabaseServerClient();
      // Amostra simples: tentar selecionar um registro
      const { data: sample } = await supabase.from('drivers').select('id, name, email, phone, vehicle_type, status').limit(1);
      tests.push({ test: 'Estrutura da tabela', status: sample && sample.length >= 0 ? 'PASS' : 'FAIL', details: 'amostra consultada' });
      if (sample) passedTests++;
    } catch (error: any) {
      tests.push({ test: 'Estrutura da tabela', status: 'FAIL', error: error.message });
    }

    // Teste 6: Verificar se coluna driver_id existe na tabela orders
    totalTests++;
    try {
      const supabase = getSupabaseServerClient();
      const { error } = await supabase.from('orders').select('driver_id').limit(1);
      if (!error) {
        tests.push({ test: 'Coluna driver_id em orders', status: 'PASS' });
        passedTests++;
      } else {
        tests.push({ test: 'Coluna driver_id em orders', status: 'FAIL', error: 'Coluna não encontrada' });
      }
    } catch (error: any) {
      tests.push({ test: 'Coluna driver_id em orders', status: 'FAIL', error: error.message });
    }

    // Calcular score
    const score = Math.round((passedTests / totalTests) * 100);
    const status = score >= 90 ? 'EXCELLENT' : 
                  score >= 70 ? 'GOOD' : 
                  score >= 50 ? 'WARNING' : 'CRITICAL';

    // Recomendações
    const recommendations = [];
    const failedTests = tests.filter(t => t.status === 'FAIL');
    
    if (failedTests.length > 0) {
      recommendations.push('Corrigir testes que falharam');
    }
    
    if (score < 100) {
      recommendations.push('Executar correções automáticas');
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
      recommendations,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Erro no teste de entregadores:', error);

    return NextResponse.json({
      success: false,
      status: 'CRITICAL',
      error: 'Erro no teste de entregadores',
      details: {
        message: error.message,
        code: error.code
      }
    }, { status: 500 });
  }
}