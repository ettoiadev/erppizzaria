import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/postgres'

export async function DELETE(request: NextRequest) {
  try {
    console.log('[DELETE_CLIENTS] Iniciando exclusão de todos os clientes...')

    // Primeiro, contar quantos clientes serão deletados
    const countResult = await query(`
      SELECT COUNT(*) as count FROM profiles WHERE role = 'customer'
    `)
    const totalClients = parseInt(countResult.rows[0].count)

    if (totalClients === 0) {
      console.log('[DELETE_CLIENTS] Nenhum cliente encontrado para deletar')
      return NextResponse.json({ 
        success: true,
        deletedCount: 0,
        message: 'Nenhum cliente encontrado para deletar'
      })
    }

    // Deletar endereços dos clientes primeiro (por causa da foreign key)
    await query(`
      DELETE FROM customer_addresses 
      WHERE user_id IN (SELECT id FROM profiles WHERE role = 'customer')
    `)

    // Deletar cupons dos usuários
    await query(`
      DELETE FROM user_coupons 
      WHERE user_id IN (SELECT id FROM profiles WHERE role = 'customer')
    `)

    // Verificar se há pedidos associados aos clientes
    const ordersResult = await query(`
      SELECT COUNT(*) as count FROM orders 
      WHERE user_id IN (SELECT id FROM profiles WHERE role = 'customer')
    `)
    const totalOrders = parseInt(ordersResult.rows[0].count)

    let message = ''

    if (totalOrders > 0) {
      // Se há pedidos, não deletar os clientes, apenas desativar
      await query(`
        UPDATE profiles 
        SET active = false, email = CONCAT(email, '_deleted_', EXTRACT(epoch FROM NOW())), updated_at = NOW()
        WHERE role = 'customer'
      `)
      message = `${totalClients} clientes desativados (possuem pedidos associados)`
      console.log(`[DELETE_CLIENTS] ${message}`)
    } else {
      // Se não há pedidos, deletar completamente
      await query(`DELETE FROM profiles WHERE role = 'customer'`)
      message = `${totalClients} clientes deletados completamente`
      console.log(`[DELETE_CLIENTS] ${message}`)
    }

    return NextResponse.json({ 
      success: true,
      deletedCount: totalClients,
      message
    })

  } catch (error) {
    console.error('[DELETE_CLIENTS] Erro ao deletar todos os clientes:', error)
    return NextResponse.json({ 
      error: 'Erro ao excluir todos os clientes' 
    }, { status: 500 })
  }
}