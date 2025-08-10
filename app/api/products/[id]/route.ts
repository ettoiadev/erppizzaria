import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from '@/lib/supabase';
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
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('products')
      .select('id, name, description, price, category_id, image, active, has_sizes, has_toppings, preparation_time, sort_order, created_at, updated_at, categories:category_id(name)')
      .eq('id', params.id)
      .maybeSingle();
    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }
    const product = data as any;

    const normalizedProduct = {
      ...product,
      categoryId: product.category_id,
      category_name: product.categories?.name || "",
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

    const supabase = getSupabaseServerClient();
    const { data: exists, error: existsErr } = await supabase.from('products').select('id').eq('id', params.id).maybeSingle();
    if (existsErr) throw existsErr;
    if (!exists) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    // Atualizar produto
    const updates = {
      name: name.trim(),
      description: description?.trim() || '',
      price,
      category_id: finalCategoryId,
      image: image || null,
      active: available !== false,
      updated_at: new Date().toISOString(),
    };
    const { data: updatedProduct, error: updateErr } = await supabase
      .from('products')
      .update(updates)
      .eq('id', params.id)
      .select('id, name, description, price, category_id, image, active, has_sizes, has_toppings, preparation_time, sort_order, created_at, updated_at')
      .single();
    if (updateErr) throw updateErr;

    const { data: categoryRow } = await supabase.from('categories').select('name').eq('id', updatedProduct.category_id).maybeSingle();

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
    
    // Mapeamento de campos permitidos
    const allowedFields = {
      name: 'name',
      description: 'description', 
      price: 'price',
      category_id: 'category_id',
      categoryId: 'category_id',
      image: 'image',
      image: 'image',
      available: 'active',
      active: 'active',
      sizes: 'sizes',
      toppings: 'toppings',
      show_image: 'show_image',
      product_number: 'product_number'
    };

    // Construir objeto de atualização
    const updates: any = {};
    let hasValidFields = false;

    Object.entries(body).forEach(([key, value]) => {
      const dbField = allowedFields[key as keyof typeof allowedFields];
      if (dbField && value !== undefined) {
        updates[dbField] = value;
        hasValidFields = true;
      }
    });

    if (!hasValidFields) {
      return NextResponse.json(
        { error: "Nenhum campo válido para atualização" },
        { status: 400 }
      );
    }

    // Sempre atualizar updated_at
    updates.updated_at = new Date().toISOString();

    const supabase = getSupabaseServerClient();
    
    // Verificar se o produto existe
    const { data: existingProduct, error: existsError } = await supabase
      .from('products')
      .select('id')
      .eq('id', params.id)
      .maybeSingle();
    
    if (existsError) throw existsError;
    
    if (!existingProduct) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    // Atualizar o produto
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update(updates)
      .eq('id', params.id)
      .select('id, name, description, price, category_id, image, active, sizes, toppings, available, show_image, product_number, created_at, updated_at')
      .single();
    
    if (updateError) throw updateError;

    // Buscar nome da categoria
    const { data: categoryData } = await supabase
      .from('categories')
      .select('name')
      .eq('id', updatedProduct.category_id)
      .maybeSingle();

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
    
    const supabase = getSupabaseServerClient();
    const { data: existing, error: existErr } = await supabase.from('products').select('id, name').eq('id', params.id).maybeSingle();
    if (existErr) throw existErr;
    if (!existing) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    const existingProduct = existing;

    // Soft delete - marcar como inativo
    const { error } = await supabase.from('products').update({ active: false, updated_at: new Date().toISOString() }).eq('id', params.id);
    if (error) throw error;

    return NextResponse.json({
      message: "Produto excluído com sucesso",
      product: { id: params.id, name: existing.name }
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