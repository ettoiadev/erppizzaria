import { NextRequest, NextResponse } from "next/server"
import { searchCustomersOptimized } from '@/lib/db-supabase-optimized'
import { frontendLogger } from '@/lib/frontend-logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('q')?.trim() || ''
    const codeSearch = searchParams.get('code')?.trim() || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50) // Máximo 50

    frontendLogger.info('Busca otimizada de clientes iniciada', 'api', {
      searchTerm,
      codeSearch,
      limit
    })

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

    frontendLogger.info('Clientes encontrados na busca otimizada', 'api', {
      count: customers.length,
      searchTerm,
      codeSearch
    })

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
    frontendLogger.error('Erro na busca otimizada de clientes', 'api', {
      error: error.message,
      stack: error.stack,
      searchTerm,
      codeSearch,
      limit
    })
    return NextResponse.json({
      error: 'Erro interno do servidor',
      message: error.message || 'Falha na busca de clientes',
      customers: [],
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}