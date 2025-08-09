import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'
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

    const supabase = getSupabaseServerClient()
    
    console.log('[DELETE_CLIENTS] Verificando se a tabela profiles existe...')

    // Teste 2: Verificar se há clientes
    console.log('[DELETE_CLIENTS] Contando clientes...')
    const { count: totalClients, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer')
    
    if (countError) {
      console.error('[DELETE_CLIENTS] Erro ao contar clientes:', countError)
      return NextResponse.json({ 
        error: 'Erro ao contar clientes',
        details: countError.message
      }, { status: 500 })
    }

    console.log(`[DELETE_CLIENTS] Encontrados ${totalClients || 0} clientes`)

    if (!totalClients || totalClients === 0) {
      console.log('[DELETE_CLIENTS] Nenhum cliente encontrado para deletar')
      return NextResponse.json({ 
        success: true,
        deletedCount: 0,
        message: 'Nenhum cliente encontrado para deletar'
      })
    }

    // Buscar IDs dos clientes para deletar dados relacionados
    console.log('[DELETE_CLIENTS] Buscando IDs dos clientes...')
    const { data: customers, error: customersError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'customer')
    
    if (customersError) {
      console.error('[DELETE_CLIENTS] Erro ao buscar clientes:', customersError)
      return NextResponse.json({ 
        error: 'Erro ao buscar clientes',
        details: customersError.message
      }, { status: 500 })
    }

    const customerIds = customers?.map(c => c.id) || []
    
    // Deletar endereços dos clientes
    if (customerIds.length > 0) {
      console.log('[DELETE_CLIENTS] Deletando endereços dos clientes...')
      const { error: addressesError } = await supabase
        .from('customer_addresses')
        .delete()
        .in('user_id', customerIds)
      
      if (addressesError) {
        console.warn('[DELETE_CLIENTS] Erro ao deletar endereços (tabela pode não existir):', addressesError.message)
      }

      // Deletar cupons dos usuários
      console.log('[DELETE_CLIENTS] Deletando cupons dos usuários...')
      const { error: couponsError } = await supabase
        .from('user_coupons')
        .delete()
        .in('user_id', customerIds)
      
      if (couponsError) {
        console.warn('[DELETE_CLIENTS] Erro ao deletar cupons (tabela pode não existir):', couponsError.message)
      }
    }

    // Verificar se há pedidos associados aos clientes
    console.log('[DELETE_CLIENTS] Verificando pedidos associados...')
    const { count: totalOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('user_id', customerIds)
    
    if (ordersError) {
      console.warn('[DELETE_CLIENTS] Erro ao contar pedidos (pode não existir):', ordersError.message)
    }

    let message = ''

    if (totalOrders && totalOrders > 0) {
      // Se há pedidos, não deletar os clientes, apenas desativar
      console.log(`[DELETE_CLIENTS] ${totalOrders} pedidos encontrados, desativando clientes...`)
      
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
      console.log(`[DELETE_CLIENTS] ${message}`)
    } else {
      // Se não há pedidos, deletar completamente
      console.log('[DELETE_CLIENTS] Nenhum pedido encontrado, deletando clientes completamente...')
      
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('role', 'customer')
      
      if (deleteError) {
        throw new Error('Erro ao deletar clientes: ' + deleteError.message)
      }
      
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