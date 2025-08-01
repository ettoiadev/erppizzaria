import { NextRequest, NextResponse } from "next/server"
import { query } from '@/lib/postgres'

export async function GET(request: NextRequest) {
  try {
    console.log("[CUSTOMERS] Buscando clientes usando Supabase")
    
    // Buscar todos os clientes (usuários com role 'customer') usando Supabase
    const { data: customers, error: customersError } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, created_at, updated_at, role')
      .eq('role', 'customer')
      .order('created_at', { ascending: false })
    
    if (customersError) {
      console.error("[CUSTOMERS] Erro ao buscar clientes:", customersError)
      throw customersError
    }
    
    console.log(`[CUSTOMERS] Encontrados ${customers?.length || 0} clientes`)

    // Para cada cliente, buscar endereços e estatísticas de pedidos
    const customersWithDetails = await Promise.all(
      (customers || []).map(async (customer: any) => {
        try {
          // Buscar endereço principal do cliente usando Supabase
          const { data: addresses } = await supabase
            .from('customer_addresses')
            .select('street, number, neighborhood, city, state, complement, zip_code, label, is_default')
            .eq('user_id', customer.id)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(1)
          
          console.log(`[CUSTOMERS] Cliente ${customer.id} - Endereços encontrados: ${addresses?.length || 0}`)
          
          // Buscar estatísticas de pedidos usando Supabase
          const { data: orders } = await supabase
            .from('orders')
            .select('total, created_at')
            .eq('user_id', customer.id)
          
          // Calcular estatísticas no frontend (aplicar lógica COALESCE)
          const totalOrders = orders?.length || 0
          const totalSpent = orders?.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0) || 0
          const lastOrderAt = orders && orders.length > 0 ? 
            orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at : 
            null
          
          const address = addresses?.[0]
          
          // Determinar status baseado na atividade
          const now = new Date()
          const createdAt = new Date(customer.created_at)
          const lastOrderDate = lastOrderAt ? new Date(lastOrderAt) : createdAt
          
          // Usar a data mais recente entre criação da conta e último pedido
          const lastActivityDate = lastOrderDate > createdAt ? lastOrderDate : createdAt
          const daysSinceLastActivity = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))
          
          let status = 'inactive'
          
          if (totalOrders >= 20 || totalSpent >= 500) {
            status = 'vip'
          } else if (totalOrders > 0) {
            status = 'active'
          } else if (daysSinceLastActivity < 30) {
            // Cliente novo (menos de 30 dias) sem pedidos ainda é considerado ativo
            status = 'active'
          }
          
          console.log(`[CUSTOMERS] Cliente ${customer.full_name} - Dias desde última atividade: ${daysSinceLastActivity}, Status: ${status}`)
          
          // Construir endereço completo (aplicar lógica COALESCE no frontend)
          let fullAddress = 'Endereço não cadastrado'
          if (address && address.street) {
            const parts = [
              `${address.street}, ${address.number}`,
              address.complement ? `(${address.complement})` : '',
              address.neighborhood,
              `${address.city}/${address.state}`,
              address.zip_code ? `CEP: ${address.zip_code}` : ''
            ].filter(Boolean)
            
            fullAddress = parts.join(' - ')
          }
          
          console.log(`[CUSTOMERS] Cliente ${customer.full_name} - Telefone: ${customer.phone}, Endereço: ${fullAddress}`)

          return {
            id: customer.id,
            name: customer.full_name || 'Nome não informado',
            email: customer.email || 'Email não informado',
            phone: customer.phone || 'Telefone não informado',
            address: fullAddress,
            complement: address?.complement || '',
            street: address?.street || '',
            number: address?.number || '',
            neighborhood: address?.neighborhood || '',
            city: address?.city || '',
            state: address?.state || '',
            zip_code: address?.zip_code || '',
            createdAt: customer.created_at,
            lastOrderAt: lastOrderAt,
            totalOrders: totalOrders,
            totalSpent: totalSpent,
            status: status,
            favoriteItems: [] // Será implementado posteriormente se necessário
          }
        } catch (error) {
          console.warn(`[CUSTOMERS] Erro ao buscar detalhes do cliente ${customer.id}:`, error)
          return {
            id: customer.id,
            name: customer.full_name || 'Nome não informado',
            email: customer.email || 'Email não informado',
            phone: customer.phone || 'Telefone não informado',
            address: 'Endereço não cadastrado',
            complement: '',
            street: '',
            number: '',
            neighborhood: '',
            city: '',
            state: '',
            zip_code: '',
            createdAt: customer.created_at,
            lastOrderAt: null,
            totalOrders: 0,
            totalSpent: 0,
            status: 'inactive',
            favoriteItems: []
          }
        }
      })
    )

    console.log(`[CUSTOMERS] Retornando ${customersWithDetails.length} clientes com detalhes`)
    
    return NextResponse.json({
      customers: customersWithDetails,
      total: customersWithDetails.length
    })

  } catch (error: any) {
    console.error("[CUSTOMERS] Erro ao buscar clientes:", error)
    
    return NextResponse.json({
      error: "Erro interno do servidor",
      message: "Não foi possível carregar a lista de clientes",
      customers: [],
      total: 0
    }, { status: 500 })
  }
} 