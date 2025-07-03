import { NextResponse } from 'next/server'
import { 
  testConnection, 
  getUserByEmail, 
  getProducts, 
  getCategories, 
  getAdminSettings,
  supabase 
} from '@/lib/supabase-integration'

export const dynamic = 'force-dynamic'

export async function GET() {
  const results: {
    timestamp: string
    environment: string | undefined
    tests: Record<string, any>
    summary?: any
    error?: any
  } = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    tests: {}
  }

  try {
    console.log('🧪 === TESTE COMPLETO SUPABASE ===')

    // 1. Teste de conexão básica
    console.log('1️⃣ Testando conexão básica...')
    results.tests.connection = await testConnection()

    // 2. Teste de estrutura de tabelas
    console.log('2️⃣ Verificando estrutura das tabelas...')
    try {
      const { data: tables, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', [
          'profiles', 'categories', 'products', 'orders', 
          'order_items', 'drivers', 'customer_addresses', 
          'admin_settings', 'about_content', 'contact_messages'
        ])

      if (error) throw error

      results.tests.tables = {
        success: true,
        found: tables?.map(t => t.table_name) || [],
        expected: [
          'profiles', 'categories', 'products', 'orders', 
          'order_items', 'drivers', 'customer_addresses', 
          'admin_settings', 'about_content', 'contact_messages'
        ]
      }
    } catch (error: any) {
      results.tests.tables = {
        success: false,
        error: error.message
      }
    }

    // 3. Teste de usuário admin
    console.log('3️⃣ Verificando usuário admin...')
    try {
      const adminUser = await getUserByEmail('admin@williamdiskpizza.com')
      results.tests.admin_user = {
        success: !!adminUser,
        exists: !!adminUser,
        details: adminUser ? {
          id: adminUser.id,
          email: adminUser.email,
          role: adminUser.role,
          has_password: !!adminUser.password_hash
        } : null
      }
    } catch (error: any) {
      results.tests.admin_user = {
        success: false,
        error: error.message
      }
    }

    // 4. Teste de categorias
    console.log('4️⃣ Testando categorias...')
    try {
      const categories = await getCategories()
      results.tests.categories = {
        success: true,
        count: categories.length,
        sample: categories.slice(0, 3).map(c => ({ id: c.id, name: c.name }))
      }
    } catch (error: any) {
      results.tests.categories = {
        success: false,
        error: error.message
      }
    }

    // 5. Teste de produtos
    console.log('5️⃣ Testando produtos...')
    try {
      const products = await getProducts()
      results.tests.products = {
        success: true,
        count: products.length,
        sample: products.slice(0, 3).map(p => ({ 
          id: p.id, 
          name: p.name, 
          price: p.price,
          category_name: p.category_name 
        }))
      }
    } catch (error: any) {
      results.tests.products = {
        success: false,
        error: error.message
      }
    }

    // 6. Teste de configurações
    console.log('6️⃣ Testando configurações administrativas...')
    try {
      const settings = await getAdminSettings()
      results.tests.settings = {
        success: true,
        count: Object.keys(settings).length,
        keys: Object.keys(settings)
      }
    } catch (error: any) {
      results.tests.settings = {
        success: false,
        error: error.message
      }
    }

    // 7. Teste de contagem geral
    console.log('7️⃣ Contagens gerais...')
    try {
      const counts = {}
      
      const { count: profilesCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })

      results.tests.counts = {
        success: true,
        profiles: profilesCount || 0,
        orders: ordersCount || 0
      }
    } catch (error: any) {
      results.tests.counts = {
        success: false,
        error: error.message
      }
    }

    // 8. Resumo geral
    const successfulTests = Object.values(results.tests).filter(t => t.success).length
    const totalTests = Object.keys(results.tests).length

    results.summary = {
      total_tests: totalTests,
      successful_tests: successfulTests,
      failed_tests: totalTests - successfulTests,
      success_rate: Math.round((successfulTests / totalTests) * 100),
      overall_status: successfulTests === totalTests ? 'HEALTHY' : 'ISSUES_DETECTED'
    }

    console.log('✅ Teste completo finalizado:', results.summary)

    return NextResponse.json(results, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

  } catch (error: any) {
    console.error('❌ Erro no teste Supabase:', error)
    
    return NextResponse.json({
      ...results,
      error: {
        message: error.message,
        stack: error.stack
      },
      summary: {
        overall_status: 'CRITICAL_ERROR'
      }
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}

export async function POST() {
  return NextResponse.json({
    message: 'Use GET para executar os testes Supabase',
    timestamp: new Date().toISOString()
  })
} 