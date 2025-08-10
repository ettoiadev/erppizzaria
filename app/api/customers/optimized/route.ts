import { NextRequest, NextResponse } from "next/server"
import { listCustomersOptimized } from '@/lib/db-supabase-optimized'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('[CUSTOMERS_OPTIMIZED] Buscando lista de clientes otimizada')
    
    const customers = await listCustomersOptimized()
    
    console.log(`[CUSTOMERS_OPTIMIZED] Encontrados ${customers.length} clientes`)
    
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
    console.error("[CUSTOMERS_OPTIMIZED] Erro ao buscar clientes:", error)
    return NextResponse.json({
      error: "Erro interno do servidor",
      message: "Não foi possível carregar a lista de clientes",
      customers: [],
      total: 0,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}