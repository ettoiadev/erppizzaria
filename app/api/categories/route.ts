import { NextRequest, NextResponse } from 'next/server'
import { getCategories as getCategoriesSupabase, createCategory, updateCategorySortOrders } from '@/lib/db-supabase'
import { withValidation } from '@/lib/validation-middleware'
import { withDatabaseErrorHandling } from '@/lib/database-error-handler'
import { withPresetRateLimit } from '@/lib/rate-limit-middleware'
import { withPresetSanitization } from '@/lib/sanitization-middleware'
import { withErrorMonitoring } from '@/lib/error-monitoring'
import { withApiLogging } from '@/lib/api-logger-middleware'
import { categorySchema } from '@/lib/validation-schemas'

// Handler GET para buscar categorias (sem middlewares)
async function getCategoriesHandler(request: NextRequest): Promise<NextResponse> {
  try {
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

    return NextResponse.json({ categories: normalizedCategories })
  } catch (error: any) {
    // O middleware de database error handling vai capturar e tratar este erro
    throw error
  }
}

// Handler POST para criar categoria (sem middlewares)
async function createCategoryHandler(
  request: NextRequest,
  validatedData: any
): Promise<NextResponse> {
  try {
    // Criar categoria via Supabase (dados já validados)
    const insertedCategory = await createCategory({
      name: validatedData.name.trim(),
      description: validatedData.description || null,
      image: validatedData.image || null,
      sort_order: validatedData.sort_order || 0,
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

    return NextResponse.json(normalizedCategory)
  } catch (error: any) {
    // O middleware de database error handling vai capturar e tratar este erro
    throw error
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

// Handler PUT para atualizar ordem das categorias (sem middlewares)
async function updateCategoryOrdersHandler(
  request: NextRequest,
  validatedData: any
): Promise<NextResponse> {
  try {
    // Atualizar ordens via Supabase (dados já validados)
    await updateCategorySortOrders(validatedData.categoryOrders)

    return NextResponse.json({ message: 'Ordem das categorias atualizada com sucesso' })
  } catch (error: any) {
    // O middleware de database error handling vai capturar e tratar este erro
    throw error
  }
}

// Aplicar middlewares para GET (apenas logging e monitoramento)
const enhancedGetHandler = withErrorMonitoring(
  withApiLogging(
    withDatabaseErrorHandling(
      getCategoriesHandler,
      {
        logErrors: true,
        sanitizeErrors: process.env.NODE_ENV === 'production'
      }
    ),
    {
      logRequests: true,
      logResponses: false, // Não logar resposta para GET (pode ser muito grande)
      logErrors: true
    }
  )
)

// Aplicar todos os middlewares para POST
const enhancedPostHandler = withErrorMonitoring(
  withApiLogging(
    withPresetRateLimit('public', {}, // Rate limiting geral
      withPresetSanitization('adminContent', {}, // Sanitização para conteúdo administrativo
        withValidation(categorySchema, // Validação usando Zod
          withDatabaseErrorHandling( // Tratamento de erros de banco
            createCategoryHandler,
            {
              logErrors: true,
              sanitizeErrors: process.env.NODE_ENV === 'production',
              customErrorMessages: {
                unique_violation: 'Categoria com este nome já existe',
                foreign_key_violation: 'Dados de referência inválidos'
              }
            }
          )
        )
      )
    ),
    {
      logRequests: true,
      logResponses: true,
      logErrors: true
    }
  )
)

// Aplicar todos os middlewares para PUT
const enhancedPutHandler = withErrorMonitoring(
  withApiLogging(
    withPresetRateLimit('public', {}, // Rate limiting geral
      withPresetSanitization('adminContent', {}, // Sanitização para conteúdo administrativo
        withValidation(categoryOrdersSchema, // Validação usando Zod
          withDatabaseErrorHandling( // Tratamento de erros de banco
            updateCategoryOrdersHandler,
            {
              logErrors: true,
              sanitizeErrors: process.env.NODE_ENV === 'production',
              customErrorMessages: {
                foreign_key_violation: 'Categoria não encontrada'
              }
            }
          )
        )
      )
    ),
    {
      logRequests: true,
      logResponses: true,
      logErrors: true
    }
  )
)

// Exportar as funções com middlewares
export const GET = enhancedGetHandler
export const POST = enhancedPostHandler
export const PUT = enhancedPutHandler
