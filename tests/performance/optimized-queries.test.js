// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')
const { performance } = require('perf_hooks')

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_KEY são obrigatórias')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Função para medir tempo de execução
function measureTime(label, fn) {
  return async (...args) => {
    const start = performance.now()
    const result = await fn(...args)
    const end = performance.now()
    console.log(`⏱️  ${label}: ${(end - start).toFixed(2)}ms`)
    return result
  }
}

// Teste das funções otimizadas
async function testOptimizedQueries() {
  console.log('🧪 Testando consultas otimizadas do Supabase...\n')

  try {
    // 1. Teste de listagem de pedidos otimizada
    console.log('1. Testando listOrdersOptimized...')
    const listOrdersOptimized = measureTime('listOrdersOptimized', async (options = {}) => {
      const { status, userId, limit = 10, offset = 0 } = options
      
      let query = supabase
        .from('orders')
        .select(`
          *,
          profiles!orders_user_id_fkey(full_name, email, phone),
          order_items(
            *,
            products(
              name,
              price,
              category_id,
              categories(name)
            )
          )
        `)
        .order('created_at', { ascending: false })
      
      if (status && status !== 'all') {
        query = query.eq('status', status)
      }
      
      if (userId) {
        query = query.eq('user_id', userId)
      }
      
      if (limit) {
        query = query.limit(limit)
      }
      
      if (offset) {
        query = query.range(offset, offset + limit - 1)
      }
      
      const { data: orders, error } = await query
      
      if (error) throw error
      
      return { orders: orders || [], statistics: { total: orders?.length || 0 } }
    })
    
    const ordersResult = await listOrdersOptimized({ limit: 5 })
    console.log(`✅ PASSOU: Encontrados ${ordersResult.orders.length} pedidos`)
    
    // 2. Teste de listagem de clientes otimizada
    console.log('\n2. Testando listCustomersOptimized...')
    const listCustomersOptimized = measureTime('listCustomersOptimized', async () => {
      // Buscar clientes com endereços
      const { data: customers, error: customersError } = await supabase
        .from('profiles')
        .select(`
          *,
          addresses(
            id,
            street,
            number,
            complement,
            neighborhood,
            city,
            state,
            zip_code,
            is_default
          )
        `)
        .eq('role', 'customer')
        .order('created_at', { ascending: false })
      
      if (customersError) throw customersError
      
      // Buscar estatísticas de pedidos para todos os clientes
      const { data: orderStats, error: ordersError } = await supabase
        .from('orders')
        .select('user_id, total, status, created_at')
      
      if (ordersError) throw ordersError
      
      // Processar dados em memória
      const customerMap = new Map()
      
      // Inicializar mapa de clientes
      customers?.forEach(customer => {
        customerMap.set(customer.id, {
          ...customer,
          mainAddress: customer.addresses?.find(addr => addr.is_main) || customer.addresses?.[0] || null,
          totalSpent: 0,
          totalOrders: 0,
          lastOrderDate: null,
          status: 'inactive'
        })
      })
      
      // Calcular estatísticas
      orderStats?.forEach(order => {
        const customer = customerMap.get(order.user_id)
        if (customer) {
          customer.totalSpent += order.total || 0
          customer.totalOrders += 1
          
          const orderDate = new Date(order.created_at)
          if (!customer.lastOrderDate || orderDate > customer.lastOrderDate) {
            customer.lastOrderDate = orderDate
          }
        }
      })
      
      // Determinar status do cliente
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      
      customerMap.forEach(customer => {
        if (customer.totalSpent >= 500) {
          customer.status = 'vip'
        } else if (customer.lastOrderDate && customer.lastOrderDate > thirtyDaysAgo) {
          customer.status = 'active'
        } else if (customer.lastOrderDate && customer.lastOrderDate > ninetyDaysAgo) {
          customer.status = 'regular'
        } else if (customer.lastOrderDate) {
          customer.status = 'churned'
        } else {
          customer.status = 'inactive'
        }
      })
      
      return Array.from(customerMap.values())
    })
    
    const customersResult = await listCustomersOptimized()
    console.log(`✅ PASSOU: Encontrados ${customersResult.length} clientes`)
    
    // 3. Teste de produtos ativos otimizados
    console.log('\n3. Testando getProductsActiveOptimized...')
    const getProductsActiveOptimized = measureTime('getProductsActiveOptimized', async () => {
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(
            id,
            name,
            description,
            sort_order
          )
        `)
        .eq('active', true)
        .order('name')
      
      if (error) throw error
      
      return products || []
    })
    
    const productsResult = await getProductsActiveOptimized()
    console.log(`✅ PASSOU: Encontrados ${productsResult.length} produtos ativos`)
    
    // 4. Teste de categorias otimizadas
    console.log('\n4. Testando getCategoriesOptimized...')
    const getCategoriesOptimized = measureTime('getCategoriesOptimized', async (includeInactive = false) => {
      let query = supabase
        .from('categories')
        .select('*')
        .order('sort_order')
      
      if (!includeInactive) {
        query = query.eq('active', true)
      }
      
      const { data: categories, error } = await query
      
      if (error) throw error
      
      return categories || []
    })
    
    const categoriesResult = await getCategoriesOptimized()
    console.log(`✅ PASSOU: Encontradas ${categoriesResult.length} categorias ativas`)
    
    console.log('\n🎉 Todos os testes de consultas otimizadas passaram!')
    
  } catch (error) {
    console.error('❌ Erro nos testes:', error.message)
    process.exit(1)
  }
}

// Executar testes
testOptimizedQueries()