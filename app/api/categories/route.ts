import { NextRequest, NextResponse } from 'next/server'
import { getCategories as getCategoriesSupabase, createCategory, updateCategorySortOrders } from '@/lib/db-supabase'
import { addCorsHeaders, createOptionsHandler } from '@/lib/auth-utils'
import { frontendLogger } from '@/lib/frontend-logger'
import { validateAdminAuth, createAuthErrorResponse } from '@/lib/auth-utils'
import { categorySchema } from '@/lib/validation-schemas'

// Handler GET para buscar categorias
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    frontendLogger.info('Buscando categorias')
    // Buscar categorias usando Supabase
    const categories = await getCategoriesSupabase(true) // true = incluir inativas também
    
    // Normalizar os dados para garantir consistência
    const normalizedCategories = (categories || []).map(category => ({
      id: category.id,
      name: category.name || '',
      description: category.description || '',
      image: category.image || '',
      sort_order: category.sort_order || 0,
      active: category.active !== false
    }))

    frontendLogger.info(`Encontradas ${normalizedCategories.length} categorias`)
    return addCorsHeaders(NextResponse.json({ categories: normalizedCategories }))
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    frontendLogger.logError('Erro ao buscar categorias', {
       errorMessage
     }, error instanceof Error ? error : undefined, 'api')
    return addCorsHeaders(NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 }))
  }
}

// Handler POST para criar categoria
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Validar autenticação de admin
  const authResult = await validateAdminAuth(request)
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error || 'Acesso negado', 401)
  }

  try {
    frontendLogger.info('Criando nova categoria')
    
    // Parse do JSON
    let body
    try {
      body = await request.json()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      frontendLogger.logError('Erro ao fazer parse do JSON', {
         errorMessage
       }, error instanceof Error ? error : undefined, 'api')
      return addCorsHeaders(NextResponse.json({ error: "JSON inválido" }, { status: 400 }))
    }

    // Validação usando Zod
    const validationResult = categorySchema.safeParse(body)
    if (!validationResult.success) {
      frontendLogger.logError('Dados de categoria inválidos', {
         validationErrors: validationResult.error.errors
       }, undefined, 'api')
      return addCorsHeaders(NextResponse.json({ 
        error: "Dados inválidos", 
        details: validationResult.error.errors 
      }, { status: 400 }))
    }

    const validatedData = validationResult.data
    
    // Criar categoria via Supabase (dados já validados)
    const insertedCategory = await createCategory({
      name: validatedData.name.trim(),
      description: validatedData.description || null,
      sort_order: validatedData.display_order || 0,
    })
    
    // Normalizar resposta para manter consistência
    const normalizedCategory = {
      id: insertedCategory.id,
      name: insertedCategory.name,
      description: insertedCategory.description || '',
      image: insertedCategory.image || '',
      sort_order: insertedCategory.sort_order || 0,
      active: insertedCategory.active !== false
    }

    frontendLogger.info(`Categoria criada com sucesso: ${normalizedCategory.id}`)
    return addCorsHeaders(NextResponse.json({ category: normalizedCategory }))
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    frontendLogger.logError('Erro ao criar categoria', {
       errorMessage
     }, error instanceof Error ? error : undefined, 'api')
    return addCorsHeaders(NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 }))
  }
}

// Schema para atualização de ordem das categorias
import { z } from 'zod'

const categoryOrdersSchema = z.object({
  categoryOrders: z.array(z.object({
    id: z.string().uuid(),
    sort_order: z.number().min(0)
  }))
})

// Handler PUT para atualizar ordem das categorias
export async function PUT(request: NextRequest): Promise<NextResponse> {
  // Validar autenticação de admin
  const authResult = await validateAdminAuth(request)
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error || 'Acesso negado', 401)
  }

  try {
    frontendLogger.info('Atualizando ordem das categorias')
    
    // Parse do JSON
    let body
    try {
      body = await request.json()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      frontendLogger.logError('Erro ao fazer parse do JSON', {
         errorMessage
       }, error instanceof Error ? error : undefined, 'api')
      return addCorsHeaders(NextResponse.json({ error: "JSON inválido" }, { status: 400 }))
    }

    // Validação usando Zod
    const validationResult = categoryOrdersSchema.safeParse(body)
    if (!validationResult.success) {
      frontendLogger.logError('Dados de categoria inválidos', {
         validationErrors: validationResult.error.errors
       }, undefined, 'api')
      return addCorsHeaders(NextResponse.json({ 
        error: "Dados inválidos", 
        details: validationResult.error.errors 
      }, { status: 400 }))
    }

    const validatedData = validationResult.data
    
    // Atualizar ordem das categorias via Supabase (dados já validados)
    await updateCategorySortOrders(validatedData.categoryOrders)
    
    frontendLogger.info('Ordem das categorias atualizada com sucesso')
    return addCorsHeaders(NextResponse.json({ message: 'Ordem das categorias atualizada com sucesso' }))
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    frontendLogger.logError('Erro ao atualizar categoria', {
       errorMessage
     }, error instanceof Error ? error : undefined, 'api')
    return addCorsHeaders(NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 }))
  }
}

export const OPTIONS = createOptionsHandler()
