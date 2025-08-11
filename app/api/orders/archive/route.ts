import { NextResponse, type NextRequest } from "next/server"
import { withAdminAuth } from "@/lib/auth-middleware"
import { getSupabaseServerClient } from "@/lib/supabase"
import { frontendLogger } from "@/lib/logging"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  return withAdminAuth(request, async (req, admin) => {
    try {
      console.log("[ARCHIVE_ORDERS] PATCH request iniciado")
      console.log(`[ARCHIVE_ORDERS] PATCH: Acesso autorizado para admin: ${admin.email}`)

      const { status } = await request.json()
      
      if (!status || !['DELIVERED', 'CANCELLED'].includes(status)) {
        return NextResponse.json(
          { error: 'Status inválido. Apenas DELIVERED e CANCELLED podem ser arquivados.' },
          { status: 400 }
        )
      }

      console.log(`Arquivando pedidos com status: ${status}`)

      const supabase = getSupabaseServerClient()
      const nowIso = new Date().toISOString()
      const { data: updated, error } = await supabase
        .from('orders')
        .update({ archived_at: nowIso, updated_at: nowIso })
        .eq('status', status)
        .is('archived_at', null)
        .select('id, status, archived_at')
      if (error) throw error

      console.log(`${(updated || []).length} pedidos arquivados com sucesso`)
      frontendLogger.info('admin', 'Pedidos arquivados por status', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        status: status,
        orderCount: (updated || []).length
      })

      return NextResponse.json({
        success: true,
        message: `${(updated || []).length} pedidos arquivados com sucesso`,
        archivedCount: (updated || []).length,
        archivedOrders: updated || []
      })

    } catch (error: any) {
      console.error('Erro ao arquivar pedidos:', error)
      frontendLogger.error('admin', 'Erro ao arquivar pedidos por status', {
        error: error.message,
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        stack: error.stack
      })
      return NextResponse.json(
        { 
          error: 'Erro interno do servidor',
          details: error.message 
        },
        { status: 500 }
      )
    }
  })
}
