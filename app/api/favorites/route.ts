import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { withValidation } from '@/lib/validation-utils'
import { withDatabaseErrorHandling } from '@/lib/error-handler'
import { withPresetRateLimit } from '@/lib/rate-limit-middleware'
import { withPresetSanitization } from '@/lib/sanitization-middleware'
import { withErrorMonitoring } from '@/lib/error-monitoring'
import { withApiLogging } from '@/lib/api-logger-middleware'
import { favoriteSchema } from '@/lib/validation-schemas'

// Handler GET para buscar favoritos (sem middlewares)
async function getFavoritesHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID é obrigatório' }, { status: 400 })
    }

    // Buscar favoritos com join de produtos e categorias (PostgreSQL)
    const favs = await query(`
      SELECT 
        f.id,
        f.created_at,
        p.id as product_id,
        p.name as product_name,
        p.description as product_description,
        p.price as product_price,
        p.image_url as product_image_url,
        p.active as product_active,
        c.name as category_name
      FROM favorites f
      JOIN products p ON f.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
    `, [userId])

    const processedFavorites = (favs.rows || [])
      .filter((f: any) => f.product_active !== false)
      .map((f: any) => ({
        id: f.product_id || '',
        name: f.product_name || '',
        description: f.product_description || '',
        price: Number(f.product_price) || 0,
        image: f.product_image_url || '/default-image.svg',
        rating: 4.8,
        category: f.category_name || 'Sem categoria'
      }))

    return NextResponse.json({ favorites: processedFavorites })

  } catch (error: any) {
    // O middleware de database error handling vai capturar e tratar este erro
    throw error
  }
}

// Handler POST para adicionar favorito (sem middlewares)
async function addFavoriteHandler(
  request: NextRequest,
  validatedData: any
): Promise<NextResponse> {
  try {
    const { userId, productId } = validatedData

    // Dados já validados pelos middlewares

    // Verificar se o produto existe
    const productResult = await query(`
      SELECT id, name, active 
      FROM products 
      WHERE id = $1
    `, [productId])
    
    const product = productResult.rows[0]
    if (!product || product.active === false) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    // Verificar se já está nos favoritos
    const existingResult = await query(`
      SELECT id 
      FROM favorites 
      WHERE user_id = $1 AND product_id = $2
    `, [userId, productId])
    
    if (existingResult.rows.length > 0) {
      return NextResponse.json({ error: 'Produto já está nos favoritos' }, { status: 400 })
    }

    // Adicionar aos favoritos
    await query(`
      INSERT INTO favorites (user_id, product_id) 
      VALUES ($1, $2)
    `, [userId, productId])

    return NextResponse.json({ 
      success: true,
      message: `${product.name} foi adicionado aos favoritos`
    })

  } catch (error: any) {
    // O middleware de database error handling vai capturar e tratar este erro
    throw error
  }
}

// Handler DELETE para remover favorito (sem middlewares)
async function removeFavoriteHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const productId = searchParams.get('productId')

    if (!userId || !productId) {
      return NextResponse.json({ error: 'User ID e Product ID são obrigatórios' }, { status: 400 })
    }

    // Remover dos favoritos
    await query(`
      DELETE FROM favorites 
      WHERE user_id = $1 AND product_id = $2
    `, [userId, productId])

    return NextResponse.json({ success: true, message: 'Produto removido dos favoritos' })

  } catch (error: any) {
    // O middleware de database error handling vai capturar e tratar este erro
    throw error
  }
}

// Aplicar middlewares para GET
export const GET = withErrorMonitoring(
  withApiLogging(
    withDatabaseErrorHandling(
      getFavoritesHandler
    )
  )
)

// Aplicar middlewares para POST
export const POST = withErrorMonitoring(
  withApiLogging(
    withPresetRateLimit('public', {},
      withPresetSanitization('userForm', {},
        withValidation(favoriteSchema,
          withDatabaseErrorHandling(
            addFavoriteHandler,
            {
              customErrorMessages: {
                unique_violation: 'Produto já está nos favoritos',
                foreign_key_violation: 'Produto ou usuário não encontrado'
              }
            }
          )
        )
      )
    )
  )
)

// Aplicar middlewares para DELETE
export const DELETE = withErrorMonitoring(
  withApiLogging(
    withDatabaseErrorHandling(
      removeFavoriteHandler
    )
  )
)