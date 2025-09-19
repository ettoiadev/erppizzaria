/**
 * Operações de banco de dados relacionadas a produtos
 */

import { query } from '../database'

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  category_id?: string
  image?: string | null
  active: boolean
  has_sizes?: boolean
  has_toppings?: boolean
  preparation_time?: number
  sort_order?: number | null
  created_at?: string
  updated_at?: string
  category_name?: string
}

/**
 * Busca produtos ativos com informações de categoria
 */
export async function getProductsActive(): Promise<Product[]> {
  const productsQuery = `
    SELECT 
      p.id,
      p.name,
      p.description,
      p.price,
      p.category_id,
      p.image,
      p.active,
      p.sizes,
      p.toppings,
      p.preparation_time,
      p.sort_order,
      p.created_at,
      p.updated_at,
      c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.active = true
    ORDER BY 
      CASE WHEN p.sort_order IS NULL THEN 1 ELSE 0 END,
      p.sort_order ASC,
      p.created_at ASC
  `

  const result = await query(productsQuery)
  const data = result.rows

  return data.map((p: any, index: number) => ({
    id: p.id,
    name: p.name || '',
    description: p.description || '',
    price: p.price,
    category_id: p.category_id,
    image: p.image || null,
    active: !!p.active,
    has_sizes: !!(p.sizes && Array.isArray(p.sizes) && p.sizes.length > 0),
    has_toppings: !!(p.toppings && Array.isArray(p.toppings) && p.toppings.length > 0),
    preparation_time: p.preparation_time || 15,
    sort_order: p.sort_order || (index + 1),
    created_at: p.created_at,
    updated_at: p.updated_at,
    category_name: p.category_name || '',
  }))
}

/**
 * Cria novo produto
 */
export async function createProduct(input: {
  name: string
  description?: string
  price: number
  category_id: string
  image?: string | null
  available?: boolean
  sizes?: any[]
  toppings?: any[]
}) {
  const result = await query(`
    INSERT INTO products (
      name, description, price, category_id, image, active, 
      has_sizes, has_toppings, preparation_time, sizes, toppings,
      created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
    )
    RETURNING id, name, description, price, category_id, image, active, 
             has_sizes, has_toppings, preparation_time, sort_order, 
             created_at, updated_at
  `, [
    input.name.trim(),
    input.description?.trim() || '',
    input.price,
    input.category_id,
    input.image || null,
    input.available !== false,
    Array.isArray(input.sizes) && input.sizes.length > 0,
    Array.isArray(input.toppings) && input.toppings.length > 0,
    30,
    JSON.stringify(input.sizes || []),
    JSON.stringify(input.toppings || [])
  ])
  
  const data = result.rows[0]

  // Buscar nome da categoria
  const catResult = await query(`
    SELECT name FROM categories WHERE id = $1
  `, [data.category_id])
  
  const categoryName = catResult.rows[0]?.name || ''

  return {
    ...data,
    image: data.image,
    categoryId: data.category_id,
    category_name: categoryName,
    available: !!data.active,
    showImage: true,
    productNumber: data.sort_order || 0,
    sizes: input.sizes || [],
    toppings: input.toppings || [],
  }
}