import { NextResponse } from 'next/server'
import { query } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

// GET - Buscar um produto específico
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const result = await query(
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = $1',
      [params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

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

    return NextResponse.json({ product: normalizedProduct })
  } catch (error) {
    console.error("Erro ao buscar produto:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PUT - Atualizar um produto
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, description, price, category_id, categoryId, image, available, showImage, sizes, toppings } = body

    // Garantir compatibilidade entre categoryId e category_id
    const finalCategoryId = categoryId || category_id

    // Validar dados
    if (!name?.trim() || price === undefined || price < 0) {
      return NextResponse.json(
        { error: "Nome e preço são obrigatórios e o preço deve ser positivo" },
        { status: 400 }
      )
    }

    // Atualizar produto
    const result = await query(
      `
      UPDATE products 
      SET name = $1, 
          description = $2, 
          price = $3, 
          category_id = $4, 
          image = $5,
          available = $6,
          show_image = $7,
          sizes = $8,
          toppings = $9,
          updated_at = NOW()
      WHERE id = $10
      RETURNING *
      `,
      [
        name, 
        description, 
        price, 
        finalCategoryId, 
        image, 
        available, 
        showImage ?? true, 
        sizes ? JSON.stringify(sizes) : null,
        toppings ? JSON.stringify(toppings) : null,
        params.id
      ]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

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

    return NextResponse.json({ product: normalizedProduct })
  } catch (error) {
    console.error("Erro ao atualizar produto:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PATCH - Atualizar parcialmente um produto (ex: apenas disponibilidade)
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    console.log('PATCH body received:', body)
    console.log('Product ID:', params.id)
    
    const updateFields: string[] = []
    const updateValues: any[] = []
    let paramCounter = 1

    // Suportar tanto categoryId quanto category_id
    const processedBody = { ...body }
    if (body.categoryId && !body.category_id) {
      processedBody.category_id = body.categoryId
      delete processedBody.categoryId
    }
    
    // Suportar tanto showImage quanto show_image
    if (body.showImage !== undefined && !body.show_image) {
      processedBody.show_image = body.showImage
      delete processedBody.showImage
    }

    // Construir query dinâmica baseada nos campos fornecidos
    Object.entries(processedBody).forEach(([key, value]) => {
      if (["name", "description", "price", "category_id", "image", "available", "show_image", "sizes", "toppings"].includes(key)) {
        updateFields.push(`${key} = $${paramCounter}`)
        // Converter arrays para JSON se necessário
        if ((key === 'sizes' || key === 'toppings') && Array.isArray(value)) {
          updateValues.push(JSON.stringify(value))
        } else {
          updateValues.push(value)
        }
        paramCounter++
      }
    })

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "Nenhum campo válido para atualização" }, { status: 400 })
    }

    // Adicionar id como último parâmetro
    updateValues.push(params.id)

    console.log('SQL fields:', updateFields)
    console.log('SQL values:', updateValues)

    const result = await query(
      `
      UPDATE products 
      SET ${updateFields.join(", ")},
          updated_at = NOW()
      WHERE id = $${paramCounter}
      RETURNING *
      `,
      updateValues
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    // Normalizar resposta
    const product = result.rows[0]
    const normalizedProduct = {
      ...product,
      categoryId: product.category_id,
      available: Boolean(product.available),
      showImage: Boolean(product.show_image),
      sizes: product.sizes ? (typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes) : [],
      toppings: product.toppings ? (typeof product.toppings === 'string' ? JSON.parse(product.toppings) : product.toppings) : []
    }

    console.log('Product updated successfully:', normalizedProduct)
    return NextResponse.json({ product: normalizedProduct })
  } catch (error) {
    console.error("Erro ao atualizar produto:", error)
    return NextResponse.json({ 
      error: "Erro interno do servidor",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - Excluir um produto
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Primeiro, verificar se o produto existe
    const checkResult = await query(
      'SELECT id FROM products WHERE id = $1',
      [params.id]
    )

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    // Em vez de excluir, marcar como inativo
    const result = await query(
      'UPDATE products SET active = false, updated_at = NOW() WHERE id = $1 RETURNING *',
      [params.id]
    )

    return NextResponse.json({ message: "Produto excluído com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir produto:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
