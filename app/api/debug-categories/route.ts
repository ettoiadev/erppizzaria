import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔍 DEBUG: Iniciando diagnóstico de categorias...')
    
    // 1. Verificar estrutura da tabela
    console.log('1. Verificando estrutura da tabela categories...')
    const supabase = getSupabaseServerClient()
    const { data: structure, error: structErr } = await supabase
      .from('categories')
      .select('*')
      .limit(1)
    if (structErr) throw structErr
    console.log('Estrutura (amostra):', structure)
    
    // 2. Verificar dados atuais
    console.log('2. Verificando todas as categorias...')
    const { data: allCategories } = await supabase.from('categories').select('*')
    console.log('Total de categorias no banco:', (allCategories || []).length)
    
    ;(allCategories || []).forEach(cat => {
      console.log(`- ${cat.name}: active=${cat.active}, id=${cat.id}`)
    })
    
    // 3. Testar categoria específica (Sobremesas)
    const sobremesasId = 'edd3f631-c717-4c54-8490-e9cc72fcd1f2'
    console.log('3. Verificando categoria Sobremesas...')
    const { data: sobremesas } = await supabase.from('categories').select('*').eq('id', sobremesasId).maybeSingle()
    console.log('Categoria Sobremesas:', sobremesas || 'NÃO ENCONTRADA')
    
    // 4. Tentar update para false
    console.log('4. Testando UPDATE active = false...')
    const { data: updateResult } = await supabase
      .from('categories')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', sobremesasId)
      .select('*')
      .maybeSingle()
    console.log('Resultado do UPDATE:', updateResult || 'NENHUMA LINHA AFETADA')
    
    // 5. Verificar após update
    console.log('5. Verificando após UPDATE...')
    const { data: afterUpdate } = await supabase.from('categories').select('*').eq('id', sobremesasId).maybeSingle()
    console.log('Categoria após UPDATE:', afterUpdate || 'NÃO ENCONTRADA')
    
    // 6. Testar query com filtro active
    console.log('6. Testando query com filtro active = true...')
    const { data: activeOnly } = await supabase.from('categories').select('id, name, active').eq('active', true)
    console.log('Categorias ativas:', (activeOnly || []).length)
    
    return NextResponse.json({
      message: 'Debug concluído - verificar logs do servidor',
      structure: structure,
      totalCategories: (allCategories || []).length,
      sobremesasFound: !!sobremesas,
      updateResult: updateResult || null,
      afterUpdate: afterUpdate || null,
      activeCategories: (activeOnly || []).length
    })
    
  } catch (error) {
    console.error('❌ Erro no debug:', error)
    const message = (error as any)?.message || 'Erro inesperado'
    return NextResponse.json({ error: message }, { status: 500 })
  }
} 