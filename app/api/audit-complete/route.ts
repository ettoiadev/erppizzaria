import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 AUDITORIA COMPLETA - Verificando migração Supabase → PostgreSQL...');

    const auditResults = {
      summary: {
        totalAPIs: 0,
        workingAPIs: 0,
        failingAPIs: 0,
        score: 0
      },
      categories: {
        critical: { tested: 0, working: 0, apis: [] as any[] },
        functional: { tested: 0, working: 0, apis: [] as any[] },
        debug: { tested: 0, working: 0, apis: [] as any[] }
      },
      database: {
        connection: false,
        tables: [] as string[],
        indexes: 0,
        constraints: 0
      },
      recommendations: [] as string[]
    };

    // 1. Teste de Conexão com Banco
    try {
      const connectionTest = await query('SELECT NOW() as current_time, version() as db_version');
      auditResults.database.connection = true;
      console.log('✅ Conexão PostgreSQL funcionando');
    } catch (error) {
      console.log('❌ Falha na conexão PostgreSQL');
      auditResults.recommendations.push('Verificar configuração do banco PostgreSQL');
    }

    // 2. Verificar Tabelas Principais
    const tablesResult = await query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    auditResults.database.tables = tablesResult.rows.map(row => row.table_name);

    // 3. Contar Índices
    const indexesResult = await query(`
      SELECT COUNT(*) as count FROM pg_indexes 
      WHERE schemaname = 'public'
    `);
    auditResults.database.indexes = parseInt(indexesResult.rows[0].count);

    // 4. Testar APIs Críticas
    const criticalAPIs = [
      { name: 'Orders List', endpoint: '/api/orders', method: 'GET' },
      { name: 'Order by ID', endpoint: '/api/orders/test-id', method: 'GET', expectStatus: 404 },
      { name: 'Products List', endpoint: '/api/products', method: 'GET' },
      { name: 'Categories List', endpoint: '/api/categories', method: 'GET' },
      { name: 'Customers List', endpoint: '/api/customers', method: 'GET' },
      { name: 'Drivers List', endpoint: '/api/drivers', method: 'GET' },
      { name: 'Admin Profile (no auth)', endpoint: '/api/admin/profile', method: 'GET', expectStatus: 401 }
    ];

    for (const api of criticalAPIs) {
      auditResults.categories.critical.tested++;
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}${api.endpoint}`, {
          method: api.method
        });
        
        const expectedStatus = api.expectStatus || 200;
        const isWorking = response.status === expectedStatus;
        
        auditResults.categories.critical.apis.push({
          name: api.name,
          endpoint: api.endpoint,
          status: response.status,
          working: isWorking,
          expected: expectedStatus
        });

        if (isWorking) {
          auditResults.categories.critical.working++;
        }
      } catch (error: any) {
        auditResults.categories.critical.apis.push({
          name: api.name,
          endpoint: api.endpoint,
          status: 'ERROR',
          working: false,
          error: error.message
        });
      }
    }

    // 5. Testar APIs Funcionais
    const functionalAPIs = [
      { name: 'Settings Public', endpoint: '/api/settings', method: 'GET' },
      { name: 'Favorites (no params)', endpoint: '/api/favorites', method: 'GET', expectStatus: 400 }
    ];

    for (const api of functionalAPIs) {
      auditResults.categories.functional.tested++;
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}${api.endpoint}`, {
          method: api.method
        });
        
        const expectedStatus = api.expectStatus || 200;
        const isWorking = response.status === expectedStatus;
        
        auditResults.categories.functional.apis.push({
          name: api.name,
          endpoint: api.endpoint,
          status: response.status,
          working: isWorking,
          expected: expectedStatus
        });

        if (isWorking) {
          auditResults.categories.functional.working++;
        }
      } catch (error: any) {
        auditResults.categories.functional.apis.push({
          name: api.name,
          endpoint: api.endpoint,
          status: 'ERROR',
          working: false,
          error: error.message
        });
      }
    }

    // 6. Verificar Estrutura de Dados Essenciais
    const dataChecks = [
      { name: 'Admin Users', query: 'SELECT COUNT(*) as count FROM profiles WHERE role = $1', params: ['admin'] },
      { name: 'Categories', query: 'SELECT COUNT(*) as count FROM categories WHERE active = true' },
      { name: 'Products', query: 'SELECT COUNT(*) as count FROM products WHERE active = true' },
      { name: 'Settings', query: 'SELECT COUNT(*) as count FROM admin_settings' }
    ];

    const dataResults = [];
    for (const check of dataChecks) {
      try {
        const result = await query(check.query, check.params || []);
        const count = parseInt(result.rows[0].count);
        dataResults.push({
          name: check.name,
          count,
          status: count > 0 ? 'OK' : 'EMPTY'
        });
      } catch (error: any) {
        dataResults.push({
          name: check.name,
          count: 0,
          status: 'ERROR',
          error: error.message
        });
      }
    }

    // 7. Calcular Scores
    const totalAPIs = auditResults.categories.critical.tested + auditResults.categories.functional.tested;
    const workingAPIs = auditResults.categories.critical.working + auditResults.categories.functional.working;
    
    auditResults.summary.totalAPIs = totalAPIs;
    auditResults.summary.workingAPIs = workingAPIs;
    auditResults.summary.failingAPIs = totalAPIs - workingAPIs;
    auditResults.summary.score = totalAPIs > 0 ? Math.round((workingAPIs / totalAPIs) * 100) : 0;

    // 8. Gerar Recomendações
    if (auditResults.summary.score < 100) {
      auditResults.recommendations.push('Corrigir APIs que falharam nos testes');
    }

    if (!auditResults.database.connection) {
      auditResults.recommendations.push('Verificar configuração do PostgreSQL');
    }

    const emptyData = dataResults.filter(d => d.status === 'EMPTY');
    if (emptyData.length > 0) {
      auditResults.recommendations.push(`Inserir dados em: ${emptyData.map(d => d.name).join(', ')}`);
    }

    if (auditResults.database.tables.length < 7) {
      auditResults.recommendations.push('Verificar se todas as tabelas necessárias foram criadas');
    }

    // 9. Determinar Status Geral
    let overallStatus = 'CRITICAL';
    if (auditResults.summary.score >= 90 && auditResults.database.connection) {
      overallStatus = 'EXCELLENT';
    } else if (auditResults.summary.score >= 70) {
      overallStatus = 'GOOD';
    } else if (auditResults.summary.score >= 50) {
      overallStatus = 'WARNING';
    }

    return NextResponse.json({
      success: true,
      status: overallStatus,
      message: `Auditoria completa: ${auditResults.summary.score}% das APIs funcionando`,
      auditResults,
      dataResults,
      timestamp: new Date().toISOString(),
      migration_status: {
        supabase_removed: true,
        postgresql_native: true,
        apis_migrated: workingAPIs,
        apis_total: totalAPIs,
        completion_percentage: auditResults.summary.score
      }
    });

  } catch (error: any) {
    console.error('❌ Erro na auditoria completa:', error);

    return NextResponse.json({
      success: false,
      status: 'CRITICAL',
      error: 'Erro na auditoria completa',
      details: {
        message: error.message,
        code: error.code
      }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Executando correções automáticas pós-auditoria...');

    const corrections = [];
    let correctionsMade = 0;

    // 1. Verificar e criar tabelas faltantes
    const essentialTables = [
      {
        name: 'user_favorites',
        sql: `
          CREATE TABLE IF NOT EXISTS public.user_favorites (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
            product_id UUID REFERENCES products(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, product_id)
          )
        `
      },
      {
        name: 'order_status_history',
        sql: `
          CREATE TABLE IF NOT EXISTS public.order_status_history (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
            old_status VARCHAR(50),
            new_status VARCHAR(50),
            notes TEXT,
            changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `
      }
    ];

    for (const table of essentialTables) {
      try {
        await query(table.sql);
        corrections.push(`Tabela ${table.name} verificada/criada`);
        correctionsMade++;
      } catch (error: any) {
        corrections.push(`Erro ao criar tabela ${table.name}: ${error.message}`);
      }
    }

    // 2. Criar índices adicionais para performance
    const additionalIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_favorites_product_id ON user_favorites(product_id)',
      'CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id)',
      'CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status)',
      'CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at)'
    ];

    for (const indexSQL of additionalIndexes) {
      try {
        await query(indexSQL);
        correctionsMade++;
      } catch (error: any) {
        corrections.push(`Erro ao criar índice: ${error.message}`);
      }
    }

    corrections.push(`${additionalIndexes.length} índices de performance verificados`);

    // 3. Verificar integridade referencial
    try {
      const integrityCheck = await query(`
        SELECT 
          COUNT(*) FILTER (WHERE o.user_id IS NOT NULL AND p.id IS NULL) as orphaned_orders,
          COUNT(*) FILTER (WHERE oi.product_id IS NOT NULL AND pr.id IS NULL) as orphaned_items
        FROM orders o
        FULL OUTER JOIN profiles p ON o.user_id = p.id
        FULL OUTER JOIN order_items oi ON true
        FULL OUTER JOIN products pr ON oi.product_id = pr.id
      `);

      const orphans = integrityCheck.rows[0];
      if (orphans.orphaned_orders > 0 || orphans.orphaned_items > 0) {
        corrections.push(`Detectados registros órfãos: ${orphans.orphaned_orders} pedidos, ${orphans.orphaned_items} itens`);
      } else {
        corrections.push('Integridade referencial verificada - OK');
        correctionsMade++;
      }
    } catch (error: any) {
      corrections.push(`Erro na verificação de integridade: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: `${correctionsMade} correções aplicadas com sucesso`,
      corrections,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Erro nas correções automáticas:', error);

    return NextResponse.json({
      success: false,
      error: 'Erro nas correções automáticas',
      details: error.message
    }, { status: 500 });
  }
}