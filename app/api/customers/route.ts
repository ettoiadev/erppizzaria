import { NextRequest, NextResponse } from "next/server"
import { listCustomers } from '@/lib/db-supabase'
import { withDatabaseErrorHandling } from '@/lib/database-error-handler'
import { withErrorMonitoring } from '@/lib/error-monitoring'
import { withApiLogging } from '@/lib/api-logger-middleware'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// Handler GET para buscar clientes (sem middlewares)
async function getCustomersHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const customers = await listCustomers()
    return NextResponse.json({ customers, total: customers.length })
  } catch (error: any) {
    // O middleware de database error handling vai capturar e tratar este erro
    throw error
  }
}

// Aplicar middlewares para GET (apenas logging e monitoramento)
const enhancedGetHandler = withErrorMonitoring(
  withApiLogging(
    withDatabaseErrorHandling(
      getCustomersHandler,
      {
        logErrors: true,
        sanitizeErrors: process.env.NODE_ENV === 'production'
      }
    ),
    {
      logRequests: true,
      logResponses: false, // Não logar resposta para GET (pode ser muito grande)
      logErrors: true
    }
  )
)

// Exportar a função com middlewares
export const GET = enhancedGetHandler