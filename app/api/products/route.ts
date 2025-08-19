import { NextRequest, NextResponse } from 'next/server'
import { getProductsActive, createProduct } from '@/lib/db-supabase'
import { addCorsHeaders, createOptionsHandler } from '@/lib/auth-utils'
import { frontendLogger } from '@/lib/frontend-logger'
import { validateAdminAuth, createAuthErrorResponse } from '@/lib/auth-utils'
import { productSchema } from '@/lib/validation-schemas'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// Handler GET para buscar produtos
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    frontendLogger.info('Buscando produtos ativos')
    const processedProducts = await getProductsActive()
    frontendLogger.info(`Encontrados ${processedProducts.length} produtos`)
    return addCorsHeaders(NextResponse.json(processedProducts))
  } catch (error: any) {
    frontendLogger.logError('Erro ao buscar produtos:', 'api', error)
    return addCorsHeaders(NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 }))
  }
}

// Handler POST para criar produto
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Validar autenticação de admin
  const authResult = await validateAdminAuth(request)
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error || 'Acesso negado', 401)
  }

  try {
    frontendLogger.info('Criando novo produto')
    
    // Parse do JSON
    let body
    try {
      body = await request.json()
    } catch (error) {
      frontendLogger.logError('Erro ao fazer parse do JSON:', {}, error as Error, 'api')
      return addCorsHeaders(NextResponse.json({ error: "JSON inválido" }, { status: 400 }))
    }

    // Validação usando Zod
    const validationResult = productSchema.safeParse(body)
    if (!validationResult.success) {
      frontendLogger.logError('Dados de produto inválidos:', 'api', validationResult.error)
      return addCorsHeaders(NextResponse.json({ 
        error: "Dados inválidos", 
        details: validationResult.error.errors 
      }, { status: 400 }))
    }

    const validatedData = validationResult.data
    const { name, description, price, category_id, image_url, active = true, preparation_time } = validatedData

    // Usar category_id diretamente do schema validado
    const finalCategoryId = category_id

    const normalizedProduct = await createProduct({
      name: name.trim(),
      description: description || '',
      price,
      category_id: finalCategoryId,
      image: image_url || null,
      available: active !== false,
      sizes: [],
      toppings: [],
    })
    
    frontendLogger.info(`Produto criado com sucesso: ${normalizedProduct.id}`)
    return addCorsHeaders(NextResponse.json({ product: normalizedProduct }))
  } catch (error: any) {
    frontendLogger.logError('Erro ao criar produto:', 'api', error)
    return addCorsHeaders(NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 }))
  }
}

// Handler OPTIONS para CORS
export const OPTIONS = createOptionsHandler()
