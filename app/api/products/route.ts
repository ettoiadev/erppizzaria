import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { addCorsHeaders, createOptionsHandler } from '@/lib/auth-utils'
import { appLogger } from '@/lib/logging'
import { validateAdminAuth, createAuthErrorResponse } from '@/lib/auth-utils'
import { productSchema } from '@/lib/validation-schemas'
import { ProductsCache } from '@/lib/cache-manager'
import { productsCache, cacheUtils } from '@/lib/intelligent-cache'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// Handler GET para buscar produtos com cache inteligente
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit')
    const featured = searchParams.get('featured')
    const categoryId = searchParams.get('category_id')
    
    appLogger.info('api', 'Buscando produtos ativos', { limit, featured, categoryId })
    
    // Gerar chave de cache baseada nos parâmetros
    const cacheKey = cacheUtils.generateKey('products', 
      categoryId || 'all', 
      limit || 'no-limit', 
      featured || 'all'
    )
    
    // Usar cache inteligente com wrapper
    const products = await productsCache.wrap(
      cacheKey,
      async () => {
        appLogger.info('api', 'Cache miss: buscando produtos do banco')
        
        let queryText = `
          SELECT p.id, p.name, p.description, p.price, p.category_id, p.image, p.active as available,
                 c.name as category_name
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.active = true
        `
        
        const queryParams: any[] = []
        
        // Filtrar por categoria se especificado
        if (categoryId) {
          queryText += ` AND p.category_id = $${queryParams.length + 1}`
          queryParams.push(categoryId)
        }
        
        queryText += ` ORDER BY p.name ASC`
        
        // Se um limite foi especificado, adicionar LIMIT à query
        if (limit) {
          const limitNum = parseInt(limit, 10)
          if (!isNaN(limitNum) && limitNum > 0) {
            queryText += ` LIMIT ${limitNum}`
          }
        }
        
        const result = await query(queryText, queryParams)
        
        return result.rows.map((product: any) => ({
          id: product.id,
          name: product.name,
          description: product.description || '',
          price: parseFloat(product.price),
          category_id: product.category_id,
          category_name: product.category_name,
          image: product.image,
          available: product.available,
          sizes: [],
          toppings: []
        }))
      },
      {
        ttl: 300000, // 5 minutos
        tags: ['products', categoryId ? `category:${categoryId}` : 'all-categories']
      }
    )
    
    appLogger.info('api', `Retornando ${products.length} produtos`)
    return addCorsHeaders(NextResponse.json({
      success: true,
      products
    }))
  } catch (error: any) {
    appLogger.error('api', 'Erro ao buscar produtos', error instanceof Error ? error : new Error(String(error)))
    return addCorsHeaders(NextResponse.json({ 
      success: false,
      error: "Erro interno do servidor" 
    }, { status: 500 }))
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
    appLogger.info('api', 'Criando novo produto')
    
    // Parse do JSON
    let body
    try {
      body = await request.json()
    } catch (error) {
      appLogger.error('api', 'Erro ao fazer parse do JSON', error as Error)
      return addCorsHeaders(NextResponse.json({ error: "JSON inválido" }, { status: 400 }))
    }

    // Validação usando Zod
    const validationResult = productSchema.safeParse(body)
    if (!validationResult.success) {
      appLogger.error('api', 'Dados de produto inválidos', new Error(JSON.stringify(validationResult.error)))
      return addCorsHeaders(NextResponse.json({ 
        error: "Dados inválidos", 
        details: validationResult.error.errors 
      }, { status: 400 }))
    }

    const validatedData = validationResult.data
    const { name, description, price, category_id, image_url, active = true, preparation_time } = validatedData

    // Usar category_id diretamente do schema validado
    const finalCategoryId = category_id

    const result = await query(`
      INSERT INTO products (name, description, price, category_id, image, active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, description, price, category_id, image, active as available
    `, [
      name.trim(),
      description || '',
      price,
      finalCategoryId,
      image_url || null,
      active !== false
    ])
    
    const normalizedProduct = {
      ...result.rows[0],
      price: parseFloat(result.rows[0].price),
      sizes: [],
      toppings: []
    }
    
    // Invalidar cache inteligente de produtos após criação
    cacheUtils.invalidateProductCache(normalizedProduct.id)
    
    appLogger.info('api', `Produto criado com sucesso: ${normalizedProduct.id} (cache invalidado)`)
    return addCorsHeaders(NextResponse.json({ 
      success: true,
      product: normalizedProduct 
    }))
  } catch (error: any) {
    appLogger.error('api', 'Erro ao criar produto', error instanceof Error ? error : new Error(String(error)))
    return addCorsHeaders(NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 }))
  }
}

// Handler OPTIONS para CORS
export const OPTIONS = createOptionsHandler()
