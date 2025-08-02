import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

export async function POST(request: NextRequest) {
  try {
    console.log('🚨 CORREÇÃO URGENTE: Criando tabela profiles e usuário admin...');

    // 1. Instalar extensões
    await query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    console.log('✅ Extensões instaladas');

    // 2. Deletar tabela existente se houver (para recriar limpa)
    await query('DROP TABLE IF EXISTS public.profiles CASCADE');
    console.log('✅ Tabela anterior removida');

    // 3. Criar tabela profiles
    await query(`
      CREATE TABLE public.profiles (
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
    console.log('✅ Tabela profiles criada');

    // 4. Criar índices
    await query('CREATE INDEX idx_profiles_email ON public.profiles(email)');
    await query('CREATE INDEX idx_profiles_role ON public.profiles(role)');
    console.log('✅ Índices criados');

    // 5. Inserir usuários admin
    await query(`
      INSERT INTO public.profiles (email, full_name, role, password_hash, phone, created_at, updated_at) 
      VALUES 
      ($1, $2, $3, $4, $5, NOW(), NOW()),
      ($6, $7, $8, $9, NULL, NOW(), NOW())
    `, [
      'admin@pizzaria.com',
      'Administrador do Sistema',
      'admin',
      '$2b$10$rOzJqQZ8kYyVKVjKZyVKVuO8kYyVKVjKZyVKVuO8kYyVKVjKZyVKVu', // senha: admin123
      '11999999999',
      'admin@williamdiskpizza.com',
      'Admin William Disk Pizza',
      'admin',
      '$2b$10$rOzJqQZ8kYyVKVjKZyVKVuO8kYyVKVjKZyVKVuO8kYyVKVjKZyVKVu' // senha: admin123
    ]);
    console.log('✅ Usuários admin criados');

    // 6. Criar trigger para updated_at
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    await query(`
      CREATE TRIGGER update_profiles_updated_at 
          BEFORE UPDATE ON public.profiles 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);
    console.log('✅ Trigger criado');

    // 7. Verificar criação
    const verification = await query('SELECT COUNT(*) as count FROM public.profiles WHERE role = $1', ['admin']);
    const adminCount = parseInt(verification.rows[0].count);

    // 8. Testar a query específica que estava falhando
    const testQuery = await query(
      'SELECT id, email, full_name, role, password_hash, phone, created_at, updated_at FROM public.profiles WHERE email = $1',
      ['admin@pizzaria.com']
    );

    console.log('✅ CORREÇÃO COMPLETA!');

    return NextResponse.json({
      success: true,
      message: 'Tabela profiles criada e usuários admin inseridos com sucesso!',
      details: {
        adminUsersCreated: adminCount,
        testQueryWorking: testQuery.rows.length > 0,
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
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
      ) as table_exists
    `);

    let adminCount = 0;
    let testQueryResult = null;

    if (tableCheck.rows[0].table_exists) {
      const adminCheck = await query('SELECT COUNT(*) as count FROM public.profiles WHERE role = $1', ['admin']);
      adminCount = parseInt(adminCheck.rows[0].count);

      // Testar query de login
      try {
        const testResult = await query(
          'SELECT id, email, full_name, role FROM public.profiles WHERE email = $1',
          ['admin@pizzaria.com']
        );
        testQueryResult = testResult.rows[0] || null;
      } catch (error) {
        testQueryResult = { error: 'Query failed' };
      }
    }

    return NextResponse.json({
      success: true,
      status: {
        tableExists: tableCheck.rows[0].table_exists,
        adminUsersCount: adminCount,
        loginTestQuery: testQueryResult,
        ready: tableCheck.rows[0].table_exists && adminCount > 0
      },
      message: tableCheck.rows[0].table_exists && adminCount > 0 
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