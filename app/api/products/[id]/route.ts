import { NextResponse, type NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSupabaseAdmin } from "@/lib/supabase";
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
    const { data: product, error } = await supabase
      .from("products")
      .select(
        `
        *,
        categories:category_id (
          id,
          name
        )
      `
      )
      .eq("id", params.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Produto não encontrado" },
          { status: 404 }
        );
      }
      throw error;
    }

    const normalizedProduct = {
      ...product,
      categoryId: product.category_id,
      category_name: product.categories?.name || "",
      available: Boolean(product.available),
      showImage: Boolean(product.show_image ?? true),
      productNumber: product.product_number,
      sizes: product.sizes
        ? typeof product.sizes === "string"
          ? JSON.parse(product.sizes)
          : product.sizes
        : [],
      toppings: product.toppings
        ? typeof product.toppings === "string"
          ? JSON.parse(product.toppings)
          : product.toppings
        : [],
    };

    return NextResponse.json({ product: normalizedProduct });
  } catch (error) {
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

    const supabaseAdmin = getSupabaseAdmin();
    const { data: updatedProduct, error } = await supabaseAdmin
      .from("products")
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
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Produto não encontrado" },
          { status: 404 }
        );
      }
      throw error;
    }

    const product = updatedProduct;
    const normalizedProduct = {
      ...product,
      categoryId: product.category_id,
      available: Boolean(product.available),
      showImage: Boolean(product.show_image ?? true),
      productNumber: product.product_number,
      sizes: product.sizes
        ? typeof product.sizes === "string"
          ? JSON.parse(product.sizes)
          : product.sizes
        : [],
      toppings: product.toppings
        ? typeof product.toppings === "string"
          ? JSON.parse(product.toppings)
          : product.toppings
        : [],
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
    
    const processedBody = { ...body };
    if (body.categoryId && !body.category_id) {
      processedBody.category_id = body.categoryId;
      delete processedBody.categoryId;
    }
    
    if (body.showImage !== undefined && !body.show_image) {
      processedBody.show_image = body.showImage;
      delete processedBody.showImage;
    }

    const updateData: any = {};
    
    const allowedFields = [
      "name",
      "description",
      "price",
      "category_id",
      "image",
      "available",
      "show_image",
      "sizes",
      "toppings",
    ];
    
    Object.entries(processedBody).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        if ((key === "sizes" || key === "toppings") && Array.isArray(value)) {
          updateData[key] = JSON.stringify(value);
        } else {
          updateData[key] = value;
        }
      }
    });

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Nenhum campo válido para atualização" },
        { status: 400 }
      );
    }

    updateData.updated_at = new Date().toISOString();

    const supabaseAdmin = getSupabaseAdmin();
    const { data: updatedProduct, error } = await supabaseAdmin
      .from("products")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Produto não encontrado" },
          { status: 404 }
        );
      }
      throw error;
    }

    const product = updatedProduct;
    const normalizedProduct = {
      ...product,
      categoryId: product.category_id,
      available: Boolean(product.available),
      showImage: Boolean(product.show_image),
      sizes: product.sizes
        ? typeof product.sizes === "string"
          ? JSON.parse(product.sizes)
          : product.sizes
        : [],
      toppings: product.toppings
        ? typeof product.toppings === "string"
          ? JSON.parse(product.toppings)
          : product.toppings
        : [],
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
    
    const supabaseAdmin = getSupabaseAdmin();

    const { data: deletedProduct, error } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Produto não encontrado" },
          { status: 404 }
        );
      }
      console.error("[DELETE_PRODUCT] Supabase error:", error);
      throw error;
    }

    return NextResponse.json({
      message: "Produto excluído com sucesso",
      product: deletedProduct,
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
