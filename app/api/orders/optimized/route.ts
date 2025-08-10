import { NextRequest, NextResponse } from "next/server"
import { listOrdersOptimized } from '@/lib/db-supabase-optimized'
import { ordersRateLimiter } from '@/lib/rate-limiter'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Aplicar rate limiting
    const rateLimitResult = ordersRateLimiter(request)
    if (rateLimitResult && (rateLimitResult as NextResponse).status === 429) {
      return rateLimitResult
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const userId = searchParams.get("userId")
    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")

    // Validar parâmetros
    const parsedLimit = limit ? Math.min(parseInt(limit), 100) : null // Máximo de 100 itens
    const parsedOffset = offset ? Math.max(parseInt(offset), 0) : null // Mínimo 0

    console.log(`[ORDERS_OPTIMIZED] Buscando pedidos - Status: ${status}, Limit: ${parsedLimit}, Offset: ${parsedOffset}`)

    const { orders, statistics } = await listOrdersOptimized({
      status,
      userId,
      limit: parsedLimit,
      offset: parsedOffset,
    })

    console.log(`[ORDERS_OPTIMIZED] Encontrados ${orders.length} pedidos`)

    return NextResponse.json({ 
      orders, 
      statistics, 
      pagination: { 
        total: statistics.total, 
        limit: parsedLimit, 
        offset: parsedOffset || 0 
      },
      meta: {
        cached: false,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error("❌ [ORDERS_OPTIMIZED] Erro ao buscar pedidos:", error)
    return NextResponse.json(
      { 
        error: "Erro interno do servidor",
        message: error.message || "Falha ao carregar pedidos",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}