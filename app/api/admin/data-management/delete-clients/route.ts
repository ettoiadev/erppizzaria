import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/postgres'
import { verifyAdmin } from '@/lib/auth'

export async function DELETE(request: NextRequest) {
  try {
    console.log('[DELETE_CLIENTS] Iniciando exclusão de todos os clientes...')

    // Verificar autenticação admin
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    
    console.log('[DELETE_CLIENTS] Token recebido:', token ? 'SIM' : 'NÃO')
    
    if (!token) {
      console.log('[DELETE_CLIENTS] Token de autorização não fornecido')
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    console.log('[DELETE_CLIENTS] Verificando admin...')
    const admin = await verifyAdmin(token)
    
    if (!admin) {
      console.log('[DELETE_CLIENTS] Usuário não é admin')
      return NextResponse.json({ error: 'Acesso negado - usuário não é admin' }, { status: 403 })
    }

    console.log('[DELETE_CLIENTS] Admin verificado:', admin.email)

    // Teste 1: Verificar se a tabela profiles existe
    console.log('[DELETE_CLIENTS] Verificando se a tabela profiles existe...')
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'profiles'
      ) as exists
    `)
    
    if (!tableExists.rows[0].exists) {
      console.log('[DELETE_CLIENTS] Tabela profiles não existe')
      return NextResponse.json({ 
        error: 'Tabela profiles não existe',
        message: 'A tabela de perfis não foi encontrada no banco de dados'
      }, { status: 500 })
    }

    console.log('[DELETE_CLIENTS] Tabela profiles existe')

    // Teste 2: Verificar se há clientes
    console.log('[DELETE_CLIENTS] Contando clientes...')
    const countResult = await query(`
      SELECT COUNT(*) as count FROM profiles WHERE role = 'customer'
    `)
    const totalClients = parseInt(countResult.rows[0].count)

    console.log(`[DELETE_CLIENTS] Encontrados ${totalClients} clientes`)

    if (totalClients === 0) {
      console.log('[DELETE_CLIENTS] Nenhum cliente encontrado para deletar')
      return NextResponse.json({ 
        success: true,
        deletedCount: 0,
        message: 'Nenhum cliente encontrado para deletar'
      })
    }

    // Teste 3: Verificar se as tabelas relacionadas existem
    console.log('[DELETE_CLIENTS] Verificando tabelas relacionadas...')
    
    const customerAddressesExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'customer_addresses'
      ) as exists
    `)
    
    const userCouponsExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_coupons'
      ) as exists
    `)

    console.log('[DELETE_CLIENTS] customer_addresses existe:', customerAddressesExists.rows[0].exists)
    console.log('[DELETE_CLIENTS] user_coupons existe:', userCouponsExists.rows[0].exists)

    // Deletar endereços dos clientes se a tabela existir
    if (customerAddressesExists.rows[0].exists) {
      console.log('[DELETE_CLIENTS] Deletando endereços dos clientes...')
      await query(`
        DELETE FROM customer_addresses 
        WHERE user_id IN (SELECT id FROM profiles WHERE role = 'customer')
      `)
    }

    // Deletar cupons dos usuários se a tabela existir
    if (userCouponsExists.rows[0].exists) {
      console.log('[DELETE_CLIENTS] Deletando cupons dos usuários...')
      await query(`
        DELETE FROM user_coupons 
        WHERE user_id IN (SELECT id FROM profiles WHERE role = 'customer')
      `)
    }

    // Verificar se há pedidos associados aos clientes
    console.log('[DELETE_CLIENTS] Verificando pedidos associados...')
    const ordersResult = await query(`
      SELECT COUNT(*) as count FROM orders 
      WHERE user_id IN (SELECT id FROM profiles WHERE role = 'customer')
    `)
    const totalOrders = parseInt(ordersResult.rows[0].count)

    let message = ''

    if (totalOrders > 0) {
      // Se há pedidos, não deletar os clientes, apenas desativar
      console.log(`[DELETE_CLIENTS] ${totalOrders} pedidos encontrados, desativando clientes...`)
      await query(`
        UPDATE profiles 
        SET active = false, email = CONCAT(email, '_deleted_', EXTRACT(epoch FROM NOW())), updated_at = NOW()
        WHERE role = 'customer'
      `)
      message = `${totalClients} clientes desativados (possuem pedidos associados)`
      console.log(`[DELETE_CLIENTS] ${message}`)
    } else {
      // Se não há pedidos, deletar completamente
      console.log('[DELETE_CLIENTS] Nenhum pedido encontrado, deletando clientes completamente...')
      await query(`DELETE FROM profiles WHERE role = 'customer'`)
      message = `${totalClients} clientes deletados completamente`
      console.log(`[DELETE_CLIENTS] ${message}`)
    }

    return NextResponse.json({ 
      success: true,
      deletedCount: totalClients,
      message
    })

  } catch (error: any) {
    console.error('[DELETE_CLIENTS] Erro ao deletar todos os clientes:', error)
    console.error('[DELETE_CLIENTS] Stack trace:', error.stack)
    return NextResponse.json({ 
      error: 'Erro ao excluir todos os clientes',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}