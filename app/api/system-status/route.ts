import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verificando status completo do sistema...');

    // 1. Verificar conexão com banco
    const connectionTest = await query('SELECT NOW() as current_time, version() as db_version');
    
    // 2. Verificar todas as tabelas necessárias
    const tablesCheck = await query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('profiles', 'orders', 'order_items', 'categories', 'products', 'customer_addresses', 'admin_settings')
      ORDER BY table_name
    `);

    const requiredTables = ['profiles', 'orders', 'order_items', 'categories', 'products', 'customer_addresses', 'admin_settings'];
    const existingTables = tablesCheck.rows.map(row => row.table_name);
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));

    // 3. Verificar dados essenciais
    const dataCheck = await Promise.all([
      query('SELECT COUNT(*) as count FROM profiles WHERE role = $1', ['admin']),
      query('SELECT COUNT(*) as count FROM profiles WHERE role = $1', ['customer']),
      query('SELECT COUNT(*) as count FROM orders'),
      query('SELECT COUNT(*) as count FROM categories'),
      query('SELECT COUNT(*) as count FROM products')
    ]);

    const systemData = {
      adminUsers: parseInt(dataCheck[0].rows[0].count),
      customers: parseInt(dataCheck[1].rows[0].count),
      orders: parseInt(dataCheck[2].rows[0].count),
      categories: parseInt(dataCheck[3].rows[0].count),
      products: parseInt(dataCheck[4].rows[0].count)
    };

    // 4. Testar APIs críticas
    const apiTests = [];
    
    try {
      const customersResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/customers`);
      apiTests.push({
        endpoint: '/api/customers',
        status: customersResponse.status,
        working: customersResponse.status === 200
      });
    } catch (error) {
      apiTests.push({
        endpoint: '/api/customers',
        status: 'ERROR',
        working: false,
        error: 'Connection failed'
      });
    }

    try {
      const ordersResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/orders`);
      apiTests.push({
        endpoint: '/api/orders',
        status: ordersResponse.status,
        working: ordersResponse.status === 200
      });
    } catch (error) {
      apiTests.push({
        endpoint: '/api/orders',
        status: 'ERROR',
        working: false,
        error: 'Connection failed'
      });
    }

    // 5. Verificar índices importantes
    const indexesCheck = await query(`
      SELECT schemaname, tablename, indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename IN ('profiles', 'orders', 'order_items', 'products')
      AND (indexname LIKE '%_pkey' OR indexname LIKE 'idx_%')
      ORDER BY tablename, indexname
    `);

    // 6. Análise geral do sistema
    const systemHealth = {
      database: {
        connected: true,
        version: connectionTest.rows[0].db_version,
        currentTime: connectionTest.rows[0].current_time
      },
      tables: {
        required: requiredTables.length,
        existing: existingTables.length,
        missing: missingTables,
        complete: missingTables.length === 0
      },
      data: systemData,
      apis: {
        tested: apiTests.length,
        working: apiTests.filter(api => api.working).length,
        failing: apiTests.filter(api => !api.working).length,
        details: apiTests
      },
      indexes: {
        total: indexesCheck.rows.length,
        list: indexesCheck.rows
      }
    };

    // 7. Calcular score de saúde do sistema
    let healthScore = 0;
    
    // Banco conectado: 20 pontos
    if (systemHealth.database.connected) healthScore += 20;
    
    // Todas as tabelas existem: 30 pontos
    if (systemHealth.tables.complete) healthScore += 30;
    
    // Tem dados essenciais: 20 pontos
    if (systemData.adminUsers > 0 && systemData.categories > 0) healthScore += 20;
    
    // APIs funcionando: 20 pontos
    if (systemHealth.apis.working === systemHealth.apis.tested) healthScore += 20;
    
    // Índices criados: 10 pontos
    if (systemHealth.indexes.total >= 5) healthScore += 10;

    const systemStatus = healthScore >= 90 ? 'EXCELLENT' : 
                        healthScore >= 70 ? 'GOOD' : 
                        healthScore >= 50 ? 'WARNING' : 'CRITICAL';

    // 8. Recomendações
    const recommendations = [];
    
    if (missingTables.length > 0) {
      recommendations.push(`Criar tabelas faltando: ${missingTables.join(', ')}`);
    }
    
    if (systemData.adminUsers === 0) {
      recommendations.push('Criar usuário administrador');
    }
    
    if (systemData.categories === 0) {
      recommendations.push('Inserir categorias de produtos');
    }
    
    if (systemHealth.apis.failing > 0) {
      recommendations.push('Corrigir APIs com falha');
    }

    return NextResponse.json({
      success: true,
      systemStatus,
      healthScore,
      systemHealth,
      recommendations,
      summary: {
        status: systemStatus,
        score: `${healthScore}/100`,
        tablesComplete: systemHealth.tables.complete,
        apisWorking: systemHealth.apis.working === systemHealth.apis.tested,
        hasAdminUser: systemData.adminUsers > 0,
        hasData: systemData.categories > 0 && systemData.products > 0
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Erro na verificação do sistema:', error);

    return NextResponse.json({
      success: false,
      systemStatus: 'CRITICAL',
      error: 'Erro na verificação do sistema',
      details: {
        message: error.message,
        code: error.code,
        hint: error.hint
      }
    }, { status: 500 });
  }
}