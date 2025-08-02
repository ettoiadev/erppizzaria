import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

export async function DELETE(request: NextRequest) {
  const client = await pool.connect()
  
  try {
    // Verificar se é um admin (simplificado para este exemplo)
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    // Iniciar transação para garantir integridade
    await client.query('BEGIN')

    let deletedOrderItems = 0
    let deletedOrders = 0

    try {
      // 1. Primeiro, deletar todos os itens de pedidos
      const orderItemsResult = await client.query('DELETE FROM order_items')
      deletedOrderItems = orderItemsResult.rowCount || 0

      // 2. Depois, deletar todos os pedidos
      const ordersResult = await client.query('DELETE FROM orders')
      deletedOrders = ordersResult.rowCount || 0

      // 3. Se existirem outras tabelas relacionadas a vendas/pagamentos, deletar aqui
      // Exemplo: payment_transactions, order_status_history, etc.
      
      // Commit da transação
      await client.query('COMMIT')

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
      await client.query('ROLLBACK')
      throw error
    }

  } catch (error) {
    console.error('Erro ao deletar dados de vendas:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: 'Não foi possível excluir os dados de vendas. Tente novamente.'
      },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}