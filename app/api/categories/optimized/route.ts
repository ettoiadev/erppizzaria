import { NextRequest, NextResponse } from "next/server"
import { getCategoriesOptimized } from '@/lib/db-supabase-optimized'
import { frontendLogger } from '@/lib/frontend-logger'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    
    frontendLogger.info('Busca otimizada de categorias iniciada', 'api', {
      includeInactive
    })
    
    const categories = await getCategoriesOptimized(includeInactive)
    
    frontendLogger.info('Categorias encontradas na busca otimizada', 'api', {
      count: categories.length,
      includeInactive
    })
    
    return NextResponse.json({
      categories,
      total: categories.length,
      meta: {
        includeInactive,
        cached: false,
        timestamp: new Date().toISOString(),
        optimized: true
      }
    })

  } catch (error: any) {
    frontendLogger.error('Erro na busca otimizada de categorias', 'api', {
      error: error.message,
      stack: error.stack,
      includeInactive
    })
    return NextResponse.json({
      error: "Erro interno do servidor",
      message: error.message || "Não foi possível carregar as categorias",
      categories: [],
      total: 0,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}