import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from '@/lib/supabase'
import { withAdminAuth } from '@/lib/auth-middleware'
import { frontendLogger } from '@/lib/logging'

export const dynamic = 'force-dynamic'



export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('GET /api/categories/[id] - ID:', params.id)
    
    const supabase = getSupabaseServerClient()
    const { data: category, error } = await supabase
      .from('categories')
      .select('id, name, description, image_url, sort_order, active, created_at, updated_at')
      .eq('id', params.id)
      .maybeSingle()
    if (error) throw error

    if (!category) {
      console.log('Categoria não encontrada:', params.id)
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
    }

    const normalizedCategory = {
      id: category.id,
      name: category.name,
      description: category.description || '',
      image: category.image_url || '',
      sort_order: category.sort_order || 0,
      active: category.active !== false
    }

    console.log('Categoria encontrada:', normalizedCategory)
    return NextResponse.json({ category: normalizedCategory })
  } catch (error: any) {
    console.error("Erro ao buscar categoria:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return withAdminAuth(request, async (req, admin) => {
    try {
      console.log(`[CATEGORIES] PUT request iniciado para categoria ID: ${params.id}`)
      console.log(`[CATEGORIES] PUT: Acesso autorizado para admin: ${admin.email}`)
    
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
    const supabase = getSupabaseServerClient()
    const { data: existing, error: exErr } = await supabase
      .from('categories')
      .select('id')
      .eq('id', params.id)
      .maybeSingle()
    if (exErr) throw exErr

    if (!existing) {
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

    // Atualizar categoria usando Supabase
    const { data: updatedCategory, error: updErr } = await supabase
      .from('categories')
      .update({
        name: updateName,
        description: updateDescription,
        image_url: updateImage || null,
        active: updateActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select('id, name, description, image_url, sort_order, active, created_at, updated_at')
      .single()
    if (updErr) throw updErr

    // Normalizar resposta para manter consistência
    const normalizedCategory = {
      id: updatedCategory.id,
      name: updatedCategory.name,
      description: updatedCategory.description || '',
      image: updatedCategory.image_url || '',
      sort_order: updatedCategory.sort_order || 0,
      active: updatedCategory.active !== false
    }

    console.log('Categoria atualizada com sucesso:', normalizedCategory)
    frontendLogger.info('admin', 'Categoria atualizada', {
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      categoryId: params.id,
      categoryName: normalizedCategory.name
    })
    return NextResponse.json(normalizedCategory)

    } catch (error: any) {
      console.error("Erro completo ao atualizar categoria:", {
        message: error.message,
        stack: error.stack,
        id: params?.id
      })
      
      frontendLogger.error('admin', 'Erro ao atualizar categoria', {
        error: error.message,
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        categoryId: params.id,
        stack: error.stack
      })
      
      return NextResponse.json({ 
        error: "Erro interno do servidor",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 500 })
    }
  })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return withAdminAuth(request, async (req, admin) => {
    try {
      console.log(`[CATEGORIES] DELETE request iniciado para categoria ID: ${params.id}`)
      console.log(`[CATEGORIES] DELETE: Acesso autorizado para admin: ${admin.email}`)
    
    // Validar se o ID foi fornecido
    if (!params.id || params.id.trim() === '') {
      console.error('ID da categoria não fornecido')
      return NextResponse.json(
        { error: "ID da categoria é obrigatório" },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServerClient()
    const { data: existing, error: exErr } = await supabase
      .from('categories')
      .select('id, name')
      .eq('id', params.id)
      .maybeSingle()
    if (exErr) throw exErr

    if (!existing) {
      console.error('Categoria não encontrada para delete:', params.id)
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      )
    }
    const existingCategory = existing;
    console.log('Categoria encontrada para delete:', existingCategory.name)

    // Verificar se há produtos associados à categoria
    const { data: prodRows, error: prodErr } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', params.id)
      .eq('active', true)
    if (prodErr) throw prodErr
    const productsCount = (prodRows as any)?.length || 0

    if (productsCount > 0) {
      console.log(`Categoria tem ${productsCount} produtos associados`)
      return NextResponse.json(
        { 
          error: "Não é possível excluir categoria com produtos associados",
          details: `Esta categoria possui ${productsCount} produto(s) associado(s). Remova ou mova os produtos antes de excluir a categoria.`
        },
        { status: 400 }
      )
    }

    // Deletar categoria usando Supabase (soft delete)
    const { error: delErr } = await supabase
      .from('categories')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', params.id)
    if (delErr) throw delErr

    console.log('Categoria deletada com sucesso:', params.id)
    frontendLogger.info('admin', 'Categoria deletada', {
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      categoryId: params.id,
      categoryName: existingCategory.name
    })
    return NextResponse.json({ 
      message: "Categoria deletada com sucesso",
      id: params.id 
    })

    } catch (error: any) {
      console.error("Erro completo ao deletar categoria:", {
        message: error.message,
        stack: error.stack,
        id: params?.id
      })

      frontendLogger.error('admin', 'Erro ao deletar categoria', {
        error: error.message,
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        categoryId: params.id,
        stack: error.stack
      })

      return NextResponse.json({ 
        error: "Erro interno do servidor",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 500 })
    }
  })
}