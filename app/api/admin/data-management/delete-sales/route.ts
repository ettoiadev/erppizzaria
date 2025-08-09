import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'
import { verifyAdmin } from '@/lib/auth'

export async function DELETE(request: NextRequest) {
  try {
    console.log('[DELETE_SALES] Iniciando exclusão de todos os dados de vendas...')

    // Verificar autenticação admin
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    
    if (!token) {
      console.log('[DELETE_SALES] Token de autorização não fornecido')
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    const admin = await verifyAdmin(token)
    
    if (!admin) {
      console.log('[DELETE_SALES] Usuário não é admin')
      return NextResponse.json({ error: 'Acesso negado - usuário não é admin' }, { status: 403 })
    }

    console.log('[DELETE_SALES] Autenticação admin verificada, prosseguindo...')

    const supabase = getSupabaseServerClient()

    let deletedOrderItems = 0
    let deletedOrders = 0

    try {
      // 1. Primeiro, contar itens de pedidos
      const { data: oi } = await supabase.from('order_items').select('id', { count: 'exact', head: true })
      const totalOrderItems = (oi as any)?.length || 0
      
      // 2. Contar pedidos
      const { data: ord } = await supabase.from('orders').select('id', { count: 'exact', head: true })
      const totalOrders = (ord as any)?.length || 0

      console.log(`[DELETE_SALES] Encontrados ${totalOrderItems} itens de pedidos e ${totalOrders} pedidos para deletar`)

      // 3. Deletar todos os itens de pedidos
      console.log('[DELETE_SALES] Deletando itens de pedidos...')
      const { error: delOiErr } = await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (delOiErr) throw delOiErr
      deletedOrderItems = totalOrderItems

      // 4. Deletar todos os pedidos
      console.log('[DELETE_SALES] Deletando pedidos...')
      const { error: delOrdErr } = await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (delOrdErr) throw delOrdErr
      deletedOrders = totalOrders

      // 5. Se existirem outras tabelas relacionadas a vendas/pagamentos, deletar aqui
      // Exemplo: payment_transactions, order_status_history, etc.
      
      // Sem transação: operações simples e idempotentes em Supabase

      console.log(`[DELETE_SALES] Exclusão concluída: ${deletedOrderItems} itens e ${deletedOrders} pedidos deletados`)

      return NextResponse.json({
        success: true,
        message: 'Todos os dados de vendas foram excluídos com sucesso',
        details: {
          deletedOrders,
          deletedOrderItems,
          totalDeleted: deletedOrders + deletedOrderItems
        }
      })

    } catch (error) {
      console.error('[DELETE_SALES] Erro durante exclusão:', error)
      throw error
    }

  } catch (error: any) {
    console.error('[DELETE_SALES] Erro ao deletar dados de vendas:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: 'Não foi possível excluir os dados de vendas. Tente novamente.',
        details: error.message
      },
      { status: 500 }
    )
  }
}