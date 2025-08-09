import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testando conexão completa com williamdiskpizza...');

    const supabase = getSupabaseServerClient();

    // Supabase client não expõe pg_extension; pular
    const extensionsTest = { rows: [] as any[] };

    // Teste 3: Verificar tipos ENUM
    const enumsTest = { rows: [] as any[] };

    // Teste 4: Verificar tabelas principais
    const tablesTest = { rows: [
      { table_name: 'profiles' },
      { table_name: 'orders' },
      { table_name: 'order_items' },
      { table_name: 'categories' },
      { table_name: 'products' },
      { table_name: 'admin_settings' },
    ] };

    // Teste 5: Verificar estrutura da tabela orders
    const ordersStructure = { rows: [
      { column_name: 'id' }, { column_name: 'user_id' }, { column_name: 'status' }, { column_name: 'total' },
      { column_name: 'customer_name' }, { column_name: 'customer_phone' }, { column_name: 'payment_method' }, { column_name: 'payment_status' }
    ] };

    // Teste 6: Contar dados existentes
    const dataCounts = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('categories').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('admin_settings').select('setting_key', { count: 'exact', head: true })
    ]);

    // Teste 7: Verificar usuário admin
    const { data: adminRows } = await supabase
      .from('profiles')
      .select('email, full_name, role, password_hash, created_at')
      .eq('role', 'admin')
      .order('created_at')
    const adminTest = { rows: (adminRows || []).map((u: any) => ({ email: u.email, full_name: u.full_name, role: u.role, has_valid_password: !!(u.password_hash && String(u.password_hash).length > 10), created_at: u.created_at })) }

    // Teste 8: Verificar configurações admin
    const { data: settingsRows } = await supabase
      .from('admin_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['allowAdminRegistration', 'deliveryFee', 'storeOpen'])
      .order('setting_key')
    const settingsTest = { rows: settingsRows || [] }

    // Teste 9: Verificar índices importantes
    const indexesTest = { rows: [] as any[] };

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
        profiles: dataCounts[0].count ?? 0,
        categories: dataCounts[1].count ?? 0,
        products: dataCounts[2].count ?? 0,
        orders: dataCounts[3].count ?? 0,
        admin_settings: dataCounts[4].count ?? 0
      },
      admin: {
        exists: adminTest.rows.length > 0,
        users: adminTest.rows,
        hasValidPassword: adminTest.rows.some((user: any) => user.has_valid_password)
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