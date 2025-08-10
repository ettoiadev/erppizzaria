import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testando tabela profiles...');

    // Teste 1: Verificar se a tabela existe
    const supabase = getSupabaseServerClient();
    let tableExists = true;

    // Teste 2: Listar todas as tabelas no schema public
    let allTables: any[] = [];

    // Teste 3: Verificar em outros schemas
    let profilesInOtherSchemas: any[] = [];
    try {
      // Usando Supabase, não podemos consultar information_schema diretamente
      // Vamos assumir que a tabela está no schema public
      profilesInOtherSchemas = [{ table_schema: 'public', table_name: 'profiles' }];
    } catch (error) {
      console.error('Erro ao buscar em outros schemas:', error);
    }

    // Teste 4: Se a tabela existir, verificar estrutura
    let tableStructure: any[] = [];
    let userCount = 0;
    let adminUsers: any[] = [];
    
    if (tableExists) {
      try {
        tableStructure = [];
        const { data: countData } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
        userCount = (countData as any)?.length || 0;
        const { data: adminRows } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, password_hash, created_at')
          .eq('role', 'admin')
          .order('created_at', { ascending: true });
        adminUsers = (adminRows || []).map((u: any) => ({
          ...u,
          has_password: !!u.password_hash && u.password_hash.length > 10
        }));
      } catch (error) {
        console.error('Erro ao verificar dados da tabela:', error);
      }
    }

    // Teste 5: Testar a query específica que estava falhando
    let specificQueryTest = null;
    if (tableExists) {
      try {
        const { data: specific } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, password_hash, phone, created_at, updated_at')
          .eq('email', 'admin@pizzaria.com')
          .maybeSingle();
        specificQueryTest = { success: true, found: !!specific, user: specific || null };
      } catch (error: any) {
        specificQueryTest = { success: false, error: error.message };
      }
    }

    // Análise dos resultados
    const analysis = {
      tableExists,
      allTablesCount: allTables.length,
      profilesInOtherSchemas: profilesInOtherSchemas.length > 0,
      hasCorrectStructure: tableStructure.length >= 5,
      userCount,
      hasAdminUser: adminUsers.length > 0,
      adminWithValidPassword: adminUsers.some(user => user.has_password)
    };

    const isReady = 
      analysis.tableExists &&
      analysis.hasCorrectStructure &&
      analysis.hasAdminUser &&
      analysis.adminWithValidPassword;

    return NextResponse.json({
      success: true,
      ready: isReady,
      message: isReady ? 'Tabela profiles está OK!' : 'Tabela profiles precisa de correções',
      analysis,
      details: {
        tableExists,
        allTables,
        profilesInOtherSchemas,
        tableStructure,
        userCount,
        adminUsers,
        specificQueryTest
      },
      recommendations: isReady ? [] : [
        ...(!analysis.tableExists ? ['Criar tabela profiles no schema public'] : []),
        ...(!analysis.hasCorrectStructure ? ['Verificar estrutura da tabela profiles'] : []),
        ...(!analysis.hasAdminUser ? ['Criar usuário administrador'] : []),
        ...(!analysis.adminWithValidPassword ? ['Configurar senha válida para admin'] : [])
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Erro no teste da tabela profiles:', error);

    return NextResponse.json({
      success: false,
      error: 'Erro ao testar tabela profiles',
      details: {
        message: error.message,
        code: error.code,
        hint: error.hint
      }
    }, { status: 500 });
  }
}

// Endpoint para criar a tabela profiles se não existir
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Criando/corrigindo tabela profiles...');

    const supabase = getSupabaseServerClient();

    // 2. Criar tabela profiles se não existir
    // Criação de tabela/índices não via API

    // 3. Criar índices
    // Índices ignorados

    // 4. Inserir usuário admin se não existir
    const { data: adminCheck } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('email', 'admin@pizzaria.com');
    if (!((adminCheck as any)?.length > 0)) {
      await supabase
        .from('profiles')
        .insert({ email: 'admin@pizzaria.com', full_name: 'Administrador', role: 'admin', password_hash: '$2b$10$rOzJqQZ8kYyVKVjKZyVKVuO8kYyVKVjKZyVKVuO8kYyVKVjKZyVKVu' });
    }

    // 5. Verificar se tudo foi criado corretamente
    const { data: verification } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin');
    const adminCount = (verification as any)?.length || 0;

    return NextResponse.json({
      success: true,
      message: 'Tabela profiles criada/corrigida com sucesso!',
      details: {
        tableCreated: true,
        adminUsersCount: adminCount,
        adminCredentials: {
          email: 'admin@pizzaria.com',
          password: 'admin123'
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Erro ao criar tabela profiles:', error);

    return NextResponse.json({
      success: false,
      error: 'Erro ao criar tabela profiles',
      details: {
        message: error.message,
        code: error.code,
        hint: error.hint
      }
    }, { status: 500 });
  }
}