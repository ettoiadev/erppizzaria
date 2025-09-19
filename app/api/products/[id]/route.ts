import { NextResponse, type NextRequest } from "next/server";
import { query } from '@/lib/db';
import { frontendLogger } from '@/lib/frontend-logger';
import { validateAdminAuth, createAuthErrorResponse, addCorsHeaders, createOptionsHandler } from '@/lib/auth-utils';
import { z } from 'zod';

// Schema para atualização completa de produto
const productUpdateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres").trim(),
  description: z.string().max(500, "Descrição deve ter no máximo 500 caracteres").optional().default(""),
  price: z.number().min(0, "Preço deve ser positivo"),
  category_id: z.string().uuid("ID da categoria deve ser um UUID válido").optional(),
  categoryId: z.string().uuid("ID da categoria deve ser um UUID válido").optional(),
  image: z.string().url("URL da imagem deve ser válida").optional().nullable(),
  available: z.boolean().optional().default(true),
  showImage: z.boolean().optional().default(true),
  sizes: z.array(z.any()).optional().default([]),
  toppings: z.array(z.any()).optional().default([])
}).refine(data => data.category_id || data.categoryId, {
  message: "ID da categoria é obrigatório",
  path: ["category_id"]
});

// Schema para atualização parcial de produto
const productPatchSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres").trim().optional(),
  description: z.string().max(500, "Descrição deve ter no máximo 500 caracteres").optional(),
  price: z.number().min(0, "Preço deve ser positivo").optional(),
  category_id: z.string().uuid("ID da categoria deve ser um UUID válido").optional(),
  categoryId: z.string().uuid("ID da categoria deve ser um UUID válido").optional(),
  image: z.string().url("URL da imagem deve ser válida").optional().nullable(),
  available: z.boolean().optional(),
  showImage: z.boolean().optional(),
  sizes: z.array(z.any()).optional(),
  toppings: z.array(z.any()).optional()
});
// GET - Publicly fetch a specific product
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    frontendLogger.info('Buscando produto por ID', 'api', { productId: params.id });
    
    const productResult = await query(
      'SELECT p.id, p.name, p.description, p.price, p.category_id, p.image, p.active, p.has_sizes, p.has_toppings, p.preparation_time, p.sort_order, p.created_at, p.updated_at, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = $1',
      [params.id]
    );

    if (productResult.rows.length === 0) {
      frontendLogger.warn('Produto não encontrado', 'api', { productId: params.id });
      const response = NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
      return addCorsHeaders(response);
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

    frontendLogger.info('Produto encontrado com sucesso', 'api', { 
      productId: params.id, 
      productName: product.name 
    });
    
    const response = NextResponse.json({ product: normalizedProduct });
    return addCorsHeaders(response);
  } catch (error: any) {
    frontendLogger.logError('Erro ao buscar produto', {
      productId: params.id,
      error: error.message
    }, error, 'api');
    const response = NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

// PUT - Update a product (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Validar autenticação de admin
  const authResult = await validateAdminAuth(request)
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error || 'Acesso negado', 401)
  }
  
  const admin = authResult.user

  try {
    frontendLogger.info('PUT request iniciado para produto', 'api', { 
      productId: params.id,
      adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown'
    });

    // Validação e sanitização dos dados de entrada
    let body;
    try {
      body = await request.json();
    } catch (error) {
      frontendLogger.warn('JSON inválido recebido', 'api', { productId: params.id });
      const response = NextResponse.json(
        { error: "Dados JSON inválidos" },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }

    // Validar dados usando Zod
    const validationResult = productUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0]?.message || 'Dados inválidos';
      frontendLogger.warn('Dados inválidos para atualização de produto', 'api', { 
        productId: params.id,
        error: errorMessage,
        adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown'
      });
      const response = NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }

    const validatedData = validationResult.data;
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
    } = validatedData;

    const finalCategoryId = categoryId || category_id;

    const existsResult = await query(
      'SELECT id FROM products WHERE id = $1',
      [params.id]
    );
    
    if (existsResult.rows.length === 0) {
      const response = NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
      return addCorsHeaders(response);
    }

    // Atualizar produto
    const updateResult = await query(
      `UPDATE products SET 
        name = $1, 
        description = $2, 
        price = $3, 
        category_id = $4, 
        image = $5, 
        active = $6, 
        updated_at = $7
      WHERE id = $8
      RETURNING id, name, description, price, category_id, image, active, has_sizes, has_toppings, preparation_time, sort_order, created_at, updated_at`,
      [
        name.trim(),
        description?.trim() || '',
        price,
        finalCategoryId,
        image || null,
        available !== false,
        new Date().toISOString(),
        params.id
      ]
    );
    
    const updatedProduct = updateResult.rows[0];

    const categoryResult = await query(
      'SELECT name FROM categories WHERE id = $1',
      [updatedProduct.category_id]
    );
    const categoryRow = categoryResult.rows[0] || null;

    const normalizedProduct = {
      ...updatedProduct,
      categoryId: updatedProduct.category_id,
      category_name: categoryRow?.name || "",
      available: Boolean(updatedProduct.active),
      showImage: true,
      productNumber: updatedProduct.sort_order || 0,
      sizes: sizes || [],
      toppings: toppings || []
    };

    frontendLogger.info('Produto atualizado com sucesso', 'api', {
      adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
      productId: params.id,
      productName: name.trim()
    });

    const response = NextResponse.json({ product: normalizedProduct });
    return addCorsHeaders(response);
  } catch (error: any) {
    frontendLogger.logError('Erro ao atualizar produto', {
      error: error.message,
      adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
        productId: params.id
      }, error, 'api');
    const response = NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

export const OPTIONS = createOptionsHandler();

// PATCH - Partially update a product (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Validar autenticação de admin
  const authResult = await validateAdminAuth(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error || 'Acesso negado', 401);
  }
  
  const admin = authResult.user;

  try {
    frontendLogger.info('PATCH request iniciado para produto', 'api', { 
      productId: params.id,
      adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown'
    });

    // Validação e sanitização dos dados de entrada
    let body;
    try {
      body = await request.json();
    } catch (error) {
      frontendLogger.warn('JSON inválido recebido', 'api', { productId: params.id });
      const response = NextResponse.json(
        { error: "Dados JSON inválidos" },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }

    // Validar dados usando Zod
    const validationResult = productPatchSchema.safeParse(body);
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0]?.message || 'Dados inválidos';
      frontendLogger.warn('Dados inválidos para atualização parcial de produto', 'api', { 
        productId: params.id,
        error: errorMessage,
        adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown'
    });
      const response = NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }

    const validatedData = validationResult.data;
    
    // Verificar se há campos para atualizar
    const fieldsToUpdate = Object.keys(validatedData).filter(key => validatedData[key as keyof typeof validatedData] !== undefined);
    if (fieldsToUpdate.length === 0) {
      frontendLogger.warn('Nenhum campo válido para atualização', 'api', { productId: params.id });
      const response = NextResponse.json(
        { error: "Nenhum campo válido para atualização" },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }

    // Construir objeto de atualização
    const updates: any = { updated_at: new Date().toISOString() };
    
    // Mapear campos validados para campos do banco
    if (validatedData.name !== undefined) updates.name = validatedData.name;
    if (validatedData.description !== undefined) updates.description = validatedData.description;
    if (validatedData.price !== undefined) updates.price = validatedData.price;
    if (validatedData.category_id !== undefined) updates.category_id = validatedData.category_id;
    if (validatedData.categoryId !== undefined) updates.category_id = validatedData.categoryId;
    if (validatedData.image !== undefined) updates.image = validatedData.image;
    if (validatedData.available !== undefined) updates.active = validatedData.available;
    if (validatedData.sizes !== undefined) updates.sizes = validatedData.sizes;
    if (validatedData.toppings !== undefined) updates.toppings = validatedData.toppings;

    // Verificar se o produto existe
    const existsResult = await query(
      'SELECT id FROM products WHERE id = $1',
      [params.id]
    );
    
    if (existsResult.rows.length === 0) {
      const response = NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
      addCorsHeaders(response);
      return response;
    }

    // Construir query de atualização dinâmica
    const updateFields = Object.keys(updates).filter(key => key !== 'updated_at');
    const setClause = updateFields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const values = updateFields.map(field => {
      if (field === 'sizes' || field === 'toppings') {
        return JSON.stringify(updates[field]);
      }
      return updates[field];
    });
    values.push(params.id);

    // Atualizar o produto
    const updateResult = await query(
      `UPDATE products SET ${setClause}, updated_at = NOW() WHERE id = $${values.length}
      RETURNING id, name, description, price, category_id, image, active, sizes, toppings, available, show_image, product_number, created_at, updated_at`,
      values
    );
    
    const updatedProduct = updateResult.rows[0];

    // Buscar nome da categoria
    const categoryResult = await query(
      'SELECT name FROM categories WHERE id = $1',
      [updatedProduct.category_id]
    );
    const categoryData = categoryResult.rows[0] || null;

    const normalizedProduct = {
      ...updatedProduct,
      categoryId: updatedProduct.category_id,
      category_name: categoryData?.name || "",
      image: updatedProduct.image,
      available: Boolean(updatedProduct.active || updatedProduct.available),
      showImage: Boolean(updatedProduct.show_image ?? true),
      sizes: updatedProduct.sizes || [],
      toppings: updatedProduct.toppings || []
    };

    frontendLogger.info('Produto atualizado parcialmente com sucesso', 'api', {
      adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
      productId: params.id,
      fieldsUpdated: Object.keys(updates).filter(key => key !== 'updated_at')
    });

    const response = NextResponse.json({ product: normalizedProduct });
    return addCorsHeaders(response);
  } catch (error: any) {
    frontendLogger.logError('Erro ao atualizar produto parcialmente', {
      error: error.message,
      adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
      productId: params.id
    }, error, 'api');
    const response = NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

// DELETE - Delete a product (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Validar autenticação de admin
  const authResult = await validateAdminAuth(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error || 'Acesso negado', 401);
  }
  const admin = authResult.user;

  try {

    frontendLogger.info('Requisição DELETE para produto iniciada', 'api', {
      adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
      productId: params.id
    });
    
    const existsResult = await query(
      'SELECT id, name FROM products WHERE id = $1',
      [params.id]
    );
    
    if (existsResult.rows.length === 0) {
      frontendLogger.warn('Produto não encontrado para exclusão', 'api', {
        adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
        productId: params.id
      });
      const response = NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
      return addCorsHeaders(response);
    }

    const existing = existsResult.rows[0];

    // Soft delete - marcar como inativo
    await query(
      'UPDATE products SET active = false, updated_at = $1 WHERE id = $2',
      [new Date().toISOString(), params.id]
    );

    frontendLogger.info('Produto excluído com sucesso', 'api', {
      adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
      productId: params.id,
      productName: existing.name
    });

    const response = NextResponse.json({
      message: "Produto excluído com sucesso",
      product: { id: params.id, name: existing.name }
    });
    return addCorsHeaders(response);
  } catch (error: any) {
    frontendLogger.logError('Erro ao excluir produto', {
      error: error.message,
      adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
      productId: params.id
    }, error, 'api');

    const response = NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}