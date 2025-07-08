import { type NextRequest, NextResponse } from "next/server"
import { supabase } from '@/lib/supabase'
import { getSupabaseAdmin } from "@/lib/supabase"
import { verifyAdmin } from "@/lib/auth"

export const dynamic = 'force-dynamic'

// Função auxiliar para extrair e verificar o admin
async function handleAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Token não fornecido");
  }
  const token = authHeader.split(" ")[1];
  
  const admin = await verifyAdmin(token);
  if (!admin) {
    throw new Error("Acesso não autorizado");
  }
  return admin;
}


export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('GET /api/categories/[id] - ID:', params.id)
    
    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('Categoria não encontrada:', params.id)
        return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
      }
      throw error
    }

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
    await handleAdminAuth(request);
    const supabaseAdmin = getSupabaseAdmin();
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
    const { data: existingCategory, error: existsError } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('id', params.id)
      .single()

    if (existsError) {
      if (existsError.code === 'PGRST116') {
        console.error('Categoria não encontrada para update:', params.id)
        return NextResponse.json(
          { error: "Categoria não encontrada" },
          { status: 404 }
        )
      }
      throw existsError
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

    // Preparar dados para atualização
    const updateData: { [key: string]: any } = {
      name: updateName,
      description: updateDescription,
      active: updateActive,
      updated_at: new Date().toISOString()
    }

    // Adicionar image se fornecida
    if (updateImage) {
      updateData.image = updateImage
    }

    console.log('Dados para atualização:', updateData)

    // Atualizar categoria usando Supabase
    const { data: updatedCategory, error: updateError } = await supabaseAdmin
      .from('categories')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar categoria:', updateError)
      throw updateError
    }

    // Normalizar resposta para manter consistência
    const normalizedCategory = {
      id: updatedCategory.id,
      name: updatedCategory.name,
      description: updatedCategory.description || '',
      image: updatedCategory.image || '',
      sort_order: updatedCategory.sort_order || 0,
      active: updatedCategory.active !== false
    }

    console.log('Categoria atualizada com sucesso:', normalizedCategory)
    return NextResponse.json(normalizedCategory)

  } catch (error: any) {
    console.error("Erro completo ao atualizar categoria:", {
      message: error.message,
      stack: error.stack,
      id: params?.id
    })
    
    if (error.message.includes('Token não fornecido') || error.message.includes('Acesso não autorizado')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: "Erro interno do servidor",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await handleAdminAuth(request);
    const supabaseAdmin = getSupabaseAdmin();

    console.log('DELETE /api/categories/[id] - ID:', params.id)
    
    // Validar se o ID foi fornecido
    if (!params.id || params.id.trim() === '') {
      console.error('ID da categoria não fornecido')
      return NextResponse.json(
        { error: "ID da categoria é obrigatório" },
        { status: 400 }
      )
    }

    // Verificar se a categoria existe
    const { data: existingCategory, error: existsError } = await supabaseAdmin
      .from('categories')
      .select('id, name')
      .eq('id', params.id)
      .single()

    if (existsError) {
      if (existsError.code === 'PGRST116') {
        console.error('Categoria não encontrada para delete:', params.id)
        return NextResponse.json(
          { error: "Categoria não encontrada" },
          { status: 404 }
        )
      }
      throw existsError
    }

    console.log('Categoria encontrada para delete:', existingCategory.name)

    // Verificar se há produtos associados à categoria
    const { count: productsCount, error: countError } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', params.id)

    if (countError) {
      console.error('Erro ao verificar produtos associados:', countError)
      // Não falhar se não conseguir verificar produtos
    }

    if (productsCount && productsCount > 0) {
      console.log(`Categoria tem ${productsCount} produtos associados`)
      return NextResponse.json(
        { 
          error: "Não é possível excluir categoria com produtos associados",
          details: `Esta categoria possui ${productsCount} produto(s) associado(s). Remova ou mova os produtos antes de excluir a categoria.`
        },
        { status: 400 }
      )
    }

    // Deletar categoria usando Supabase
    const { error: deleteError } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Erro ao deletar categoria:', deleteError)
      throw deleteError
    }

    console.log('Categoria deletada com sucesso:', params.id)
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

    if (error.message.includes('Token não fornecido') || error.message.includes('Acesso não autorizado')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({ 
      error: "Erro interno do servidor",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
} 