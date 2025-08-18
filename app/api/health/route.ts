import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'
import { frontendLogger } from '@/lib/frontend-logger'

// Configurações para Vercel
export const dynamic = 'force-dynamic'

export async function GET() {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    frontendLogger.info('Health check iniciado');
    
    // Testar variáveis de ambiente
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_KEY,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasMercadoPagoToken: !!process.env.MERCADOPAGO_ACCESS_TOKEN
    };
    
    frontendLogger.info('Environment check completed', envCheck);
    
    // Testar Supabase
    let supabaseTest: any = { configured: envCheck.hasSupabaseUrl && envCheck.hasSupabaseKey }
    if (supabaseTest.configured) {
      const supabase = getSupabaseServerClient()
      const { count, error } = await supabase.from('profiles').select('id', { count: 'exact', head: true })
      supabaseTest.countProfiles = count ?? null
      supabaseTest.error = error?.message ?? null
    }
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      supabase: supabaseTest,
      message: 'API funcionando corretamente'
    }, { headers });
    
  } catch (error: any) {
    frontendLogger.error('Health check failed:', error);
    
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