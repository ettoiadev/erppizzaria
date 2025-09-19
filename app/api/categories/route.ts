import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { addCorsHeaders, createOptionsHandler } from '@/lib/auth-utils'
import { frontendLogger } from '@/lib/frontend-logger'
import { validateAdminAuth, createAuthErrorResponse } from '@/lib/auth-utils'
import { categorySchema } from '@/lib/validation-schemas'
import { CategoriesCache } from '@/lib/cache-manager'
import { categoriesCache, cacheUtils } from '@/lib/intelligent-cache'

// Handler GET para buscar categorias com cache inteligente
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    frontendLogger.info('Buscando categorias')
    
    // Usar cache inteligente com wrapper
    const categories = await categoriesCache.wrap(
      'categories:all',
      async () => {
        frontendLogger.info('Cache miss: buscando categorias do banco')
        
        const result = await query(
          'SELECT id, name, description, image, sort_order, active FROM categories WHERE active = true ORDER BY sort_order ASC, name ASC'
        )
        
        // Normalizar os dados para garantir consistência
        return (result.rows || []).map((category: any) => ({
          id: category.id,
          name: category.name || '',
          description: category.description || '',
          image: category.image || '',
          sort_order: category.sort_order || 0,
          active: category.active !== false
        }))
      },
      {
        ttl: 600000, // 10 minutos (categorias mudam pouco)
        tags: ['categories']
      }
    )

    frontendLogger.info(`Retornando ${categories.length} categorias`)
    return addCorsHeaders(NextResponse.json({ 
      success: true,
      categories 
    }))
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    frontendLogger.logError('Erro ao buscar categorias', {
       errorMessage
     }, error instanceof Error ? error : undefined, 'api')
    return addCorsHeaders(NextResponse.json({ 
      success: false,
      error: "Erro interno do servidor" 
    }, { status: 500 }))
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
    
    // Criar categoria via PostgreSQL (dados já validados)
    const result = await query(
      `INSERT INTO categories (name, description, sort_order, active)
       VALUES ($1, $2, $3, true)
       RETURNING id, name, description, image, sort_order, active`,
      [
        validatedData.name.trim(),
        validatedData.description || null,
        validatedData.display_order || 0
      ]
    )
    
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

    // Invalidar cache inteligente de categorias após criação
    cacheUtils.invalidateCategoryCache()
    
    frontendLogger.info(`Categoria criada com sucesso: ${normalizedCategory.id} (cache invalidado)`)
    return addCorsHeaders(NextResponse.json({ 
      success: true,
      category: normalizedCategory 
    }))
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
    
    // Atualizar ordem das categorias via PostgreSQL (dados já validados)
    for (const categoryOrder of validatedData.categoryOrders) {
      await query(
        'UPDATE categories SET sort_order = $1 WHERE id = $2',
        [categoryOrder.sort_order, categoryOrder.id]
      )
    }
    
    // Invalidar cache inteligente de categorias após atualização de ordem
    cacheUtils.invalidateCategoryCache()
    
    frontendLogger.info('Ordem das categorias atualizada com sucesso (cache invalidado)')
    return addCorsHeaders(NextResponse.json({ 
      success: true,
      message: 'Ordem das categorias atualizada com sucesso' 
    }))
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    frontendLogger.logError('Erro ao atualizar categoria', {
       errorMessage
     }, error instanceof Error ? error : undefined, 'api')
    return addCorsHeaders(NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 }))
  }
}

export const OPTIONS = createOptionsHandler()
