import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('GET /api/categories/[id] - ID:', params.id)
    
    const supabase = getSupabaseServerClient()
    const { data: categoryRow, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', params.id)
      .maybeSingle()
    if (error) throw error

    if (!categoryRow) {
      console.log('Categoria não encontrada:', params.id)
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

    console.log('Categoria atualizada com sucesso:', normalizedCategory)
    return NextResponse.json(normalizedCategory)

  } catch (error) {
    console.error("Erro completo ao atualizar categoria:", {
      message: (error as any)?.message,
      stack: (error as any)?.stack,
      id: params?.id
    })
    
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
    console.log('DELETE /api/categories/[id] - ID:', params.id)
    
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

    console.log('Categoria marcada como inativa:', result.rows[0])
    return NextResponse.json({ 
      message: "Categoria excluída com sucesso",
      success: true 
    })
  } catch (error) {
    console.error("Erro ao excluir categoria:", error)
    return NextResponse.json({ 
      error: "Erro interno do servidor",
      details: process.env.NODE_ENV === 'development' ? (error as any)?.message : undefined 
    }, { status: 500 })
  }
} 