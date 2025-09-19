import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/postgresql"
import { frontendLogger } from "@/lib/frontend-logger"
import { validateAdminAuth, createAuthErrorResponse, addCorsHeaders, createOptionsHandler } from '@/lib/auth-utils'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  // Validar autenticação de admin
  const authResult = await validateAdminAuth(request)
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error || 'Acesso negado', 401)
  }
  
  const admin = authResult.user
  if (!admin) {
    return createAuthErrorResponse('Usuário não autenticado', 401)
  }

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

      const nowIso = new Date().toISOString()
      const updated = await query(
        'UPDATE orders SET archived_at = $1, updated_at = $2 WHERE status = $3 AND archived_at IS NULL RETURNING id, status, archived_at',
        [nowIso, nowIso, status]
      )

      frontendLogger.info(`${(updated.rows || []).length} pedidos arquivados com sucesso`, 'api')
      frontendLogger.info('Pedidos arquivados por status', 'api', {
         adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
         status: status,
         count: (updated.rows || []).length
       })

      const response = NextResponse.json({
        success: true,
        message: `${(updated.rows || []).length} pedidos arquivados com sucesso`,
        archivedCount: (updated.rows || []).length,
        archivedOrders: updated.rows || []
      })
      return addCorsHeaders(response)

  } catch (error: any) {
    frontendLogger.logError('Erro ao arquivar pedidos por status', {
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
export const OPTIONS = createOptionsHandler()
