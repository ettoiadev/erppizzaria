import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from '@/lib/supabase'
import { frontendLogger } from '@/lib/frontend-logger'
import { validateAdminAuth, createAuthErrorResponse, addCorsHeaders, createOptionsHandler } from '@/lib/auth-utils'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Schema para validação completa de categoria (PUT)
const categoryUpdateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres").trim(),
  description: z.string().max(500, "Descrição deve ter no máximo 500 caracteres").optional().default(""),
  image_url: z.string().url("URL da imagem deve ser válida").optional().nullable(),
  sort_order: z.number().int().min(0, "Ordem deve ser um número positivo").optional().default(0),
  active: z.boolean().optional().default(true)
});

// Schema para validação parcial de categoria (PATCH)
const categoryPatchSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres").trim().optional(),
  description: z.string().max(500, "Descrição deve ter no máximo 500 caracteres").optional(),
  image_url: z.string().url("URL da imagem deve ser válida").optional().nullable(),
  sort_order: z.number().int().min(0, "Ordem deve ser um número positivo").optional(),
  active: z.boolean().optional()
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    frontendLogger.info('Busca de categoria por ID iniciada', 'api', {
      categoryId: params.id
    });
    
    const supabase = getSupabaseServerClient()
    const { data: category, error } = await supabase
      .from('categories')
      .select('id, name, description, image_url, sort_order, active, created_at, updated_at')
      .eq('id', params.id)
      .maybeSingle()
    if (error) throw error

    if (!category) {
      frontendLogger.warn('Categoria não encontrada', 'api', {
        categoryId: params.id
      });
      const response = NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
      return addCorsHeaders(response)
    }

    const normalizedCategory = {
      id: category.id,
      name: category.name,
      description: category.description || '',
      image: category.image_url || '',
      sort_order: category.sort_order || 0,
      active: category.active !== false
    }

    frontendLogger.info('Categoria encontrada com sucesso', 'api', {
      categoryId: params.id,
      categoryName: category.name
    });
    const response = NextResponse.json({ category: normalizedCategory })
    return addCorsHeaders(response)
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    frontendLogger.logError('Erro ao buscar categoria', {
      categoryId: params.id,
      message: errorMessage
    }, error instanceof Error ? error : undefined, 'api');
    const response = NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    return addCorsHeaders(response)
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  // Validar autenticação de admin
  const authResult = await validateAdminAuth(request)
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error || 'Erro de autenticação', 401)
  }
  
  const admin = authResult.user
  if (!admin) {
    return createAuthErrorResponse('Usuário não encontrado', 401)
  }

  try {
    frontendLogger.info('Requisição PUT para categoria iniciada', 'api', {
      adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
      categoryId: params.id
    });
  
    // Parse do body com tratamento de erro
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError)
      frontendLogger.warn('JSON inválido na requisição PUT categoria', 'api', {
        adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
        categoryId: params.id,
        error: errorMessage
      });
      const response = NextResponse.json(
        { error: "Dados JSON inválidos" },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

    // Validação com Zod
    const validationResult = categoryUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      frontendLogger.warn('Dados inválidos na requisição PUT categoria', 'api', {
        adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
        categoryId: params.id,
        errors: validationResult.error.errors
      });
      const response = NextResponse.json(
        { 
          error: "Dados inválidos", 
          details: validationResult.error.errors 
        },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

    const validatedData = validationResult.data;

    // Verificar se a categoria existe antes de tentar atualizar
    const supabase = getSupabaseServerClient()
    const { data: existing, error: exErr } = await supabase
      .from('categories')
      .select('id')
      .eq('id', params.id)
      .maybeSingle()
    if (exErr) throw exErr

    if (!existing) {
      frontendLogger.warn('Categoria não encontrada para atualização', 'api', {
        adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
        categoryId: params.id
      });
      const response = NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      )
      return addCorsHeaders(response)
    }

    // Atualizar categoria usando Supabase com dados validados
    const { data: updatedCategory, error: updErr } = await supabase
      .from('categories')
      .update({
        name: validatedData.name,
        description: validatedData.description,
        image_url: validatedData.image_url || null,
        sort_order: validatedData.sort_order,
        active: validatedData.active,
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

    frontendLogger.info('Categoria atualizada com sucesso', 'api', {
      adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
      categoryId: params.id,
      categoryName: normalizedCategory.name
    });
    const response = NextResponse.json(normalizedCategory)
    return addCorsHeaders(response)

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    frontendLogger.logError('Erro ao atualizar categoria', {
      adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
      categoryId: params.id,
      message: errorMessage
    }, error instanceof Error ? error : undefined, 'api');
    
    const response = NextResponse.json({ 
      error: "Erro interno do servidor",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
    return addCorsHeaders(response)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  // Validar autenticação de admin
  const authResult = await validateAdminAuth(request)
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error || 'Erro de autenticação', 401)
  }
  
  const admin = authResult.user
  if (!admin) {
    return createAuthErrorResponse('Usuário não encontrado', 401)
  }

  try {
    frontendLogger.info('Iniciando exclusão de categoria', 'api', {
      adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
      categoryId: params.id
    });
  
    // Validar se o ID foi fornecido
    if (!params.id || params.id.trim() === '') {
      frontendLogger.warn('ID da categoria não fornecido para exclusão', 'api', {
        adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown'
      });
      const response = NextResponse.json(
        { error: "ID da categoria é obrigatório" },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

    const supabase = getSupabaseServerClient()
    const { data: existing, error: exErr } = await supabase
      .from('categories')
      .select('id, name')
      .eq('id', params.id)
      .maybeSingle()
    if (exErr) throw exErr

    if (!existing) {
      frontendLogger.warn('Categoria não encontrada para exclusão', 'api', {
        adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
        categoryId: params.id
      });
      const response = NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      )
      return addCorsHeaders(response)
    }
    const existingCategory = existing;

    // Verificar se há produtos associados à categoria
    const { data: prodRows, error: prodErr } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', params.id)
      .eq('active', true)
    if (prodErr) throw prodErr
    const productsCount = (prodRows as any)?.length || 0

    if (productsCount > 0) {
      frontendLogger.warn('Tentativa de exclusão de categoria com produtos associados', 'api', {
        adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
        categoryId: params.id,
        categoryName: existingCategory.name,
        productsCount
      });
      const response = NextResponse.json(
        { 
          error: "Não é possível excluir categoria com produtos associados",
          details: `Esta categoria possui ${productsCount} produto(s) associado(s). Remova ou mova os produtos antes de excluir a categoria.`
        },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

    // Deletar categoria usando Supabase (soft delete)
    const { error: delErr } = await supabase
      .from('categories')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', params.id)
    if (delErr) throw delErr

    frontendLogger.info('Categoria deletada com sucesso', 'api', {
      adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
      categoryId: params.id,
      categoryName: existingCategory.name
    });
    const response = NextResponse.json({ 
      message: "Categoria deletada com sucesso",
      id: params.id 
    })
    return addCorsHeaders(response)

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    frontendLogger.logError('Erro ao deletar categoria', {
      adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
      categoryId: params.id,
      message: errorMessage
    }, error instanceof Error ? error : undefined, 'api');

    const response = NextResponse.json({ 
      error: "Erro interno do servidor",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
    return addCorsHeaders(response)
  }
}

// Handler para requisições OPTIONS (CORS)
export const OPTIONS = createOptionsHandler()