import { NextRequest, NextResponse } from "next/server"
import { listCustomersOptimized } from '@/lib/db-supabase-optimized'
import { frontendLogger } from '@/lib/frontend-logger'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    frontendLogger.info('Busca otimizada de clientes iniciada', 'api')
    
    const customers = await listCustomersOptimized()
    
    frontendLogger.info('Clientes encontrados na busca otimizada', 'api', {
      count: customers.length
    })
    
    return NextResponse.json({ 
      customers, 
      total: customers.length,
      meta: {
        cached: false,
        timestamp: new Date().toISOString(),
        optimized: true
      }
    })

  } catch (error: any) {
    frontendLogger.error('Erro na busca otimizada de clientes', 'api', {
      error: error.message,
      stack: error.stack
    })
    return NextResponse.json({
      error: "Erro interno do servidor",
      message: "Não foi possível carregar a lista de clientes",
      customers: [],
      total: 0,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}