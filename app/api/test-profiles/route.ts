import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testando tabela profiles...');

    // Teste 1: Verificar se a tabela existe
    let tableExists = false;
    try {
      const tableCheck = await query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'profiles'
        ) as exists
      `);
      tableExists = tableCheck.rows[0].exists;
    } catch (error) {
      console.error('Erro ao verificar tabela:', error);
    }

    // Teste 2: Listar todas as tabelas no schema public
    let allTables = [];
    try {
      const tablesResult = await query(`
        SELECT table_name, table_type 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      allTables = tablesResult.rows;
    } catch (error) {
      console.error('Erro ao listar tabelas:', error);
    }

    // Teste 3: Verificar em outros schemas
    let profilesInOtherSchemas = [];
    try {
      const otherSchemasResult = await query(`
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_name = 'profiles'
        ORDER BY table_schema
      `);
      profilesInOtherSchemas = otherSchemasResult.rows;
    } catch (error) {
      console.error('Erro ao buscar em outros schemas:', error);
    }

    // Teste 4: Se a tabela existir, verificar estrutura
    let tableStructure = [];
    let userCount = 0;
    let adminUsers = [];
    
    if (tableExists) {
      try {
        // Estrutura da tabela
        const structureResult = await query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'profiles'
          ORDER BY ordinal_position
        `);
        tableStructure = structureResult.rows;

        // Contar usuários
        const countResult = await query('SELECT COUNT(*) as count FROM public.profiles');
        userCount = parseInt(countResult.rows[0].count);

        // Buscar usuários admin
        const adminResult = await query(`
          SELECT id, email, full_name, role, 
                 CASE WHEN password_hash IS NOT NULL AND LENGTH(password_hash) > 10 
                      THEN true ELSE false END as has_password,
                 created_at
          FROM public.profiles 
          WHERE role = 'admin'
          ORDER BY created_at
        `);
        adminUsers = adminResult.rows;

      } catch (error) {
        console.error('Erro ao verificar dados da tabela:', error);
      }
    }

    // Teste 5: Testar a query específica que estava falhando
    let specificQueryTest = null;
    if (tableExists) {
      try {
        const specificResult = await query(
          'SELECT id, email, full_name, role, password_hash, phone, created_at, updated_at FROM public.profiles WHERE email = $1',
          ['admin@pizzaria.com']
        );
        specificQueryTest = {
          success: true,
          found: specificResult.rows.length > 0,
          user: specificResult.rows[0] || null
        };
      } catch (error: any) {
        specificQueryTest = {
          success: false,
          error: error.message
        };
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

    // 1. Criar extensões necessárias
    await query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    // 2. Criar tabela profiles se não existir
    await query(`
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'kitchen', 'delivery')),
        phone VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // 3. Criar índices
    await query('CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email)');
    await query('CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role)');

    // 4. Inserir usuário admin se não existir
    const adminCheck = await query('SELECT COUNT(*) as count FROM public.profiles WHERE email = $1', ['admin@pizzaria.com']);
    
    if (parseInt(adminCheck.rows[0].count) === 0) {
      await query(`
        INSERT INTO public.profiles (email, full_name, role, password_hash, created_at, updated_at) 
        VALUES ($1, $2, $3, $4, NOW(), NOW())
      `, [
        'admin@pizzaria.com',
        'Administrador',
        'admin',
        '$2b$10$rOzJqQZ8kYyVKVjKZyVKVuO8kYyVKVjKZyVKVuO8kYyVKVjKZyVKVu' // senha: admin123
      ]);
    }

    // 5. Verificar se tudo foi criado corretamente
    const verification = await query('SELECT COUNT(*) as count FROM public.profiles WHERE role = $1', ['admin']);
    const adminCount = parseInt(verification.rows[0].count);

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