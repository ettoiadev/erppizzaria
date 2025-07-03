import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET handler para buscar TODOS os produtos do banco de dados
export async function GET() {
  try {
    // Query ordenada por product_number, com fallback para created_at se product_number for null
    const result = await query(
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.active = true ORDER BY COALESCE(p.product_number, 999999), p.created_at ASC'
    )
    
    console.log('Query executada, produtos encontrados:', result.rows.length)
    
    // Se não houver produtos, vamos verificar sem o filtro available
    if (result.rows.length === 0) {
      const allProducts = await query(
        'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.active = true ORDER BY COALESCE(p.product_number, 999999), p.created_at ASC'
      )
      console.log('Produtos sem filtro available:', allProducts.rows.length)
      
      // Verificar quantos estão como available = false
      const unavailable = allProducts.rows.filter(p => !p.available)
      console.log('Produtos indisponíveis:', unavailable.length)
    }

    // Garantir que todos os produtos tenham propriedades essenciais
    const products = result.rows.map((product, index) => ({
      ...product,
      name: product.name || "",
      description: product.description || "",
      categoryId: product.category_id || product.categoryId,
      available: Boolean(product.available),
      showImage: Boolean(product.show_image ?? true),
      // Se product_number não existir, usar índice + 1 como fallback
      productNumber: product.product_number || (index + 1),
      sizes: product.sizes ? (typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes) : [],
      toppings: product.toppings ? (typeof product.toppings === 'string' ? JSON.parse(product.toppings) : product.toppings) : []
    }))

    return NextResponse.json(products)
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    return NextResponse.json(
      { error: 'Erro interno ao buscar produtos' },
      { status: 500 }
    )
  }
}

// POST handler para CRIAR um novo produto no banco de dados
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, price, categoryId, category_id, image, available = true, showImage = true, sizes, toppings } = body

    // Garantir compatibilidade entre categoryId e category_id
    const finalCategoryId = categoryId || category_id

    // Validar dados obrigatórios
    if (!name?.trim() || price === undefined || price < 0) {
      return NextResponse.json(
        { error: 'Nome e preço são obrigatórios e o preço deve ser positivo' },
        { status: 400 }
      )
    }

    if (!finalCategoryId) {
      return NextResponse.json(
        { error: 'Categoria é obrigatória' },
        { status: 400 }
      )
    }

    // Verificar se existem produtos ativos para resetar numeração se necessário
    const activeProductsCheck = await query(
      'SELECT COUNT(*) as count FROM products WHERE active = true'
    )
    
    const activeCount = parseInt(activeProductsCheck.rows[0].count)
    console.log(`Produtos ativos encontrados: ${activeCount}`)
    
    // Se não há produtos ativos, resetar a sequência de numeração
    if (activeCount === 0) {
      console.log('Nenhum produto ativo encontrado. Resetando sequência de numeração para 1.')
      try {
        // Primeiro verificar se a sequência existe
        const seqExists = await query(
          "SELECT 1 FROM pg_sequences WHERE sequencename = 'products_number_seq'"
        )
        
        if (seqExists.rows.length > 0) {
          await query('SELECT setval(\'products_number_seq\', 1, false)')
          console.log('Sequência resetada com sucesso')
        } else {
          console.log('Sequência não existe, será criada automaticamente pelo trigger')
        }
      } catch (seqError) {
        console.log('Erro ao resetar sequência:', seqError)
      }
    }

    const result = await query(
      `INSERT INTO products (name, description, price, category_id, image, available, show_image, sizes, toppings, active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true) RETURNING *`,
      [
        name.trim(),
        description?.trim() || '',
        price,
        finalCategoryId,
        image || null,
        available,
        showImage,
        sizes ? JSON.stringify(sizes) : null,
        toppings ? JSON.stringify(toppings) : null
      ]
    )

    // Normalizar resposta
    const product = result.rows[0]
    const normalizedProduct = {
      ...product,
      categoryId: product.category_id,
      available: Boolean(product.available),
      showImage: Boolean(product.show_image ?? true),
      productNumber: product.product_number,
      sizes: product.sizes ? (typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes) : [],
      toppings: product.toppings ? (typeof product.toppings === 'string' ? JSON.parse(product.toppings) : product.toppings) : []
    }

    console.log(`Produto criado com sucesso: ${normalizedProduct.name} - Número: ${normalizedProduct.productNumber}`)
    
    return NextResponse.json({ product: normalizedProduct })
  } catch (error) {
    console.error('Erro ao criar produto:', error)
    return NextResponse.json(
      { error: 'Erro interno ao criar produto' },
      { status: 500 }
    )
  }
}
