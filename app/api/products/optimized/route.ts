import { NextRequest, NextResponse } from "next/server"
import { getProductsActive } from '@/lib/db/products'
import { addCorsHeaders } from '@/lib/auth-utils'
import { frontendLogger } from '@/lib/frontend-logger'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    frontendLogger.info('Buscando produtos ativos otimizados')
    
    const products = await getProductsActive()
    
    frontendLogger.info(`Encontrados ${products.length} produtos ativos otimizados`)
    
    return addCorsHeaders(NextResponse.json({
      products,
      total: products.length,
      meta: {
        cached: false,
        timestamp: new Date().toISOString(),
        optimized: true
      }
    }))

  } catch (error: any) {
    frontendLogger.logError('Erro ao buscar produtos otimizados:', 'api', error)
    return addCorsHeaders(NextResponse.json({
      error: "Erro interno do servidor",
      message: error.message || "Não foi possível carregar os produtos",
      products: [],
      total: 0,
      timestamp: new Date().toISOString()
    }, { status: 500 }))
  }
}