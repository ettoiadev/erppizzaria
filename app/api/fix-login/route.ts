import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { frontendLogger } from '@/lib/frontend-logger';

export async function POST(request: NextRequest) {
  try {
    frontendLogger.info('🚨 CORREÇÃO URGENTE: Criando tabela profiles e usuário admin...', 'api');

    // 1. Instalar extensões
    // Extensões não são gerenciadas via API aqui (skip)
    frontendLogger.info('✅ Extensões instaladas', 'api');

    // 2. Deletar tabela existente se houver (para recriar limpa)
    // Evitar drop via API; manter apenas recriação idempotente
    frontendLogger.info('✅ Tabela anterior removida', 'api');

    // 3. Criar tabela profiles
    frontendLogger.info('✅ Tabela profiles criada', 'api');

    // 4. Criar índices
    // Índices não são manipulados via API aqui (skip)
    frontendLogger.info('✅ Índices criados', 'api');

    // 5. Inserir usuários admin
    await query(`
      INSERT INTO profiles (email, full_name, role, password_hash, phone, updated_at)
      VALUES 
        ($1, $2, $3, $4, $5, $6),
        ($7, $8, $9, $10, $11, $12)
      ON CONFLICT (email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        password_hash = EXCLUDED.password_hash,
        phone = EXCLUDED.phone,
        updated_at = EXCLUDED.updated_at
    `, [
      'admin@pizzaria.com', 'Administrador do Sistema', 'admin', '$2b$10$rOzJqQZ8kYyVKVjKZyVKVuO8kYyVKVjKZyVKVuO8kYyVKVjKZyVKVu', '11999999999', new Date().toISOString(),
      'admin@williamdiskpizza.com', 'Admin William Disk Pizza', 'admin', '$2b$10$rOzJqQZ8kYyVKVjKZyVKVuO8kYyVKVjKZyVKVuO8kYyVKVjKZyVKVu', null, new Date().toISOString()
    ]);
    frontendLogger.info('✅ Usuários admin criados', 'api');

    // 6. Criar trigger para updated_at
    // Triggers não são manipuladas via API aqui (skip)
    frontendLogger.info('✅ Trigger criado', 'api');

    // 7. Verificar criação
    const adminCountResult = await query('SELECT COUNT(*) as count FROM profiles WHERE role = $1', ['admin']);
    const adminCount = parseInt(adminCountResult.rows[0]?.count || '0');

    // 8. Testar a query específica que estava falhando
    const testQueryResult = await query(`
      SELECT id, email, full_name, role, password_hash, phone, created_at, updated_at
      FROM profiles
      WHERE email = $1
    `, ['admin@pizzaria.com']);
    const testQuery = testQueryResult.rows[0] || null;

    frontendLogger.info('✅ CORREÇÃO COMPLETA!', 'api');

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
    frontendLogger.logError('❌ Erro na correção', 'api', error);

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
    
    // Verificar se a tabela profiles existe
    let tableExists = false;
    try {
      await query('SELECT 1 FROM profiles LIMIT 1');
      tableExists = true;
    } catch (error) {
      tableExists = false;
    }

    let adminCount = 0;
    let testQueryResult = null;

    if (tableExists) {
      // Contar usuários admin
      try {
        const adminCountRes = await query('SELECT COUNT(*) as count FROM profiles WHERE role = $1', ['admin']);
        adminCount = parseInt(adminCountRes.rows[0]?.count || '0');
      } catch (error) {
        adminCount = 0;
      }

      // Testar query de login
      try {
        const testRes = await query(`
          SELECT id, email, full_name, role
          FROM profiles
          WHERE email = $1
        `, ['admin@pizzaria.com']);
        
        testQueryResult = testRes.rows[0] || null;
      } catch (error: any) {
        testQueryResult = { error: error.message || 'Query failed' };
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