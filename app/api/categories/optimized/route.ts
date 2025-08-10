import { NextRequest, NextResponse } from "next/server"
import { getCategoriesOptimized } from '@/lib/db-supabase-optimized'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    
    console.log(`[CATEGORIES_OPTIMIZED] Buscando categorias - Incluir inativas: ${includeInactive}`)
    
    const categories = await getCategoriesOptimized(includeInactive)
    
    console.log(`[CATEGORIES_OPTIMIZED] Encontradas ${categories.length} categorias`)
    
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
    console.error("[CATEGORIES_OPTIMIZED] Erro ao buscar categorias:", error)
    return NextResponse.json({
      error: "Erro interno do servidor",
      message: error.message || "Não foi possível carregar as categorias",
      categories: [],
      total: 0,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}