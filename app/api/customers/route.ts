import { NextRequest, NextResponse } from "next/server"
import { listCustomers } from '@/lib/db-supabase'
import { addCorsHeaders, createOptionsHandler } from '@/lib/auth-utils'
import { frontendLogger } from '@/lib/frontend-logger'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// Handler GET para buscar clientes
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    frontendLogger.info('Buscando lista de clientes')
    const customers = await listCustomers()
    frontendLogger.info(`Encontrados ${customers.length} clientes`)
    return addCorsHeaders(NextResponse.json({ customers, total: customers.length }))
  } catch (error: any) {
    const errorMessage = error?.message || 'Erro desconhecido'
    const stack = error?.stack
    
    frontendLogger.logError(
      'Erro ao buscar clientes',
      { errorMessage, stack },
      error instanceof Error ? error : undefined,
      'api'
    )
    return addCorsHeaders(NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 }))
  }
}

// Handler OPTIONS para CORS
export const OPTIONS = createOptionsHandler()