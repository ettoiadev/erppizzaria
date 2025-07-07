import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID é obrigatório' }, { status: 400 })
    }

    // Buscar produtos favoritos do usuário
    const { data: favorites, error } = await supabase
      .from('user_favorites')
      .select(`
        id,
        created_at,
        product:products (
          id,
          name,
          description,
          price,
          image,
          active,
          category:categories (
            name
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar favoritos:', error)
      return NextResponse.json({ error: 'Erro ao buscar favoritos' }, { status: 500 })
    }

    // Processar dados para o formato esperado pelo frontend
    const processedFavorites = favorites?.map(favorite => ({
      id: favorite.product?.id || '',
      name: favorite.product?.name || '',
      description: favorite.product?.description || '',
      price: Number(favorite.product?.price) || 0,
      image: favorite.product?.image || '/placeholder.svg?height=200&width=300',
      rating: 4.8, // Valor padrão até implementarmos avaliações
      category: favorite.product?.category?.name || 'Sem categoria'
    })) || []

    return NextResponse.json({ favorites: processedFavorites })

  } catch (error) {
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

    // Verificar se o produto existe
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', productId)
      .eq('active', true)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    // Verificar se já está nos favoritos
    const { data: existingFavorite } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single()

    if (existingFavorite) {
      return NextResponse.json({ error: 'Produto já está nos favoritos' }, { status: 400 })
    }

    // Adicionar aos favoritos
    const { error: insertError } = await supabase
      .from('user_favorites')
      .insert({
        user_id: userId,
        product_id: productId
      })

    if (insertError) {
      console.error('Erro ao adicionar favorito:', insertError)
      return NextResponse.json({ error: 'Erro ao adicionar aos favoritos' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: `${product.name} foi adicionado aos favoritos`
    })

  } catch (error) {
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

    // Remover dos favoritos
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId)

    if (error) {
      console.error('Erro ao remover favorito:', error)
      return NextResponse.json({ error: 'Erro ao remover dos favoritos' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Produto removido dos favoritos'
    })

  } catch (error) {
    console.error('Erro ao remover favorito:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 