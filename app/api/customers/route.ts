import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("[CUSTOMERS] Buscando clientes no PostgreSQL")
    
    // Buscar todos os clientes (usuários com role 'customer')
    const customersQuery = `
      SELECT 
        p.id,
        p.email,
        p.full_name as name,
        p.phone,
        p.created_at,
        p.updated_at,
        p.role
      FROM profiles p 
      WHERE p.role = 'customer'
      ORDER BY p.created_at DESC
    `
    
    const customersResult = await query(customersQuery)
    console.log(`[CUSTOMERS] Encontrados ${customersResult.rows.length} clientes`)

    // Para cada cliente, buscar endereços e estatísticas de pedidos
    const customersWithDetails = await Promise.all(
      customersResult.rows.map(async (customer: any) => {
        try {
          // Buscar endereço principal do cliente
          const addressQuery = `
            SELECT street, number, neighborhood, city, state, complement, zip_code, label, is_default
            FROM customer_addresses 
            WHERE user_id = $1 
            ORDER BY is_default DESC, created_at DESC 
            LIMIT 1
          `
          const addressResult = await query(addressQuery, [customer.id])
          console.log(`[CUSTOMERS] Cliente ${customer.id} - Endereços encontrados: ${addressResult.rows.length}`)
          
          // Buscar estatísticas de pedidos
          const ordersStatsQuery = `
            SELECT 
              COUNT(*) as total_orders,
              COALESCE(SUM(CAST(total AS DECIMAL)), 0) as total_spent,
              MAX(created_at) as last_order_at
            FROM orders 
            WHERE user_id = $1
          `
          const ordersStatsResult = await query(ordersStatsQuery, [customer.id])
          
          const stats = ordersStatsResult.rows[0] || { total_orders: 0, total_spent: 0, last_order_at: null }
          const address = addressResult.rows[0]
          
          // Determinar status baseado na atividade
          const totalOrders = parseInt(stats.total_orders) || 0
          const totalSpent = parseFloat(stats.total_spent) || 0
          
          // Calcular diferença de datas para determinar inatividade
          const now = new Date()
          const createdAt = new Date(customer.created_at)
          const lastOrderDate = stats.last_order_at ? new Date(stats.last_order_at) : createdAt
          
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
          
          console.log(`[CUSTOMERS] Cliente ${customer.name} - Dias desde última atividade: ${daysSinceLastActivity}, Status: ${status}`)
          
          // Construir endereço completo
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
          
          console.log(`[CUSTOMERS] Cliente ${customer.name} - Telefone: ${customer.phone}, Endereço: ${fullAddress}`)

          return {
            id: customer.id,
            name: customer.name || 'Nome não informado',
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
            lastOrderAt: stats.last_order_at,
            totalOrders: totalOrders,
            totalSpent: totalSpent,
            status: status,
            favoriteItems: [] // Será implementado posteriormente se necessário
          }
        } catch (error) {
          console.warn(`[CUSTOMERS] Erro ao buscar detalhes do cliente ${customer.id}:`, error)
          return {
            id: customer.id,
            name: customer.name || 'Nome não informado',
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