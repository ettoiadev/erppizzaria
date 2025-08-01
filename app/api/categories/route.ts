import { NextResponse } from 'next/server'
import { getCategories } from '@/lib/db-postgres'
import { query } from '@/lib/postgres'

// GET handler para buscar todas as categorias
export async function GET() {
  try {
    console.log('🔍 Buscando categorias usando PostgreSQL...')

    // Buscar categorias usando PostgreSQL
    const categories = await getCategories(true) // true = incluir inativas também

    console.log('🔍 Resultado da query - total de linhas:', categories?.length || 0)
    
    // Normalizar os dados para garantir consistência
    const normalizedCategories = (categories || []).map(category => ({
      id: category.id,
      name: category.name || '',
      description: category.description || '',
      image: category.image || '',
      sort_order: category.sort_order || 0,
      active: category.active !== false
    }))

    console.log('🔍 Categorias normalizadas - total:', normalizedCategories.length)
    normalizedCategories.forEach(cat => {
      console.log(`🔍 Normalizada: ${cat.name}, active: ${cat.active}`)
    })

    return NextResponse.json({ categories: normalizedCategories })
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    return NextResponse.json(
      { error: 'Erro interno ao buscar categorias' },
      { status: 500 }
    )
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

    // Inserir categoria usando PostgreSQL
    const result = await query(
      `INSERT INTO public.categories (name, description, image, sort_order, active) 
       VALUES ($1, $2, $3, $4, true) 
       RETURNING *`,
      [
        name.trim(),
        description || null,
        image || null,
        sort_order || 0
      ]
    )

    if (result.rows.length === 0) {
      throw new Error('Falha ao criar categoria')
    }

    const insertedCategory = result.rows[0]
    
    // Normalizar resposta para manter consistência
    const normalizedCategory = {
      id: insertedCategory.id,
      name: insertedCategory.name,
      description: insertedCategory.description || '',
      image: insertedCategory.image || '',
      sort_order: insertedCategory.sort_order || 0,
      active: insertedCategory.active !== false
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

    // Atualizar cada categoria individualmente usando PostgreSQL
    const updatePromises = categoryOrders.map(async (categoryOrder: any) => {
      const { id, sort_order } = categoryOrder
      
      if (!id || sort_order === undefined) {
        throw new Error('ID e sort_order são obrigatórios')
      }

      return query(
        'UPDATE public.categories SET sort_order = $1, updated_at = NOW() WHERE id = $2',
        [sort_order, id]
      )
    })

    // Executar todas as atualizações
    await Promise.all(updatePromises)

    return NextResponse.json({ message: 'Ordem das categorias atualizada com sucesso' })
  } catch (error) {
    console.error('Erro ao atualizar ordem das categorias:', error)
    return NextResponse.json(
      { error: 'Erro interno ao atualizar ordem das categorias' },
      { status: 500 }
    )
  }
}
