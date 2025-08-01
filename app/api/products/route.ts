import { NextResponse } from 'next/server'
import { getProducts, createProduct } from '@/lib/db-postgres'

// GET handler para buscar TODOS os produtos do banco de dados
export async function GET() {
  try {
    console.log('🔍 Buscando produtos usando PostgreSQL...')

    // Buscar produtos com relacionamento de categoria usando PostgreSQL
    const products = await getProducts(false) // false = apenas ativos

    console.log('Query executada, produtos encontrados:', products?.length || 0)

    // Processar dados para compatibilidade com o frontend
    const processedProducts = (products || []).map((product, index) => ({
      ...product,
      name: product.name || "",
      description: product.description || "",
      categoryId: product.category_id || product.categoryId,
      // category_name já vem da query SQL
      available: Boolean(product.available),
      showImage: Boolean(product.show_image ?? true),
      // Se product_number não existir, usar índice + 1 como fallback
      productNumber: product.product_number || (index + 1),
      sizes: product.sizes ? (typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes) : [],
      toppings: product.toppings ? (typeof product.toppings === 'string' ? JSON.parse(product.toppings) : product.toppings) : []
    }))

    return NextResponse.json(processedProducts)
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

    // Inserir produto usando PostgreSQL
    const insertedProduct = await createProduct({
      name: name.trim(),
      description: description?.trim() || '',
      price,
      category_id: finalCategoryId,
      image: image || null,
      available,
      show_image: showImage,
      sizes: sizes ? JSON.stringify(sizes) : null,
      toppings: toppings ? JSON.stringify(toppings) : null,
      active: true,
      product_number: undefined // será gerado automaticamente
    })

    if (!insertedProduct) {
      throw new Error('Falha ao criar produto')
    }

    // Normalizar resposta
    const normalizedProduct = {
      ...insertedProduct,
      categoryId: insertedProduct.category_id,
      available: Boolean(insertedProduct.available),
      showImage: Boolean(insertedProduct.show_image ?? true),
      productNumber: insertedProduct.product_number,
      sizes: insertedProduct.sizes ? (typeof insertedProduct.sizes === 'string' ? JSON.parse(insertedProduct.sizes) : insertedProduct.sizes) : [],
      toppings: insertedProduct.toppings ? (typeof insertedProduct.toppings === 'string' ? JSON.parse(insertedProduct.toppings) : insertedProduct.toppings) : []
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
