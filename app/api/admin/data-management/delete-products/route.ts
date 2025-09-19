import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyAdmin } from '@/lib/auth'
import { frontendLogger } from '@/lib/frontend-logger'

export async function DELETE(request: NextRequest) {
  try {
    frontendLogger.info('[DELETE_PRODUCTS] Iniciando exclusão de todos os produtos...')

    // Verificar autenticação admin
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    
    if (!token) {
      frontendLogger.warn('[DELETE_PRODUCTS] Token de autorização não fornecido')
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    const admin = await verifyAdmin(token)
    
    if (!admin) {
      frontendLogger.warn('[DELETE_PRODUCTS] Usuário não é admin')
      return NextResponse.json({ error: 'Acesso negado - usuário não é admin' }, { status: 403 })
    }

    frontendLogger.info('[DELETE_PRODUCTS] Autenticação admin verificada, prosseguindo...')

    const prodCountResult = await query('SELECT COUNT(*) as count FROM products')
    const totalProducts = parseInt(prodCountResult.rows[0]?.count || '0')

    if (totalProducts === 0) {
      frontendLogger.info('[DELETE_PRODUCTS] Nenhum produto encontrado para deletar')
      return NextResponse.json({ 
        success: true,
        deletedCount: 0,
        message: 'Nenhum produto encontrado para deletar'
      })
    }

    frontendLogger.info(`[DELETE_PRODUCTS] Encontrados ${totalProducts} produtos para processar`)

    // Verificar se há itens de pedidos associados aos produtos
    frontendLogger.info('[DELETE_PRODUCTS] Verificando itens de pedidos associados...')
    const orderItemsResult = await query('SELECT COUNT(*) as count FROM order_items')
    const totalOrderItems = parseInt(orderItemsResult.rows[0]?.count || '0')

    let message = ''

    if (totalOrderItems > 0) {
      // Se há itens de pedidos, não deletar os produtos, apenas desativar
      frontendLogger.info(`[DELETE_PRODUCTS] ${totalOrderItems} itens de pedidos encontrados, desativando produtos...`)
      await query('UPDATE products SET available = false, updated_at = $1 WHERE id != $2', [new Date().toISOString(), '00000000-0000-0000-0000-000000000000'])
      message = `${totalProducts} produtos desativados (possuem pedidos associados)`
      frontendLogger.info(`[DELETE_PRODUCTS] ${message}`)
    } else {
      // Se não há itens de pedidos, deletar completamente
      frontendLogger.info('[DELETE_PRODUCTS] Nenhum item de pedido encontrado, deletando produtos completamente...')
      await query('DELETE FROM products WHERE id != $1', ['00000000-0000-0000-0000-000000000000'])
      message = `${totalProducts} produtos deletados completamente`
      frontendLogger.info(`[DELETE_PRODUCTS] ${message}`)
    }

    return NextResponse.json({ 
      success: true,
      deletedCount: totalProducts,
      message
    })

  } catch (error: any) {
    frontendLogger.logError('[DELETE_PRODUCTS] Erro ao deletar todos os produtos:', {
      message: error.message,
      stack: error.stack
    }, error, 'api')
    return NextResponse.json({ 
      error: 'Erro ao excluir todos os produtos',
      details: error.message 
    }, { status: 500 })
  }
}