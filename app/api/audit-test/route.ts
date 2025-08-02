import { NextResponse } from 'next/server'
import { query, testConnection } from '@/lib/postgres'

export const dynamic = 'force-dynamic'

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: [] as any[],
    summary: {
      total: 0,
      passed: 0,
      failed: 0
    }
  }

  // Teste 1: Conexão com PostgreSQL
  try {
    const connectionTest = await testConnection()
    results.tests.push({
      name: 'Conexão PostgreSQL',
      status: connectionTest.success ? 'PASSED' : 'FAILED',
      message: connectionTest.message,
      error: connectionTest.error || null
    })
    if (connectionTest.success) results.summary.passed++
    else results.summary.failed++
  } catch (error: any) {
    results.tests.push({
      name: 'Conexão PostgreSQL',
      status: 'FAILED',
      message: 'Erro na conexão',
      error: error.message
    })
    results.summary.failed++
  }
  results.summary.total++

  // Teste 2: Buscar usuários
  try {
    const usersResult = await query('SELECT COUNT(*) as count FROM profiles LIMIT 1')
    const userCount = usersResult.rows[0]?.count || 0
    results.tests.push({
      name: 'Buscar usuários',
      status: 'PASSED',
      message: `${userCount} usuários encontrados`,
      data: { userCount }
    })
    results.summary.passed++
  } catch (error: any) {
    results.tests.push({
      name: 'Buscar usuários',
      status: 'FAILED',
      message: 'Erro ao buscar usuários',
      error: error.message
    })
    results.summary.failed++
  }
  results.summary.total++

  // Teste 3: Buscar produtos
  try {
    const productsResult = await query('SELECT COUNT(*) as count FROM products LIMIT 1')
    const productCount = productsResult.rows[0]?.count || 0
    results.tests.push({
      name: 'Buscar produtos',
      status: 'PASSED',
      message: `${productCount} produtos encontrados`,
      data: { productCount }
    })
    results.summary.passed++
  } catch (error: any) {
    results.tests.push({
      name: 'Buscar produtos',
      status: 'FAILED',
      message: 'Erro ao buscar produtos',
      error: error.message
    })
    results.summary.failed++
  }
  results.summary.total++

  // Teste 4: Buscar categorias
  try {
    const categoriesResult = await query('SELECT COUNT(*) as count FROM categories LIMIT 1')
    const categoryCount = categoriesResult.rows[0]?.count || 0
    results.tests.push({
      name: 'Buscar categorias',
      status: 'PASSED',
      message: `${categoryCount} categorias encontradas`,
      data: { categoryCount }
    })
    results.summary.passed++
  } catch (error: any) {
    results.tests.push({
      name: 'Buscar categorias',
      status: 'FAILED',
      message: 'Erro ao buscar categorias',
      error: error.message
    })
    results.summary.failed++
  }
  results.summary.total++

  // Teste 5: Buscar pedidos
  try {
    const ordersResult = await query('SELECT COUNT(*) as count FROM orders LIMIT 1')
    const orderCount = ordersResult.rows[0]?.count || 0
    results.tests.push({
      name: 'Buscar pedidos',
      status: 'PASSED',
      message: `${orderCount} pedidos encontrados`,
      data: { orderCount }
    })
    results.summary.passed++
  } catch (error: any) {
    results.tests.push({
      name: 'Buscar pedidos',
      status: 'FAILED',
      message: 'Erro ao buscar pedidos',
      error: error.message
    })
    results.summary.failed++
  }
  results.summary.total++

  // Teste 6: Testar autenticação (buscar admin)
  try {
    const adminResult = await query(
      'SELECT id, email, full_name, role FROM profiles WHERE role = $1 LIMIT 1',
      ['admin']
    )
    const hasAdmin = adminResult.rows.length > 0
    results.tests.push({
      name: 'Verificar admin',
      status: hasAdmin ? 'PASSED' : 'WARNING',
      message: hasAdmin 
        ? `Admin encontrado: ${adminResult.rows[0].email}` 
        : 'Nenhum usuário admin encontrado',
      data: hasAdmin ? { admin: adminResult.rows[0] } : null
    })
    if (hasAdmin) results.summary.passed++
    else results.summary.failed++
  } catch (error: any) {
    results.tests.push({
      name: 'Verificar admin',
      status: 'FAILED',
      message: 'Erro ao verificar admin',
      error: error.message
    })
    results.summary.failed++
  }
  results.summary.total++

  return NextResponse.json({
    success: results.summary.failed === 0,
    message: `Auditoria completa: ${results.summary.passed}/${results.summary.total} testes passaram`,
    results
  })
}