import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testando funcionalidade completa de entregadores...');

    const tests = [];
    let passedTests = 0;
    let totalTests = 0;

    // Teste 1: Verificar se a tabela drivers existe
    totalTests++;
    try {
      const tableCheck = await query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'drivers'
        ) as exists
      `);
      
      if (tableCheck.rows[0].exists) {
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
      const driversCount = await query('SELECT COUNT(*) as count FROM drivers WHERE active = true');
      const count = parseInt(driversCount.rows[0].count);
      
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
      const indexesCheck = await query(`
        SELECT indexname FROM pg_indexes 
        WHERE schemaname = 'public' AND tablename = 'drivers'
        AND (indexname LIKE 'idx_%' OR indexname LIKE '%_pkey')
      `);
      
      const expectedIndexes = ['idx_drivers_status', 'idx_drivers_active', 'idx_drivers_email'];
      const existingIndexes = indexesCheck.rows.map(row => row.indexname);
      const missingIndexes = expectedIndexes.filter(idx => !existingIndexes.includes(idx));
      
      if (missingIndexes.length === 0) {
        tests.push({ test: 'Índices necessários', status: 'PASS', details: `${existingIndexes.length} índices` });
        passedTests++;
      } else {
        tests.push({ 
          test: 'Índices necessários', 
          status: 'FAIL', 
          error: `Faltando: ${missingIndexes.join(', ')}` 
        });
      }
    } catch (error: any) {
      tests.push({ test: 'Índices necessários', status: 'FAIL', error: error.message });
    }

    // Teste 5: Verificar estrutura da tabela
    totalTests++;
    try {
      const columnsCheck = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'drivers'
        ORDER BY ordinal_position
      `);
      
      const requiredColumns = ['id', 'name', 'email', 'phone', 'vehicle_type', 'status'];
      const existingColumns = columnsCheck.rows.map(row => row.column_name);
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length === 0) {
        tests.push({ 
          test: 'Estrutura da tabela', 
          status: 'PASS', 
          details: `${existingColumns.length} colunas`
        });
        passedTests++;
      } else {
        tests.push({ 
          test: 'Estrutura da tabela', 
          status: 'FAIL', 
          error: `Colunas faltando: ${missingColumns.join(', ')}` 
        });
      }
    } catch (error: any) {
      tests.push({ test: 'Estrutura da tabela', status: 'FAIL', error: error.message });
    }

    // Teste 6: Verificar se coluna driver_id existe na tabela orders
    totalTests++;
    try {
      const driverColumnCheck = await query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'driver_id'
        ) as exists
      `);
      
      if (driverColumnCheck.rows[0].exists) {
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