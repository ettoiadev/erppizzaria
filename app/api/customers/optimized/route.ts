import { NextRequest, NextResponse } from "next/server"
import { listCustomers } from '@/lib/db/customers'
import { frontendLogger } from '@/lib/frontend-logger'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    frontendLogger.info('Busca otimizada de clientes iniciada', 'api')
    
    const customers = await listCustomers()
    
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
    const errorMessage = error?.message || 'Erro desconhecido'
    const stack = error?.stack
    
    frontendLogger.logError(
      'Erro na busca otimizada de clientes',
      { errorMessage, stack },
      error instanceof Error ? error : undefined,
      'api'
    )
    return NextResponse.json({
      error: "Erro interno do servidor",
      message: "Não foi possível carregar a lista de clientes",
      customers: [],
      total: 0,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}