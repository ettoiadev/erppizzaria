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
    frontendLogger.error('Erro ao buscar produtos:', error)
    return addCorsHeaders(NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 }))
  }
}

// Handler POST para criar produto
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Validar autenticação de admin
  const authResult = await validateAdminAuth(request)
  if (!authResult.isValid) {
    return createAuthErrorResponse(authResult.error!)
  }

  try {
    frontendLogger.info('Criando novo produto')
    
    // Parse do JSON
    let body
    try {
      body = await request.json()
    } catch (error) {
      frontendLogger.error('Erro ao fazer parse do JSON:', error)
      return addCorsHeaders(NextResponse.json({ error: "JSON inválido" }, { status: 400 }))
    }

    // Validação usando Zod
    const validationResult = productSchema.safeParse(body)
    if (!validationResult.success) {
      frontendLogger.error('Dados de produto inválidos:', validationResult.error)
      return addCorsHeaders(NextResponse.json({ 
        error: "Dados inválidos", 
        details: validationResult.error.errors 
      }, { status: 400 }))
    }

    const validatedData = validationResult.data
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
    
    frontendLogger.info(`Produto criado com sucesso: ${normalizedProduct.id}`)
    return addCorsHeaders(NextResponse.json({ product: normalizedProduct }))
  } catch (error: any) {
    frontendLogger.error('Erro ao criar produto:', error)
    return addCorsHeaders(NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 }))
  }
}

// Handler OPTIONS para CORS
export const OPTIONS = createOptionsHandler()
