import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET handler para buscar todas as categorias
export async function GET() {
  try {
    console.log('🔍 Buscando categorias usando Supabase...')

    // Buscar categorias usando Supabase
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true })

    if (error) {
      console.error('Erro na query Supabase:', error)
      throw error
    }

    console.log('🔍 Resultado da query - total de linhas:', categories?.length || 0)
    
    // Normalizar os dados para garantir consistência
    const normalizedCategories = (categories || []).map(category => ({
      id: category.id,
      name: category.name || '',
      // Aplicar lógica COALESCE no frontend
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
    
    // Fallback: tentar query mais simples se a principal falhar
    try {
      console.log('Tentando fallback com query simples...')
      const { data: fallbackCategories, error: fallbackError } = await supabase
        .from('categories')
        .select('id, name')

      if (fallbackError) {
        throw fallbackError
      }
      
      const simplifiedCategories = (fallbackCategories || []).map(category => ({
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

    // Preparar dados para inserção
    const insertData: any = {
      name: name.trim()
    }

    if (description) {
      insertData.description = description
    }

    if (image) {
      insertData.image = image
    }

    if (sort_order !== undefined) {
      insertData.sort_order = sort_order
    }

    // Inserir categoria usando Supabase
    const { data: insertedCategory, error } = await supabase
      .from('categories')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Erro ao inserir categoria:', error)
      throw error
    }
    
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

    // Atualizar cada categoria individualmente usando Supabase
    const updatePromises = categoryOrders.map(async (categoryOrder: any) => {
      const { id, sort_order } = categoryOrder
      
      if (!id || sort_order === undefined) {
        throw new Error('ID e sort_order são obrigatórios')
      }

      return supabase
        .from('categories')
        .update({ sort_order })
        .eq('id', id)
    })

    // Executar todas as atualizações
    const results = await Promise.all(updatePromises)
    
    // Verificar se houve erros
    const errors = results.filter(result => result.error)
    if (errors.length > 0) {
      console.error('Erros ao atualizar categorias:', errors)
      throw new Error('Falha ao atualizar algumas categorias')
    }

    return NextResponse.json({ message: 'Ordem das categorias atualizada com sucesso' })
  } catch (error) {
    console.error('Erro ao atualizar ordem das categorias:', error)
    return NextResponse.json(
      { error: 'Erro interno ao atualizar ordem das categorias' },
      { status: 500 }
    )
  }
}
