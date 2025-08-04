import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/postgres'
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

    // Iniciar transação para garantir integridade
    await query('BEGIN')

    let deletedOrderItems = 0
    let deletedOrders = 0

    try {
      // 1. Primeiro, contar itens de pedidos
      const orderItemsCountResult = await query('SELECT COUNT(*) as count FROM order_items')
      const totalOrderItems = parseInt(orderItemsCountResult.rows[0].count)
      
      // 2. Contar pedidos
      const ordersCountResult = await query('SELECT COUNT(*) as count FROM orders')
      const totalOrders = parseInt(ordersCountResult.rows[0].count)

      console.log(`[DELETE_SALES] Encontrados ${totalOrderItems} itens de pedidos e ${totalOrders} pedidos para deletar`)

      // 3. Deletar todos os itens de pedidos
      console.log('[DELETE_SALES] Deletando itens de pedidos...')
      const orderItemsResult = await query('DELETE FROM order_items')
      deletedOrderItems = orderItemsResult.rowCount || 0

      // 4. Deletar todos os pedidos
      console.log('[DELETE_SALES] Deletando pedidos...')
      const ordersResult = await query('DELETE FROM orders')
      deletedOrders = ordersResult.rowCount || 0

      // 5. Se existirem outras tabelas relacionadas a vendas/pagamentos, deletar aqui
      // Exemplo: payment_transactions, order_status_history, etc.
      
      // Commit da transação
      await query('COMMIT')

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
      // Rollback em caso de erro
      console.error('[DELETE_SALES] Erro durante transação, fazendo rollback:', error)
      await query('ROLLBACK')
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