import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import { frontendLogger } from "@/lib/frontend-logger"
import { validateAdminAuth, createAuthErrorResponse, addCorsHeaders, createOptionsHandler } from '@/lib/auth-utils'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  // Validar autenticação de admin
  const authResult = await validateAdminAuth(request)
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status)
  }
  
  const admin = authResult.user

  try {
      frontendLogger.info("[ARCHIVE_ORDERS] PATCH request iniciado")
      frontendLogger.info(`[ARCHIVE_ORDERS] PATCH: Acesso autorizado para admin: ${admin.email}`)

      const { status } = await request.json()
      
      if (!status || !['DELIVERED', 'CANCELLED'].includes(status)) {
        const response = NextResponse.json(
          { error: 'Status inválido. Apenas DELIVERED e CANCELLED podem ser arquivados.' },
          { status: 400 }
        )
        return addCorsHeaders(response)
      }

      frontendLogger.info(`Arquivando pedidos com status: ${status}`)

      const supabase = getSupabaseServerClient()
      const nowIso = new Date().toISOString()
      const { data: updated, error } = await supabase
        .from('orders')
        .update({ archived_at: nowIso, updated_at: nowIso })
        .eq('status', status)
        .is('archived_at', null)
        .select('id, status, archived_at')
      if (error) throw error

      frontendLogger.info(`${(updated || []).length} pedidos arquivados com sucesso`)
      frontendLogger.info('Pedidos arquivados por status', 'api', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        status: status,
        orderCount: (updated || []).length
      })

      const response = NextResponse.json({
        success: true,
        message: `${(updated || []).length} pedidos arquivados com sucesso`,
        archivedCount: (updated || []).length,
        archivedOrders: updated || []
      })
      return addCorsHeaders(response)

  } catch (error: any) {
    frontendLogger.error('Erro ao arquivar pedidos:', {
      message: error.message,
      stack: error.stack,
      error
    })
    frontendLogger.logError('Erro ao arquivar pedidos por status', {
        error: error.message,
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        status: status
      }, error, 'api')
    const response = NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error.message 
      },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}

// Handler para requisições OPTIONS (CORS)
export async function OPTIONS() {
  return createOptionsHandler()
}
