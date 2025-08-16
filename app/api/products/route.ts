import { NextRequest, NextResponse } from 'next/server'
import { getProductsActive, createProduct } from '@/lib/db-supabase'
import { withValidation } from '@/lib/validation-middleware'
import { withDatabaseErrorHandling } from '@/lib/database-error-handler'
import { withPresetRateLimit } from '@/lib/rate-limit-middleware'
import { withPresetSanitization } from '@/lib/sanitization-middleware'
import { withErrorMonitoring } from '@/lib/error-monitoring'
import { withApiLogging } from '@/lib/api-logger-middleware'
import { productSchema } from '@/lib/validation-schemas'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// Handler GET para buscar produtos (sem middlewares)
async function getProductsHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const processedProducts = await getProductsActive()
    return NextResponse.json(processedProducts)
  } catch (error: any) {
    // O middleware de database error handling vai capturar e tratar este erro
    throw error
  }
}

// Handler POST para criar produto (sem middlewares)
async function createProductHandler(
  request: NextRequest,
  validatedData: any
): Promise<NextResponse> {
  try {
    const { name, description, price, categoryId, category_id, image, available = true, showImage = true, sizes, toppings } = validatedData

    // Garantir compatibilidade entre categoryId e category_id
    const finalCategoryId = categoryId || category_id

    const normalizedProduct = await createProduct({
      name: name.trim(),
      description: description?.trim() || '',
      price,
      category_id: finalCategoryId,
      image: image || null,
      available: available !== false,
      sizes: sizes || [],
      toppings: toppings || [],
    })
    return NextResponse.json({ product: normalizedProduct })
  } catch (error) {
    // O middleware de database error handling vai capturar e tratar este erro
    throw error
  }
}

// Aplicar middlewares para GET (apenas logging e monitoramento)
const enhancedGetHandler = withErrorMonitoring(
  withApiLogging(
    withDatabaseErrorHandling(
      getProductsHandler,
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
        withValidation(productSchema, // Validação usando Zod
          withDatabaseErrorHandling( // Tratamento de erros de banco
            createProductHandler,
            {
              logErrors: true,
              sanitizeErrors: process.env.NODE_ENV === 'production',
              customErrorMessages: {
                unique_violation: 'Produto com este nome já existe',
                foreign_key_violation: 'Categoria inválida'
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
