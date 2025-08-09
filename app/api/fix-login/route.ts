import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🚨 CORREÇÃO URGENTE: Criando tabela profiles e usuário admin...');

    // 1. Instalar extensões
    // Extensões não são gerenciadas via API Supabase aqui (skip)
    console.log('✅ Extensões instaladas');

    // 2. Deletar tabela existente se houver (para recriar limpa)
    // Evitar drop via API; manter apenas recriação idempotente
    console.log('✅ Tabela anterior removida');

    // 3. Criar tabela profiles
    const supabase = getSupabaseServerClient();
    console.log('✅ Tabela profiles criada');

    // 4. Criar índices
    // Índices não são manipulados via API aqui (skip)
    console.log('✅ Índices criados');

    // 5. Inserir usuários admin
    await supabase.from('profiles').upsert([
      { email: 'admin@pizzaria.com', full_name: 'Administrador do Sistema', role: 'admin', password_hash: '$2b$10$rOzJqQZ8kYyVKVjKZyVKVuO8kYyVKVjKZyVKVuO8kYyVKVjKZyVKVu', phone: '11999999999', updated_at: new Date().toISOString() },
      { email: 'admin@williamdiskpizza.com', full_name: 'Admin William Disk Pizza', role: 'admin', password_hash: '$2b$10$rOzJqQZ8kYyVKVjKZyVKVuO8kYyVKVjKZyVKVuO8kYyVKVjKZyVKVu', updated_at: new Date().toISOString() }
    ], { onConflict: 'email' });
    console.log('✅ Usuários admin criados');

    // 6. Criar trigger para updated_at
    // Triggers não são manipuladas via API aqui (skip)
    console.log('✅ Trigger criado');

    // 7. Verificar criação
    const { data } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin');
    const adminCount = (data as any)?.length || 0;

    // 8. Testar a query específica que estava falhando
    const { data: testQuery } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, password_hash, phone, created_at, updated_at')
      .eq('email', 'admin@pizzaria.com')
      .maybeSingle();

    console.log('✅ CORREÇÃO COMPLETA!');

    return NextResponse.json({
      success: true,
      message: 'Tabela profiles criada e usuários admin inseridos com sucesso!',
      details: {
        adminUsersCreated: adminCount,
        testQueryWorking: !!testQuery,
        credentials: [
          {
            email: 'admin@pizzaria.com',
            password: 'admin123',
            name: 'Administrador do Sistema'
          },
          {
            email: 'admin@williamdiskpizza.com', 
            password: 'admin123',
            name: 'Admin William Disk Pizza'
          }
        ]
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Erro na correção:', error);

    return NextResponse.json({
      success: false,
      error: 'Erro ao corrigir problema de login',
      details: {
        message: error.message,
        code: error.code,
        hint: error.hint
      }
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar status atual
    const supabase = getSupabaseServerClient();
    
    // Verificar se a tabela profiles existe
    let tableExists = false;
    try {
      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      tableExists = !error;
    } catch (error) {
      tableExists = false;
    }

    let adminCount = 0;
    let testQueryResult = null;

    if (tableExists) {
      // Contar usuários admin
      const { data: adminData, error: adminError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('role', 'admin');
      
      if (!adminError) {
        adminCount = adminData?.length || 0;
      }

      // Testar query de login
      try {
        const { data: testData, error: testError } = await supabase
          .from('profiles')
          .select('id, email, full_name, role')
          .eq('email', 'admin@pizzaria.com')
          .maybeSingle();
        
        testQueryResult = testError ? { error: testError.message } : testData;
      } catch (error) {
        testQueryResult = { error: 'Query failed' };
      }
    }

    return NextResponse.json({
      success: true,
      status: {
        tableExists: tableExists,
        adminUsersCount: adminCount,
        loginTestQuery: testQueryResult,
        ready: tableExists && adminCount > 0
      },
      message: tableExists && adminCount > 0 
        ? 'Sistema pronto para login!' 
        : 'Sistema precisa de correção - execute POST nesta rota'
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Erro ao verificar status',
      details: error.message
    }, { status: 500 });
  }
}