import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'
import { verifyAdmin } from '@/lib/auth'

export async function PATCH(request: NextRequest) {
  try {
    // Verificar autenticação admin
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    
    if (!token) {
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    const admin = await verifyAdmin(token)
    
    if (!admin) {
      return NextResponse.json({ error: 'Acesso negado - usuário não é admin' }, { status: 403 })
    }

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

    return NextResponse.json({
      success: true,
      message: `${(updated || []).length} pedidos arquivados com sucesso`,
      archivedCount: (updated || []).length,
      archivedOrders: updated || []
    })

  } catch (error: any) {
    console.error('Erro ao arquivar pedidos:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
