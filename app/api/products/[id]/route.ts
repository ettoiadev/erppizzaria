import { NextResponse, type NextRequest } from "next/server";
import { query } from '@/lib/postgres';
import { verifyAdmin } from "@/lib/auth";

// Função auxiliar para extrair e verificar o admin
async function handleAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Token não fornecido");
  }
  const token = authHeader.split(" ")[1];
  
  const admin = await verifyAdmin(token);
  if (!admin) {
    throw new Error("Acesso não autorizado");
  }
  return admin;
}

// GET - Publicly fetch a specific product
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productResult = await query(`
      SELECT 
        p.id, p.name, p.description, p.price, p.category_id, p.image_url as image,
        p.active, p.has_sizes, p.has_toppings, p.preparation_time, p.sort_order,
        p.created_at, p.updated_at,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `, [params.id]);

    if (productResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    const product = productResult.rows[0];

    const normalizedProduct = {
      ...product,
      categoryId: product.category_id,
      category_name: product.category_name || "",
      available: Boolean(product.active),
      showImage: true, // Default para compatibilidade
      productNumber: product.sort_order || 0,
      sizes: [], // Será implementado posteriormente se necessário
      toppings: [] // Será implementado posteriormente se necessário
    };

    return NextResponse.json({ product: normalizedProduct });
  } catch (error: any) {
    console.error("Erro ao buscar produto:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PUT - Update a product (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await handleAdminAuth(request);

    const body = await request.json();
    const {
      name,
      description,
      price,
      category_id,
      categoryId,
      image,
      available,
      showImage,
      sizes,
      toppings,
    } = body;

    const finalCategoryId = categoryId || category_id;

    if (!name?.trim() || price === undefined || price < 0) {
      return NextResponse.json(
        { error: "Nome e preço são obrigatórios e o preço deve ser positivo" },
        { status: 400 }
      );
    }

    // Verificar se o produto existe
    const existingResult = await query(`
      SELECT id FROM products WHERE id = $1
    `, [params.id]);

    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    // Atualizar produto
    const updateResult = await query(`
      UPDATE products 
      SET 
        name = $1,
        description = $2,
        price = $3,
        category_id = $4,
        image_url = $5,
        active = $6,
        updated_at = NOW()
      WHERE id = $7
      RETURNING 
        id, name, description, price, category_id, image_url as image,
        active, has_sizes, has_toppings, preparation_time, sort_order,
        created_at, updated_at
    `, [
      name.trim(),
      description?.trim() || '',
      price,
      finalCategoryId,
      image || null,
      available !== false,
      params.id
    ]);

    if (updateResult.rows.length === 0) {
      throw new Error('Falha ao atualizar produto');
    }

    const updatedProduct = updateResult.rows[0];

    // Buscar nome da categoria
    const categoryResult = await query(`
      SELECT name FROM categories WHERE id = $1
    `, [updatedProduct.category_id]);

    const normalizedProduct = {
      ...updatedProduct,
      categoryId: updatedProduct.category_id,
      category_name: categoryResult.rows[0]?.name || "",
      available: Boolean(updatedProduct.active),
      showImage: true,
      productNumber: updatedProduct.sort_order || 0,
      sizes: sizes || [],
      toppings: toppings || []
    };

    return NextResponse.json({ product: normalizedProduct });
  } catch (error: any) {
    console.error("Erro ao atualizar produto:", error);
    if (error.message.includes('Token não fornecido') || error.message.includes('Acesso não autorizado')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PATCH - Partially update a product (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await handleAdminAuth(request);
    
    const body = await request.json();
    
    // Preparar campos para atualização
    const updateFields = []
    const updateValues = []
    let paramIndex = 1

    const allowedFields = {
      name: 'name',
      description: 'description', 
      price: 'price',
      category_id: 'category_id',
      categoryId: 'category_id',
      image: 'image_url',
      available: 'active',
      showImage: null, // Ignorar por enquanto
      sizes: null, // Ignorar por enquanto
      toppings: null // Ignorar por enquanto
    };

    Object.entries(body).forEach(([key, value]) => {
      const dbField = allowedFields[key as keyof typeof allowedFields];
      if (dbField) {
        updateFields.push(`${dbField} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "Nenhum campo válido para atualização" },
        { status: 400 }
      );
    }

    // Sempre atualizar updated_at
    updateFields.push(`updated_at = NOW()`);

    // Adicionar ID no final
    updateValues.push(params.id);

    const updateResult = await query(`
      UPDATE products 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING 
        id, name, description, price, category_id, image_url as image,
        active, has_sizes, has_toppings, preparation_time, sort_order,
        created_at, updated_at
    `, updateValues);

    if (updateResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    const updatedProduct = updateResult.rows[0];

    // Buscar nome da categoria
    const categoryResult = await query(`
      SELECT name FROM categories WHERE id = $1
    `, [updatedProduct.category_id]);

    const normalizedProduct = {
      ...updatedProduct,
      categoryId: updatedProduct.category_id,
      category_name: categoryResult.rows[0]?.name || "",
      available: Boolean(updatedProduct.active),
      showImage: true,
      sizes: [],
      toppings: []
    };

    return NextResponse.json({ product: normalizedProduct });
  } catch (error: any) {
    console.error("Erro ao atualizar produto:", error);
    if (error.message.includes('Token não fornecido') || error.message.includes('Acesso não autorizado')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a product (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await handleAdminAuth(request);
    
    // Verificar se o produto existe
    const existingResult = await query(`
      SELECT id, name FROM products WHERE id = $1
    `, [params.id]);

    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    const existingProduct = existingResult.rows[0];

    // Soft delete - marcar como inativo
    await query(`
      UPDATE products 
      SET active = false, updated_at = NOW()
      WHERE id = $1
    `, [params.id]);

    return NextResponse.json({
      message: "Produto excluído com sucesso",
      product: {
        id: params.id,
        name: existingProduct.name
      }
    });
  } catch (error: any) {
    console.error("Erro ao excluir produto:", error);

    if (
      error.message.includes("Token não fornecido") ||
      error.message.includes("Acesso não autorizado")
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}