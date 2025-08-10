import { NextRequest, NextResponse } from "next/server"
import { getProductsActiveOptimized } from '@/lib/db-supabase-optimized'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('[PRODUCTS_OPTIMIZED] Buscando produtos ativos otimizados')
    
    const products = await getProductsActiveOptimized()
    
    console.log(`[PRODUCTS_OPTIMIZED] Encontrados ${products.length} produtos ativos`)
    
    return NextResponse.json({
      products,
      total: products.length,
      meta: {
        cached: false,
        timestamp: new Date().toISOString(),
        optimized: true
      }
    })

  } catch (error: any) {
    console.error("[PRODUCTS_OPTIMIZED] Erro ao buscar produtos:", error)
    return NextResponse.json({
      error: "Erro interno do servidor",
      message: error.message || "Não foi possível carregar os produtos",
      products: [],
      total: 0,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}