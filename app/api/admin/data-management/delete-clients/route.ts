import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyAdmin } from '@/lib/auth'
import { frontendLogger } from '@/lib/frontend-logger'

export async function DELETE(request: NextRequest) {
  try {
    frontendLogger.info('Iniciando exclusão de todos os clientes')

    // Verificar autenticação admin
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    
    frontendLogger.info('Token recebido', 'api', { hasToken: !!token })
    
    if (!token) {
      frontendLogger.warn('Token de autorização não fornecido')
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    frontendLogger.info('Verificando admin')
    const admin = await verifyAdmin(token)
    
    if (!admin) {
      frontendLogger.warn('Usuário não é admin')
      return NextResponse.json({ error: 'Acesso negado - usuário não é admin' }, { status: 403 })
    }

    frontendLogger.info('Admin verificado', 'api', { adminEmail: admin.email?.replace(/(.{2}).*(@.*)/, '$1***$2') })

    frontendLogger.info('Verificando se a tabela profiles existe')

    // Teste 2: Verificar se há clientes
    frontendLogger.info('Contando clientes')
    const clientCountResult = await query(
      'SELECT COUNT(*) as count FROM profiles WHERE role = $1',
      ['customer']
    )
    const totalClients = parseInt(clientCountResult.rows[0]?.count || '0')

    frontendLogger.info('Total clients count retrieved', 'api', { totalClients: totalClients || 0 })

    if (!totalClients || totalClients === 0) {
      frontendLogger.info('Nenhum cliente encontrado para deletar')
      return NextResponse.json({ 
        success: true,
        deletedCount: 0,
        message: 'Nenhum cliente encontrado para deletar'
      })
    }

    // Buscar IDs dos clientes para deletar dados relacionados
    frontendLogger.info('Buscando IDs dos clientes')
    const customersResult = await query(
      'SELECT id FROM profiles WHERE role = $1',
      ['customer']
    )
    const customerIds = customersResult.rows.map((c: any) => c.id)
    
    // Deletar endereços dos clientes
    if (customerIds.length > 0) {
      frontendLogger.info('Deletando endereços dos clientes')
      try {
        await query(
          'DELETE FROM customer_addresses WHERE user_id = ANY($1)',
          [customerIds]
        )
      } catch (addressesError: any) {
        frontendLogger.warn('Erro ao deletar endereços (tabela pode não existir)', 'api', { error: addressesError.message })
      }

      // Deletar cupons dos usuários
      frontendLogger.info('Deletando cupons dos usuários')
      try {
        await query(
          'DELETE FROM user_coupons WHERE user_id = ANY($1)',
          [customerIds]
        )
      } catch (couponsError: any) {
        frontendLogger.warn('Erro ao deletar cupons (tabela pode não existir)', 'api', { error: couponsError.message })
      }
    }

    // Verificar se há pedidos associados aos clientes
    frontendLogger.info('Verificando pedidos associados')
    let totalOrders = 0
    try {
      const ordersResult = await query(
        'SELECT COUNT(*) as count FROM orders WHERE user_id = ANY($1)',
        [customerIds]
      )
      totalOrders = parseInt(ordersResult.rows[0]?.count || '0')
    } catch (ordersError: any) {
      frontendLogger.warn('Erro ao contar pedidos (pode não existir)', 'api', { error: ordersError.message })
    }

    let message = ''

    if (totalOrders && totalOrders > 0) {
      // Se há pedidos, não deletar os clientes, apenas desativar
      frontendLogger.info('Pedidos encontrados, desativando clientes', 'api', { totalOrders })
      
      await query(
        'UPDATE profiles SET active = false, updated_at = $1 WHERE role = $2',
        [new Date().toISOString(), 'customer']
      )
      
      message = `${totalClients} clientes desativados (possuem pedidos associados)`
      frontendLogger.info('Clientes desativados', 'api', { message })
    } else {
      // Se não há pedidos, deletar completamente
      frontendLogger.info('Nenhum pedido encontrado, deletando clientes completamente', 'api')
      
      await query(
        'DELETE FROM profiles WHERE role = $1',
        ['customer']
      )
      
      message = `${totalClients} clientes deletados completamente`
      frontendLogger.info('Clientes deletados completamente', 'api', { message })
    }

    return NextResponse.json({ 
      success: true,
      deletedCount: totalClients,
      message
    })

  } catch (error: any) {
    frontendLogger.logError('Erro ao deletar todos os clientes', { error: error.message }, error, 'api')
    return NextResponse.json({ 
      error: 'Erro ao excluir todos os clientes',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}