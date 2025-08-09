import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
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
    console.error('Erro na API de favoritos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, productId } = await request.json()

    if (!userId || !productId) {
      return NextResponse.json({ error: 'User ID e Product ID são obrigatórios' }, { status: 400 })
    }

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
    console.error('Erro ao adicionar favorito:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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
    console.error('Erro ao remover favorito:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}