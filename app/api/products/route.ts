import { NextResponse } from 'next/server'
import { query } from '@/lib/postgres'

// GET handler para buscar TODOS os produtos do banco de dados
export async function GET() {
  try {
    console.log('🔍 Buscando produtos usando PostgreSQL...')

    // Buscar produtos com relacionamento de categoria usando PostgreSQL
    const productsResult = await query(`
      SELECT 
        p.id, p.name, p.description, p.price, p.category_id, p.image_url as image,
        p.active, p.has_sizes, p.has_toppings, p.preparation_time, p.sort_order,
        p.created_at, p.updated_at,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.active = true
      ORDER BY p.sort_order ASC NULLS LAST, p.created_at ASC
    `);

    const products = productsResult.rows;
    console.log('Query executada, produtos encontrados:', products.length)

    // Processar dados para compatibilidade com o frontend
    const processedProducts = products.map((product, index) => ({
      ...product,
      name: product.name || "",
      description: product.description || "",
      categoryId: product.category_id,
      category_name: product.category_name || "",
      available: Boolean(product.active),
      showImage: true, // Default para compatibilidade
      productNumber: product.sort_order || (index + 1),
      sizes: [], // Será implementado posteriormente se necessário
      toppings: [] // Será implementado posteriormente se necessário
    }))

    return NextResponse.json(processedProducts)
  } catch (error: any) {
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
    const insertResult = await query(`
      INSERT INTO products (
        name, description, price, category_id, image_url, active, has_sizes, has_toppings, preparation_time
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, name, description, price, category_id, image_url as image, active, has_sizes, has_toppings, preparation_time, sort_order, created_at, updated_at
    `, [
      name.trim(),
      description?.trim() || '',
      price,
      finalCategoryId,
      image || null,
      available !== false,
      Array.isArray(sizes) && sizes.length > 0,
      Array.isArray(toppings) && toppings.length > 0,
      30 // tempo padrão de preparo
    ]);

    if (insertResult.rows.length === 0) {
      throw new Error('Falha ao criar produto')
    }

    const insertedProduct = insertResult.rows[0];

    // Buscar nome da categoria
    const categoryResult = await query(`
      SELECT name FROM categories WHERE id = $1
    `, [finalCategoryId]);

    // Normalizar resposta
    const normalizedProduct = {
      ...insertedProduct,
      categoryId: insertedProduct.category_id,
      category_name: categoryResult.rows[0]?.name || "",
      available: Boolean(insertedProduct.active),
      showImage: true,
      productNumber: insertedProduct.sort_order || 0,
      sizes: sizes || [],
      toppings: toppings || []
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
