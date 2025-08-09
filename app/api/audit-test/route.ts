import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'

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

  // Teste 1: Conexão com Supabase
  try {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase.from('profiles').select('id').limit(1)
    results.tests.push({
      name: 'Conexão Supabase',
      status: !error ? 'PASSED' : 'FAILED',
      message: !error ? 'OK' : 'Falha',
      error: error?.message || null
    })
    if (!error) results.summary.passed++
    else results.summary.failed++
  } catch (error: any) {
    results.tests.push({ name: 'Conexão Supabase', status: 'FAILED', message: 'Erro na conexão', error: error.message })
    results.summary.failed++
  }
  results.summary.total++

  // Teste 2: Buscar usuários
  try {
    const supabase = getSupabaseServerClient()
    const { data } = await supabase.from('profiles').select('id', { count: 'exact', head: true })
    const userCount = (data as any)?.length || 0
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
    const supabase = getSupabaseServerClient()
    const { data } = await supabase.from('products').select('id', { count: 'exact', head: true })
    const productCount = (data as any)?.length || 0
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
    const supabase = getSupabaseServerClient()
    const { data } = await supabase.from('categories').select('id', { count: 'exact', head: true })
    const categoryCount = (data as any)?.length || 0
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
    const supabase = getSupabaseServerClient()
    const { data } = await supabase.from('orders').select('id', { count: 'exact', head: true })
    const orderCount = (data as any)?.length || 0
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
    const supabase = getSupabaseServerClient()
    const { data: adminRows } = await supabase.from('profiles').select('id, email, full_name, role').eq('role', 'admin').limit(1)
    const hasAdmin = Array.isArray(adminRows) && adminRows.length > 0
    results.tests.push({
      name: 'Verificar admin',
      status: hasAdmin ? 'PASSED' : 'WARNING',
      message: hasAdmin 
        ? `Admin encontrado: ${adminRows?.[0]?.email}` 
        : 'Nenhum usuário admin encontrado',
      data: hasAdmin ? { admin: adminRows?.[0] } : null
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