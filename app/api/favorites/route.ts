import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/postgres'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID é obrigatório' }, { status: 400 })
    }

    // Primeiro, garantir que a tabela user_favorites existe
    await query(`
      CREATE TABLE IF NOT EXISTS public.user_favorites (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, product_id)
      )
    `);

    // Criar índices se não existem
    await query('CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_user_favorites_product_id ON user_favorites(product_id)');

    // Buscar produtos favoritos do usuário
    const favoritesResult = await query(`
      SELECT 
        uf.id,
        uf.created_at,
        p.id as product_id,
        p.name,
        p.description,
        p.price,
        p.image_url as image,
        p.active,
        c.name as category_name
      FROM user_favorites uf
      JOIN products p ON uf.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE uf.user_id = $1 AND p.active = true
      ORDER BY uf.created_at DESC
    `, [userId]);

    // Processar dados para o formato esperado pelo frontend
    const processedFavorites = favoritesResult.rows.map(favorite => ({
      id: favorite.product_id || '',
      name: favorite.name || '',
      description: favorite.description || '',
      price: Number(favorite.price) || 0,
      image: favorite.image || '/placeholder.svg?height=200&width=300',
      rating: 4.8, // Valor padrão até implementarmos avaliações
      category: favorite.category_name || 'Sem categoria'
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

    // Verificar se o produto existe
    const productResult = await query(`
      SELECT id, name FROM products 
      WHERE id = $1 AND active = true
    `, [productId]);

    if (productResult.rows.length === 0) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    const product = productResult.rows[0];

    // Verificar se já está nos favoritos
    const existingResult = await query(`
      SELECT id FROM user_favorites 
      WHERE user_id = $1 AND product_id = $2
    `, [userId, productId]);

    if (existingResult.rows.length > 0) {
      return NextResponse.json({ error: 'Produto já está nos favoritos' }, { status: 400 })
    }

    // Adicionar aos favoritos
    await query(`
      INSERT INTO user_favorites (user_id, product_id)
      VALUES ($1, $2)
    `, [userId, productId]);

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

    // Remover dos favoritos
    const deleteResult = await query(`
      DELETE FROM user_favorites 
      WHERE user_id = $1 AND product_id = $2
    `, [userId, productId]);

    if (deleteResult.rowCount === 0) {
      return NextResponse.json({ error: 'Favorito não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Produto removido dos favoritos'
    })

  } catch (error: any) {
    console.error('Erro ao remover favorito:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}