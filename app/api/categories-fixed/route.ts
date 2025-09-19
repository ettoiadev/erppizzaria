import { NextResponse } from 'next/server'
import { query } from '@/lib/postgresql'
import { frontendLogger } from '@/lib/frontend-logger'

// GET handler para buscar todas as categorias
export async function GET() {
  try {
    // Buscar todas as categorias ativas
    const result = await query(`
      SELECT 
        id,
        name,
        COALESCE(description, '') as description,
        COALESCE(image, '') as image,
        COALESCE(sort_order, 0) as sort_order,
        COALESCE(active, true) as active
      FROM categories 
      WHERE active = true OR active IS NULL
      ORDER BY sort_order ASC, name ASC
    `)
    
    const rows = result.rows

    // Normalizar os dados para garantir consistência
    const normalizedCategories = (rows || []).map((category: any) => ({
      id: category.id,
      name: category.name || '',
      description: category.description || '',
      image: category.image_url || category.image || '',
      sort_order: category.sort_order || 0,
      active: category.active !== false // true por padrão
    }))

    return NextResponse.json({ categories: normalizedCategories })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    frontendLogger.logError('Erro ao buscar categorias:', {
      message: errorMessage,
      stack: errorStack
    }, error instanceof Error ? error : undefined, 'api')
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

    // Inserir nova categoria
    const result = await query(`
      INSERT INTO categories (name, description, image, sort_order, active)
      VALUES ($1, $2, $3, $4, true)
      RETURNING *
    `, [name, description || '', image || '', sort_order || 0])
    
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
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    frontendLogger.logError('Erro ao criar categoria:', {
      message: errorMessage,
      stack: errorStack
    }, error instanceof Error ? error : undefined, 'api')
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

    // Atualizar ordem de cada categoria
    for (const { id, sort_order } of categoryOrders) {
      await query(`
        UPDATE categories 
        SET sort_order = $1, updated_at = NOW()
        WHERE id = $2
      `, [sort_order, id])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    frontendLogger.logError('Erro ao atualizar ordem das categorias:', {
      message: errorMessage,
      stack: errorStack
    }, error instanceof Error ? error : undefined, 'api')
    return NextResponse.json(
      { error: 'Erro interno ao atualizar ordem das categorias' },
      { status: 500 }
    )
  }
}