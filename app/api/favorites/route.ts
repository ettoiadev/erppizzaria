import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'
import { withValidation } from '@/lib/validation-utils'
import { withDatabaseErrorHandling } from '@/lib/database-error-handler'
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

    const supabase = getSupabaseServerClient()

    // Buscar favoritos com join de produtos e categorias (Supabase)
    const { data: favs, error } = await supabase
      .from('favorites')
      .select('id, created_at, product:product_id(id, name, description, price, image_url, active, category:category_id(name))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error

    const processedFavorites = (favs || [])
      .filter((f: any) => f.product?.active !== false)
      .map((f: any) => ({
        id: f.product?.id || '',
        name: f.product?.name || '',
        description: f.product?.description || '',
        price: Number(f.product?.price) || 0,
        image: f.product?.image_url || '/placeholder.svg?height=200&width=300',
        rating: 4.8,
        category: f.product?.category?.name || 'Sem categoria'
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

    const supabase = getSupabaseServerClient()

    // Verificar se o produto existe
    const { data: product, error: prodErr } = await supabase
      .from('products')
      .select('id, name, active')
      .eq('id', productId)
      .maybeSingle()
    if (prodErr) throw prodErr
    if (!product || product.active === false) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    // Verificar se já está nos favoritos
    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle()
    if (existing) {
      return NextResponse.json({ error: 'Produto já está nos favoritos' }, { status: 400 })
    }

    // Adicionar aos favoritos
    const { error } = await supabase
      .from('favorites')
      .insert({ user_id: userId, product_id: productId })
    if (error) throw error

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

    const supabase = getSupabaseServerClient()

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId!)
      .eq('product_id', productId!)
    if (error) throw error

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