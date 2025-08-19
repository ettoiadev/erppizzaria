import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import { frontendLogger } from '@/lib/frontend-logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    frontendLogger.info('Busca de categoria por ID', 'api', { categoryId: params.id })
    
    const supabase = getSupabaseServerClient()
    const { data: categoryRow, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', params.id)
      .maybeSingle()
    if (error) throw error

    if (!categoryRow) {
      frontendLogger.info('Categoria não encontrada', 'api', { categoryId: params.id })
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
    }

    const category = categoryRow
    const normalizedCategory = {
      id: category.id,
      name: category.name,
      description: category.description || '',
      image: category.image_url || category.image || '',
      sort_order: category.sort_order || 0,
      active: category.active !== false
    }

    frontendLogger.info('Categoria encontrada', 'api', { 
      categoryId: normalizedCategory.id,
      categoryName: normalizedCategory.name
    })
    return NextResponse.json({ category: normalizedCategory })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    frontendLogger.logError('Erro ao buscar categoria', {
      categoryId: params.id,
      message: errorMessage,
      stack: errorStack
    }, error instanceof Error ? error : undefined, 'api')
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    frontendLogger.info('Atualização de categoria por ID', 'api', { categoryId: params.id })
    
    // Validar se o ID foi fornecido
    if (!params.id || params.id.trim() === '') {
      frontendLogger.warn('ID da categoria não fornecido', 'api')
      return NextResponse.json(
        { error: "ID da categoria é obrigatório" },
        { status: 400 }
      )
    }

    // Parse do body com tratamento de erro
    let body
    try {
      body = await request.json()
      frontendLogger.info('Body recebido para atualização', 'api', { categoryId: params.id })
    } catch (parseError) {
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError)
      frontendLogger.logError('Erro ao fazer parse do JSON', {
        categoryId: params.id,
        message: errorMessage
      }, parseError instanceof Error ? parseError : undefined, 'api')
      return NextResponse.json(
        { error: "Dados JSON inválidos" },
        { status: 400 }
      )
    }

    const { name, description, image, active } = body

    // Validação robusta dos dados
    if (!name || typeof name !== 'string' || !name.trim()) {
      frontendLogger.warn('Nome da categoria inválido', 'api', {
        categoryId: params.id,
        providedName: name
      })
      return NextResponse.json(
        { error: "Nome da categoria é obrigatório e deve ser uma string válida" },
        { status: 400 }
      )
    }

    // Verificar se a categoria existe antes de tentar atualizar
    const supabase = getSupabaseServerClient()
    const { data: existing, error: exErr } = await supabase
      .from('categories')
      .select('id')
      .eq('id', params.id)
      .maybeSingle()
    if (exErr) throw exErr

    if (!existing) {
      frontendLogger.warn('Categoria não encontrada para update', 'api', {
        categoryId: params.id
      })
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

    frontendLogger.info('Valores para update', 'api', {
      categoryId: params.id,
      name: updateName,
      description: updateDescription,
      image: updateImage,
      active: updateActive
    })

    const { data: category, error: updErr } = await supabase
      .from('categories')
      .update({
        name: updateName,
        description: updateDescription,
        image_url: updateImage || null,
        active: updateActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select('*')
      .single()
    if (updErr) throw updErr
    const normalizedCategory = {
      id: category.id,
      name: category.name,
      description: category.description || '',
      image: category.image_url || '',
      sort_order: category.sort_order || 0,
      active: category.active !== false
    }

    frontendLogger.info('Categoria atualizada com sucesso', 'api', {
      categoryId: normalizedCategory.id,
      categoryName: normalizedCategory.name
    })
    return NextResponse.json(normalizedCategory)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    frontendLogger.logError('Erro completo ao atualizar categoria', {
      categoryId: params?.id,
      message: errorMessage,
      stack: errorStack
    }, error instanceof Error ? error : undefined, 'api')
    
    // Retornar erro mais específico se possível
    if (typeof (error as any)?.message === 'string' && (error as any).message.includes('invalid input syntax')) {
      return NextResponse.json({ 
        error: "Formato de dados inválido",
        details: (error as any).message 
      }, { status: 400 })
    }
    
    if (typeof (error as any)?.message === 'string' && (error as any).message.includes('relation') && (error as any).message.includes('does not exist')) {
      return NextResponse.json({ 
        error: "Tabela categories não encontrada",
        details: (error as any).message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      error: "Erro interno do servidor",
      details: process.env.NODE_ENV === 'development' ? (error as any)?.message : undefined
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    frontendLogger.info('Exclusão de categoria por ID', 'api', { categoryId: params.id })
    
    // Validar se o ID foi fornecido
    if (!params.id || params.id.trim() === '') {
      return NextResponse.json(
        { error: "ID da categoria é obrigatório" },
        { status: 400 }
      )
    }

    // Verificar se existem produtos usando esta categoria
    const supabase = getSupabaseServerClient()
    const { data: prods } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', params.id)
      .eq('active', true)
    if ((prods as any)?.length > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir categoria que possui produtos ativos" },
        { status: 400 }
      )
    }

    const { data: inact, error: inErr } = await supabase
      .from('categories')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select('id')
      .single()
    if (inErr) throw inErr
    if (!inact) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
    }

    frontendLogger.info('Categoria marcada como inativa', 'api', {
      categoryId: inact.id
    })
    return NextResponse.json({ 
      message: "Categoria excluída com sucesso",
      success: true 
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    frontendLogger.logError('Erro ao excluir categoria', {
      categoryId: params.id,
      message: errorMessage,
      stack: errorStack
    }, error instanceof Error ? error : undefined, 'api')
    return NextResponse.json({ 
      error: "Erro interno do servidor",
      details: process.env.NODE_ENV === 'development' ? (error as any)?.message : undefined 
    }, { status: 500 })
  }
}