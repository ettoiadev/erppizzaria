import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('GET /api/categories/[id] - ID:', params.id)
    
    const result = await query(
      'SELECT * FROM categories WHERE id = $1',
      [params.id]
    )

    if (result.rows.length === 0) {
      console.log('Categoria não encontrada:', params.id)
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
    }

    const category = result.rows[0]
    const normalizedCategory = {
      id: category.id,
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      sort_order: category.sort_order || 0,
      active: category.active !== false
    }

    console.log('Categoria encontrada:', normalizedCategory)
    return NextResponse.json({ category: normalizedCategory })
  } catch (error) {
    console.error("Erro ao buscar categoria:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('PUT /api/categories/[id] - ID:', params.id)
    
    // Validar se o ID foi fornecido
    if (!params.id || params.id.trim() === '') {
      console.error('ID da categoria não fornecido')
      return NextResponse.json(
        { error: "ID da categoria é obrigatório" },
        { status: 400 }
      )
    }

    // Parse do body com tratamento de erro
    let body
    try {
      body = await request.json()
      console.log('Body recebido:', body)
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', parseError)
      return NextResponse.json(
        { error: "Dados JSON inválidos" },
        { status: 400 }
      )
    }

    const { name, description, image, active } = body

    // Validação robusta dos dados
    if (!name || typeof name !== 'string' || !name.trim()) {
      console.error('Nome da categoria inválido:', name)
      return NextResponse.json(
        { error: "Nome da categoria é obrigatório e deve ser uma string válida" },
        { status: 400 }
      )
    }

    // Verificar se a categoria existe antes de tentar atualizar
    const existingCategory = await query(
      'SELECT id FROM categories WHERE id = $1',
      [params.id]
    )

    if (existingCategory.rows.length === 0) {
      console.error('Categoria não encontrada para update:', params.id)
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      )
    }

    // Preparar valores com valores padrão seguros
    const updateName = name.trim()
    const updateDescription = (description && typeof description === 'string') ? description.trim() : ''
    const updateImage = (image && typeof image === 'string') ? image.trim() : ''
    const updateActive = active !== undefined ? Boolean(active) : true

    console.log('Valores para update:', {
      name: updateName,
      description: updateDescription, 
      image: updateImage,
      active: updateActive,
      id: params.id
    })

    // Verificar se a tabela tem o campo updated_at
    let hasUpdatedAt = false
    try {
      const tableInfo = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'categories' 
        AND table_schema = 'public' 
        AND column_name = 'updated_at'
      `)
      hasUpdatedAt = tableInfo.rows.length > 0
      console.log('Tabela tem campo updated_at:', hasUpdatedAt)
    } catch (error) {
      console.log('Erro ao verificar campo updated_at:', error.message)
    }

    // Construir query dinamicamente
    let updateQuery = `
      UPDATE categories 
      SET name = $1, 
          description = $2, 
          image = $3, 
          active = $4
    `
    
    let queryParams = [updateName, updateDescription, updateImage, updateActive, params.id]
    
    if (hasUpdatedAt) {
      updateQuery += ', updated_at = NOW()'
    }
    
    updateQuery += ' WHERE id = $5 RETURNING *'

    console.log('Query SQL:', updateQuery)
    console.log('Parâmetros:', queryParams)

    const result = await query(updateQuery, queryParams)

    if (result.rows.length === 0) {
      console.error('Nenhuma linha foi atualizada para ID:', params.id)
      return NextResponse.json(
        { error: "Categoria não encontrada ou não foi possível atualizar" },
        { status: 404 }
      )
    }

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

    console.log('Categoria atualizada com sucesso:', normalizedCategory)
    return NextResponse.json(normalizedCategory)

  } catch (error) {
    console.error("Erro completo ao atualizar categoria:", {
      message: error.message,
      stack: error.stack,
      id: params?.id
    })
    
    // Retornar erro mais específico se possível
    if (error.message.includes('invalid input syntax')) {
      return NextResponse.json({ 
        error: "Formato de dados inválido",
        details: error.message 
      }, { status: 400 })
    }
    
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      return NextResponse.json({ 
        error: "Tabela categories não encontrada",
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      error: "Erro interno do servidor",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('DELETE /api/categories/[id] - ID:', params.id)
    
    // Validar se o ID foi fornecido
    if (!params.id || params.id.trim() === '') {
      return NextResponse.json(
        { error: "ID da categoria é obrigatório" },
        { status: 400 }
      )
    }

    // Verificar se existem produtos usando esta categoria
    const productsCheck = await query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = $1 AND active = true',
      [params.id]
    )

    if (parseInt(productsCheck.rows[0].count) > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir categoria que possui produtos ativos" },
        { status: 400 }
      )
    }

    // Marcar como inativa em vez de excluir fisicamente
    const result = await query(
      'UPDATE categories SET active = false WHERE id = $1 RETURNING *',
      [params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
    }

    console.log('Categoria marcada como inativa:', result.rows[0])
    return NextResponse.json({ 
      message: "Categoria excluída com sucesso",
      success: true 
    })
  } catch (error) {
    console.error("Erro ao excluir categoria:", error)
    return NextResponse.json({ 
      error: "Erro interno do servidor",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }, { status: 500 })
  }
} 