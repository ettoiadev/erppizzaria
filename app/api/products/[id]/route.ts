import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from "@/lib/auth"

// GET - Buscar um produto específico
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Buscar produto com relacionamento de categoria usando Supabase
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        categories:category_id (
          id,
          name
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
      }
      throw error
    }

    const normalizedProduct = {
      ...product,
      categoryId: product.category_id,
      // Aplicar lógica COALESCE no frontend
      category_name: product.categories?.name || '',
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

    // Atualizar produto usando Supabase
    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update({
        name, 
        description, 
        price, 
        category_id: finalCategoryId, 
        image, 
        available, 
        show_image: showImage ?? true, 
        sizes: sizes ? JSON.stringify(sizes) : null,
        toppings: toppings ? JSON.stringify(toppings) : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
      }
      throw error
    }

    const product = updatedProduct
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

    // Preparar dados para atualização
    const updateData: any = {}
    
    // Campos permitidos para atualização
    const allowedFields = ["name", "description", "price", "category_id", "image", "available", "show_image", "sizes", "toppings"]
    
    Object.entries(processedBody).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        // Converter arrays para JSON se necessário
        if ((key === 'sizes' || key === 'toppings') && Array.isArray(value)) {
          updateData[key] = JSON.stringify(value)
        } else {
          updateData[key] = value
        }
      }
    })

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Nenhum campo válido para atualização" }, { status: 400 })
    }

    // Adicionar timestamp de atualização
    updateData.updated_at = new Date().toISOString()

    console.log('Update data:', updateData)

    // Atualizar usando Supabase
    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
      }
      throw error
    }

    // Normalizar resposta
    const product = updatedProduct
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
    // Primeiro, verificar se o produto existe e excluir usando Supabase
    const { data: deletedProduct, error } = await supabase
      .from('products')
      .delete()
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({ 
      message: "Produto excluído com sucesso",
      product: deletedProduct 
    })
  } catch (error) {
    console.error("Erro ao excluir produto:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
