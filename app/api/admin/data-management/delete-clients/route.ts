import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'
import { verifyAdmin } from '@/lib/auth'
import { frontendLogger } from '@/lib/frontend-logger'

export async function DELETE(request: NextRequest) {
  try {
    frontendLogger.info('Iniciando exclusão de todos os clientes')

    // Verificar autenticação admin
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    
    frontendLogger.info('Token recebido', { hasToken: !!token })
    
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

    frontendLogger.info('Admin verificado', { adminEmail: admin.email?.replace(/(.{2}).*(@.*)/, '$1***$2') })

    const supabase = getSupabaseServerClient()
    
    frontendLogger.info('Verificando se a tabela profiles existe')

    // Teste 2: Verificar se há clientes
    frontendLogger.info('Contando clientes')
    const { count: totalClients, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer')
    
    if (countError) {
      frontendLogger.error('Erro ao contar clientes', { error: countError.message, stack: countError.stack })
      return NextResponse.json({ 
        error: 'Erro ao contar clientes',
        details: countError.message
      }, { status: 500 })
    }

    frontendLogger.info('Clientes encontrados', { totalClients: totalClients || 0 })

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
    const { data: customers, error: customersError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'customer')
    
    if (customersError) {
      frontendLogger.error('Erro ao buscar clientes', { error: customersError.message, stack: customersError.stack })
      return NextResponse.json({ 
        error: 'Erro ao buscar clientes',
        details: customersError.message
      }, { status: 500 })
    }

    const customerIds = customers?.map(c => c.id) || []
    
    // Deletar endereços dos clientes
    if (customerIds.length > 0) {
      frontendLogger.info('Deletando endereços dos clientes')
      const { error: addressesError } = await supabase
        .from('customer_addresses')
        .delete()
        .in('user_id', customerIds)
      
      if (addressesError) {
        frontendLogger.warn('Erro ao deletar endereços (tabela pode não existir)', { error: addressesError.message })
      }

      // Deletar cupons dos usuários
      frontendLogger.info('Deletando cupons dos usuários')
      const { error: couponsError } = await supabase
        .from('user_coupons')
        .delete()
        .in('user_id', customerIds)
      
      if (couponsError) {
        frontendLogger.warn('Erro ao deletar cupons (tabela pode não existir)', { error: couponsError.message })
      }
    }

    // Verificar se há pedidos associados aos clientes
    frontendLogger.info('Verificando pedidos associados')
    const { count: totalOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('user_id', customerIds)
    
    if (ordersError) {
      frontendLogger.warn('Erro ao contar pedidos (pode não existir)', { error: ordersError.message })
    }

    let message = ''

    if (totalOrders && totalOrders > 0) {
      // Se há pedidos, não deletar os clientes, apenas desativar
      frontendLogger.info('Pedidos encontrados, desativando clientes', { totalOrders })
      
      const timestamp = Math.floor(Date.now() / 1000)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          active: false,
          updated_at: new Date().toISOString()
        })
        .eq('role', 'customer')
      
      if (updateError) {
        throw new Error('Erro ao desativar clientes: ' + updateError.message)
      }
      
      message = `${totalClients} clientes desativados (possuem pedidos associados)`
      frontendLogger.info('Clientes desativados', { message })
    } else {
      // Se não há pedidos, deletar completamente
      frontendLogger.info('Nenhum pedido encontrado, deletando clientes completamente')
      
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('role', 'customer')
      
      if (deleteError) {
        throw new Error('Erro ao deletar clientes: ' + deleteError.message)
      }
      
      message = `${totalClients} clientes deletados completamente`
      frontendLogger.info('Clientes deletados completamente', { message })
    }

    return NextResponse.json({ 
      success: true,
      deletedCount: totalClients,
      message
    })

  } catch (error: any) {
    frontendLogger.error('Erro ao deletar todos os clientes', { error: error.message, stack: error.stack })
    return NextResponse.json({ 
      error: 'Erro ao excluir todos os clientes',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}