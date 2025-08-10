import { NextRequest, NextResponse } from "next/server"
import { searchCustomersOptimized } from '@/lib/db-supabase-optimized'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('q')?.trim() || ''
    const codeSearch = searchParams.get('code')?.trim() || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50) // Máximo 50

    console.log(`[CUSTOMER_SEARCH_OPTIMIZED] Termo: "${searchTerm}", Código: "${codeSearch}", Limite: ${limit}`)

    // Se não há termo de busca nem código, retornar vazio
    if (!searchTerm && !codeSearch) {
      return NextResponse.json({ 
        customers: [],
        meta: {
          searchTerm,
          codeSearch,
          limit,
          timestamp: new Date().toISOString()
        }
      })
    }

    const customers = await searchCustomersOptimized({
      searchTerm,
      codeSearch,
      limit
    })

    console.log(`[CUSTOMER_SEARCH_OPTIMIZED] Encontrados ${customers.length} clientes`)

    return NextResponse.json({ 
      customers,
      meta: {
        searchTerm,
        codeSearch,
        limit,
        found: customers.length,
        timestamp: new Date().toISOString(),
        optimized: true
      }
    })

  } catch (error: any) {
    console.error('[CUSTOMER_SEARCH_OPTIMIZED] Erro na busca:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor',
      message: error.message || 'Falha na busca de clientes',
      customers: [],
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}