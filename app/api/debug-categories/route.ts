import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    console.log('🔍 DEBUG: Iniciando diagnóstico de categorias...')
    
    // 1. Verificar estrutura da tabela
    console.log('1. Verificando estrutura da tabela categories...')
    const structure = await query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'categories' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `)
    
    console.log('Estrutura da tabela:', structure.rows)
    
    // 2. Verificar dados atuais
    console.log('2. Verificando todas as categorias...')
    const allCategories = await query('SELECT * FROM categories')
    console.log('Total de categorias no banco:', allCategories.rows.length)
    
    allCategories.rows.forEach(cat => {
      console.log(`- ${cat.name}: active=${cat.active}, id=${cat.id}`)
    })
    
    // 3. Testar categoria específica (Sobremesas)
    const sobremesasId = 'edd3f631-c717-4c54-8490-e9cc72fcd1f2'
    console.log('3. Verificando categoria Sobremesas...')
    const sobremesas = await query('SELECT * FROM categories WHERE id = $1', [sobremesasId])
    
    console.log('Categoria Sobremesas:', sobremesas.rows[0] || 'NÃO ENCONTRADA')
    
    // 4. Tentar update para false
    console.log('4. Testando UPDATE active = false...')
    const updateResult = await query(
      'UPDATE categories SET active = false WHERE id = $1 RETURNING *',
      [sobremesasId]
    )
    
    console.log('Resultado do UPDATE:', updateResult.rows[0] || 'NENHUMA LINHA AFETADA')
    
    // 5. Verificar após update
    console.log('5. Verificando após UPDATE...')
    const afterUpdate = await query('SELECT * FROM categories WHERE id = $1', [sobremesasId])
    console.log('Categoria após UPDATE:', afterUpdate.rows[0] || 'NÃO ENCONTRADA')
    
    // 6. Testar query com filtro active
    console.log('6. Testando query com filtro active = true...')
    const activeOnly = await query('SELECT id, name, active FROM categories WHERE active = true')
    console.log('Categorias ativas:', activeOnly.rows.length)
    
    return NextResponse.json({
      message: 'Debug concluído - verificar logs do servidor',
      structure: structure.rows,
      totalCategories: allCategories.rows.length,
      sobremesasFound: sobremesas.rows.length > 0,
      updateResult: updateResult.rows[0] || null,
      afterUpdate: afterUpdate.rows[0] || null,
      activeCategories: activeOnly.rows.length
    })
    
  } catch (error) {
    console.error('❌ Erro no debug:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 