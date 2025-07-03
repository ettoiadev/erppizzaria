import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET handler para buscar todas as categorias
export async function GET() {
  try {
    // Verificar se a tabela categories existe e quais campos estão disponíveis
    let hasActiveField = false
    let hasSortOrderField = false
    
    try {
      const tableInfo = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'categories' AND table_schema = 'public'
      `)
      
      const columns = tableInfo.rows.map(row => row.column_name)
      hasActiveField = columns.includes('active')
      hasSortOrderField = columns.includes('sort_order')
      
      console.log('🔍 Campos disponíveis na tabela categories:', columns)
      console.log('🔍 hasActiveField:', hasActiveField, 'hasSortOrderField:', hasSortOrderField)
    } catch (err) {
      console.log('Erro ao verificar estrutura da tabela:', err.message)
    }

    // Construir query dinamicamente baseada nos campos disponíveis
    let selectQuery = 'SELECT id, name'
    
    // Adicionar campos opcionais se existirem
    selectQuery += ', COALESCE(description, \'\') as description'
    selectQuery += ', COALESCE(image, \'\') as image'
    
    if (hasSortOrderField) {
      selectQuery += ', COALESCE(sort_order, 0) as sort_order'
    }
    
    if (hasActiveField) {
      selectQuery += ', active'
    }
    
    selectQuery += ' FROM categories'
    
    // Adicionar WHERE clause para filtrar apenas categorias ativas
    if (hasActiveField) {
      selectQuery += ' WHERE (active IS NULL OR active = true)'
    }
    
    // Adicionar ORDER BY
    if (hasSortOrderField) {
      selectQuery += ' ORDER BY sort_order ASC, name ASC'
    } else {
      selectQuery += ' ORDER BY name ASC'
    }

    console.log('🔍 Query SQL construída:', selectQuery)

    const result = await query(selectQuery)
    
    console.log('🔍 Resultado da query - total de linhas:', result.rows.length)
    result.rows.forEach(row => {
      console.log(`🔍 Categoria: ${row.name}, active: ${row.active}`)
    })

    // Normalizar os dados para garantir consistência
    const normalizedCategories = result.rows.map(category => ({
      id: category.id,
      name: category.name || '',
      description: category.description || '',
      image: category.image || '',
      sort_order: category.sort_order || 0,
      active: hasActiveField ? (category.active !== false) : true
    }))

    console.log('🔍 Categorias normalizadas - total:', normalizedCategories.length)
    normalizedCategories.forEach(cat => {
      console.log(`🔍 Normalizada: ${cat.name}, active: ${cat.active}`)
    })

    return NextResponse.json({ categories: normalizedCategories })
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    
    // Fallback: tentar query mais simples se a principal falhar
    try {
      console.log('Tentando fallback com query simples...')
      const fallbackResult = await query('SELECT id, name FROM categories')
      
      const simplifiedCategories = fallbackResult.rows.map(category => ({
        id: category.id,
        name: category.name || '',
        description: '',
        image: '',
        sort_order: 0,
        active: true
      }))
      
      return NextResponse.json({ categories: simplifiedCategories })
    } catch (fallbackError) {
      console.error('Erro mesmo no fallback:', fallbackError)
      return NextResponse.json(
        { error: 'Erro interno ao buscar categorias' },
        { status: 500 }
      )
    }
  }
}

// POST handler para criar uma nova categoria
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, image, sort_order } = body

    // Validar dados
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Nome da categoria é obrigatório" },
        { status: 400 }
      )
    }

    // Verificar se campo sort_order existe
    let hasSortOrderField = false
    try {
      const tableInfo = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'categories' AND table_schema = 'public' AND column_name = 'sort_order'
      `)
      hasSortOrderField = tableInfo.rows.length > 0
    } catch (err) {
      console.log('Erro ao verificar campo sort_order:', err.message)
    }

    let insertQuery = 'INSERT INTO categories (name'
    let values = [name]
    let placeholders = '$1'
    let valueIndex = 2

    if (description) {
      insertQuery += ', description'
      placeholders += `, $${valueIndex}`
      values.push(description)
      valueIndex++
    }

    if (image) {
      insertQuery += ', image'
      placeholders += `, $${valueIndex}`
      values.push(image)
      valueIndex++
    }

    if (hasSortOrderField && sort_order !== undefined) {
      insertQuery += ', sort_order'
      placeholders += `, $${valueIndex}`
      values.push(sort_order)
      valueIndex++
    }

    insertQuery += `) VALUES (${placeholders}) RETURNING *`

    const result = await query(insertQuery, values)
    
    // Normalizar resposta para manter consistência
    const category = result.rows[0]
    const normalizedCategory = {
      id: category.id,
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      sort_order: category.sort_order || 0,
      active: category.active !== false
    }

    return NextResponse.json(normalizedCategory)
  } catch (error) {
    console.error('Erro ao criar categoria:', error)
    return NextResponse.json(
      { error: 'Erro interno ao criar categoria' },
      { status: 500 }
    )
  }
}

// PUT handler para atualizar ordem das categorias
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { categoryOrders } = body

    if (!Array.isArray(categoryOrders)) {
      return NextResponse.json(
        { error: 'categoryOrders deve ser um array' },
        { status: 400 }
      )
    }

    // Verificar se campo sort_order existe antes de tentar atualizar
    try {
      const tableInfo = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'categories' AND table_schema = 'public' AND column_name = 'sort_order'
      `)
      
      if (tableInfo.rows.length === 0) {
        return NextResponse.json(
          { error: 'Campo sort_order não existe na tabela. Execute a migração do banco primeiro.' },
          { status: 400 }
        )
      }
    } catch (err) {
      return NextResponse.json(
        { error: 'Erro ao verificar estrutura da tabela' },
        { status: 500 }
      )
    }

    // Atualizar ordem de cada categoria
    for (const { id, sort_order } of categoryOrders) {
      await query(
        'UPDATE categories SET sort_order = $1 WHERE id = $2',
        [sort_order, id]
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar ordem das categorias:', error)
    return NextResponse.json(
      { error: 'Erro interno ao atualizar ordem das categorias' },
      { status: 500 }
    )
  }
}
