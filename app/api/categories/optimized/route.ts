import { NextRequest, NextResponse } from "next/server"
import { query } from '@/lib/db'
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
    
    // Buscar categorias otimizada com PostgreSQL
    const categoriesResult = await query(`
      SELECT 
        id, name, description, active, display_order, created_at, updated_at,
        (
          SELECT COUNT(*) 
          FROM products p 
          WHERE p.category_id = c.id 
            AND p.active = true
        ) as product_count
      FROM categories c
      ${includeInactive ? '' : 'WHERE c.active = true'}
      ORDER BY c.display_order ASC, c.name ASC
    `)
    
    const categories = categoriesResult.rows
    
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

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    frontendLogger.logError('Erro na busca otimizada de categorias', {
      errorMessage,
      stack: errorStack
    }, error instanceof Error ? error : undefined, 'api')
    return NextResponse.json({
      error: "Erro interno do servidor",
      message: errorMessage || "Não foi possível carregar as categorias",
      categories: [],
      total: 0,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}