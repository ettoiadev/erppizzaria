import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyAdmin } from '@/lib/auth'
import { frontendLogger } from '@/lib/frontend-logger'

export async function DELETE(request: NextRequest) {
  try {
    frontendLogger.info('Iniciando exclusão de todos os dados de vendas')

    // Verificar autenticação admin
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    
    if (!token) {
      frontendLogger.info('Token de autorização não fornecido')
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    const admin = await verifyAdmin(token)
    
    if (!admin) {
      frontendLogger.info('Usuário não é admin')
      return NextResponse.json({ error: 'Acesso negado - usuário não é admin' }, { status: 403 })
    }

    frontendLogger.info('Autenticação admin verificada, prosseguindo com exclusão de vendas')

    let deletedOrderItems = 0
    let deletedOrders = 0

    try {
      // 1. Primeiro, contar itens de pedidos
      const oiResult = await query('SELECT COUNT(*) as count FROM order_items')
      const totalOrderItems = parseInt(oiResult.rows[0]?.count || '0')
      
      // 2. Contar pedidos
      const ordResult = await query('SELECT COUNT(*) as count FROM orders')
      const totalOrders = parseInt(ordResult.rows[0]?.count || '0')

      frontendLogger.info('Encontrados itens e pedidos para deletar', 'api', { totalOrderItems, totalOrders })

      // 3. Deletar todos os itens de pedidos
      frontendLogger.info('Deletando itens de pedidos', 'api')
      await query('DELETE FROM order_items')
      deletedOrderItems = totalOrderItems

      // 4. Deletar todos os pedidos
      frontendLogger.info('Deletando pedidos')
      await query('DELETE FROM orders')
      deletedOrders = totalOrders

      // 5. Se existirem outras tabelas relacionadas a vendas/pagamentos, deletar aqui
      // Exemplo: payment_transactions, order_status_history, etc.
      
      // Sem transação: operações simples e idempotentes

      frontendLogger.info('Exclusão de vendas concluída', 'api', { deletedOrderItems, deletedOrders })

      return NextResponse.json({
        success: true,
        message: 'Todos os dados de vendas foram excluídos com sucesso',
        details: {
          deletedOrders,
          deletedOrderItems,
          totalDeleted: deletedOrders + deletedOrderItems
        }
      })

    } catch (error: any) {
      frontendLogger.logError('Erro durante exclusão de vendas', { error: error.message }, error, 'api')
      throw error
    }

  } catch (error: any) {
    frontendLogger.logError('Erro ao deletar dados de vendas', { error: error.message }, error, 'api')
    
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