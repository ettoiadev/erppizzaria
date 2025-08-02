import { NextRequest, NextResponse } from 'next/server';
import { query, testConnection } from '@/lib/db-native';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testando conexão completa com williamdiskpizza...');

    // Teste 1: Conexão básica
    const connectionTest = await testConnection();
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        error: 'Falha na conexão básica com o banco',
        details: connectionTest
      }, { status: 500 });
    }

    // Teste 2: Verificar extensões necessárias
    const extensionsTest = await query(`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname IN ('uuid-ossp', 'pgcrypto')
      ORDER BY extname
    `);

    // Teste 3: Verificar tipos ENUM
    const enumsTest = await query(`
      SELECT t.typname, array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typname IN ('order_status', 'payment_method', 'payment_status')
      GROUP BY t.typname
      ORDER BY t.typname
    `);

    // Teste 4: Verificar tabelas principais
    const tablesTest = await query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('profiles', 'orders', 'order_items', 'categories', 'products', 'admin_settings')
      ORDER BY table_name
    `);

    // Teste 5: Verificar estrutura da tabela orders
    const ordersStructure = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND table_schema = 'public'
      AND column_name IN ('id', 'user_id', 'status', 'total', 'customer_name', 'customer_phone', 'payment_method', 'payment_status')
      ORDER BY ordinal_position
    `);

    // Teste 6: Contar dados existentes
    const dataCounts = await Promise.all([
      query('SELECT COUNT(*) as count FROM profiles').catch(() => ({ rows: [{ count: 0 }] })),
      query('SELECT COUNT(*) as count FROM categories').catch(() => ({ rows: [{ count: 0 }] })),
      query('SELECT COUNT(*) as count FROM products').catch(() => ({ rows: [{ count: 0 }] })),
      query('SELECT COUNT(*) as count FROM orders').catch(() => ({ rows: [{ count: 0 }] })),
      query('SELECT COUNT(*) as count FROM admin_settings').catch(() => ({ rows: [{ count: 0 }] }))
    ]);

    // Teste 7: Verificar usuário admin
    const adminTest = await query(`
      SELECT email, full_name, role, 
             CASE WHEN password_hash IS NOT NULL AND LENGTH(password_hash) > 10 
                  THEN true ELSE false END as has_valid_password,
             created_at
      FROM profiles 
      WHERE role = 'admin'
      ORDER BY created_at
    `).catch(() => ({ rows: [] }));

    // Teste 8: Verificar configurações admin
    const settingsTest = await query(`
      SELECT setting_key, setting_value
      FROM admin_settings
      WHERE setting_key IN ('allowAdminRegistration', 'deliveryFee', 'storeOpen')
      ORDER BY setting_key
    `).catch(() => ({ rows: [] }));

    // Teste 9: Verificar índices importantes
    const indexesTest = await query(`
      SELECT tablename, indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename IN ('orders', 'profiles', 'products')
      AND (indexname LIKE '%_pkey' OR indexname LIKE 'idx_%')
      ORDER BY tablename, indexname
    `).catch(() => ({ rows: [] }));

    // Análise dos resultados
    const analysis = {
      connection: connectionTest.success,
      extensions: {
        required: ['uuid-ossp', 'pgcrypto'],
        installed: extensionsTest.rows.map(row => row.extname),
        missing: ['uuid-ossp', 'pgcrypto'].filter(ext => 
          !extensionsTest.rows.some(row => row.extname === ext)
        )
      },
      enums: {
        required: ['order_status', 'payment_method', 'payment_status'],
        found: enumsTest.rows.map(row => row.typname),
        missing: ['order_status', 'payment_method', 'payment_status'].filter(enumName => 
          !enumsTest.rows.some(row => row.typname === enumName)
        )
      },
      tables: {
        required: ['profiles', 'orders', 'order_items', 'categories', 'products', 'admin_settings'],
        found: tablesTest.rows.map(row => row.table_name),
        missing: ['profiles', 'orders', 'order_items', 'categories', 'products', 'admin_settings'].filter(tableName => 
          !tablesTest.rows.some(row => row.table_name === tableName)
        )
      },
      ordersTable: {
        requiredColumns: ['id', 'user_id', 'status', 'total', 'customer_name', 'customer_phone', 'payment_method', 'payment_status'],
        foundColumns: ordersStructure.rows.map(row => row.column_name),
        missingColumns: ['id', 'user_id', 'status', 'total', 'customer_name', 'customer_phone', 'payment_method', 'payment_status'].filter(colName => 
          !ordersStructure.rows.some(row => row.column_name === colName)
        )
      },
      data: {
        profiles: parseInt(dataCounts[0].rows[0].count),
        categories: parseInt(dataCounts[1].rows[0].count),
        products: parseInt(dataCounts[2].rows[0].count),
        orders: parseInt(dataCounts[3].rows[0].count),
        admin_settings: parseInt(dataCounts[4].rows[0].count)
      },
      admin: {
        exists: adminTest.rows.length > 0,
        users: adminTest.rows,
        hasValidPassword: adminTest.rows.some(user => user.has_valid_password)
      },
      settings: {
        count: settingsTest.rows.length,
        configurations: settingsTest.rows
      },
      indexes: {
        count: indexesTest.rows.length,
        list: indexesTest.rows
      }
    };

    // Verificar se está pronto para produção
    const isReady = 
      analysis.connection &&
      analysis.extensions.missing.length === 0 &&
      analysis.enums.missing.length === 0 &&
      analysis.tables.missing.length === 0 &&
      analysis.ordersTable.missingColumns.length === 0 &&
      analysis.admin.exists &&
      analysis.admin.hasValidPassword &&
      analysis.data.categories > 0;

    return NextResponse.json({
      success: true,
      message: isReady ? 'Banco pronto para a aplicação!' : 'Banco precisa de correções',
      ready: isReady,
      analysis,
      recommendations: isReady ? [] : [
        ...(analysis.extensions.missing.length > 0 ? [`Instalar extensões: ${analysis.extensions.missing.join(', ')}`] : []),
        ...(analysis.enums.missing.length > 0 ? [`Criar tipos ENUM: ${analysis.enums.missing.join(', ')}`] : []),
        ...(analysis.tables.missing.length > 0 ? [`Criar tabelas: ${analysis.tables.missing.join(', ')}`] : []),
        ...(analysis.ordersTable.missingColumns.length > 0 ? [`Adicionar colunas em orders: ${analysis.ordersTable.missingColumns.join(', ')}`] : []),
        ...(!analysis.admin.exists ? ['Criar usuário administrador'] : []),
        ...(!analysis.admin.hasValidPassword ? ['Configurar senha válida para admin'] : []),
        ...(analysis.data.categories === 0 ? ['Inserir categorias de produtos'] : [])
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Erro na verificação completa:', error);

    return NextResponse.json({
      success: false,
      error: 'Erro na verificação do banco de dados',
      details: {
        message: error.message,
        code: error.code,
        hint: error.hint,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    }, { status: 500 });
  }
}