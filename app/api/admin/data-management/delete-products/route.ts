import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/postgres'

export async function DELETE(request: NextRequest) {
  try {
    console.log('[DELETE_PRODUCTS] Iniciando exclusão de todos os produtos...')

    // Primeiro, contar quantos produtos serão deletados
    const countResult = await query(`SELECT COUNT(*) as count FROM products`)
    const totalProducts = parseInt(countResult.rows[0].count)

    if (totalProducts === 0) {
      console.log('[DELETE_PRODUCTS] Nenhum produto encontrado para deletar')
      return NextResponse.json({ 
        success: true,
        deletedCount: 0,
        message: 'Nenhum produto encontrado para deletar'
      })
    }

    // Verificar se há itens de pedidos associados aos produtos
    const orderItemsResult = await query(`
      SELECT COUNT(*) as count FROM order_items 
      WHERE product_id IN (SELECT id FROM products)
    `)
    const totalOrderItems = parseInt(orderItemsResult.rows[0].count)

    let message = ''

    if (totalOrderItems > 0) {
      // Se há itens de pedidos, não deletar os produtos, apenas desativar
      await query(`
        UPDATE products 
        SET available = false, updated_at = NOW()
        WHERE id IN (SELECT id FROM products)
      `)
      message = `${totalProducts} produtos desativados (possuem pedidos associados)`
      console.log(`[DELETE_PRODUCTS] ${message}`)
    } else {
      // Se não há itens de pedidos, deletar completamente
      await query(`DELETE FROM products`)
      message = `${totalProducts} produtos deletados completamente`
      console.log(`[DELETE_PRODUCTS] ${message}`)
    }

    return NextResponse.json({ 
      success: true,
      deletedCount: totalProducts,
      message
    })

  } catch (error) {
    console.error('[DELETE_PRODUCTS] Erro ao deletar todos os produtos:', error)
    return NextResponse.json({ 
      error: 'Erro ao excluir todos os produtos' 
    }, { status: 500 })
  }
}