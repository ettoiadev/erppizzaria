import { NextResponse } from "next/server"
import { query } from "@/lib/postgres"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Teste simples de conexão
    const result = await query('SELECT NOW() as current_time, version() as db_version');
    
    // Teste específico para buscar usuário admin
    const adminTest = await query(
      'SELECT id, email, full_name, role FROM profiles WHERE email = $1',
      ['admin@williamdiskpizza.com']
    );
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection working',
      currentTime: result.rows[0]?.current_time,
      dbVersion: result.rows[0]?.db_version,
      adminUser: adminTest.rows[0] || null,
      totalUsers: adminTest.rows.length
    });
    
  } catch (error: any) {
    console.error('Database test error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
      code: error.code,
      detail: error.detail
    }, { status: 500 });
  }
} 