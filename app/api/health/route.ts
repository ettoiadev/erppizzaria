import { NextResponse } from 'next/server'
import { testConnection } from '@/lib/db'

// Configurações para Vercel
export const dynamic = 'force-dynamic'

export async function GET() {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    console.log('🏥 Health check iniciado');
    
    // Testar variáveis de ambiente
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasJwtSecret: !!process.env.JWT_SECRET
    };
    
    console.log('🔧 Environment check:', envCheck);
    
    // Testar conexão com banco
    const dbTest = await testConnection();
    console.log('🗄️ Database test:', dbTest);
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: dbTest,
      message: 'API funcionando corretamente'
    }, { headers });
    
  } catch (error: any) {
    console.error('❌ Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      message: 'API com problemas'
    }, { 
      status: 500,
      headers 
    });
  }
}

export async function POST() {
  return NextResponse.json({
    message: 'Health check - POST method working',
    timestamp: new Date().toISOString()
  });
} 