/**
 * Operações de banco de dados relacionadas a produtos
 */

import { getSupabaseServerClient } from '../supabase'

export interface Product {
  id: number
  name: string
  description?: string
  price: number
  category_id?: number
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
 * Busca produtos ativos
 */
export async function getProductsActive(): Promise<Product[]> {
  const supabase = getSupabaseServerClient()
  
  const { data, error } = await supabase
    .from('products')
    .select('id, name, description, price, category_id, image, active, sizes, toppings, created_at, updated_at')
    .eq('active', true)
    .order('created_at', { ascending: true })
    
  if (error) {
    console.error('Erro ao buscar produtos:', error)
    throw error
  }

  return (data || []).map((p: any, index: number) => ({
    id: p.id,
    name: p.name || '',
    description: p.description || '',
    price: p.price,
    category_id: p.category_id,
    image: p.image || null,
    active: !!p.active,
    has_sizes: !!(p.sizes && Array.isArray(p.sizes) && p.sizes.length > 0),
    has_toppings: !!(p.toppings && Array.isArray(p.toppings) && p.toppings.length > 0),
    preparation_time: 15, // valor padrão
    sort_order: index + 1,
    created_at: p.created_at,
    updated_at: p.updated_at,
    category_name: '', // será buscado separadamente se necessário
  }))
}

/**
 * Cria novo produto
 */
export async function createProduct(input: {
  name: string
  description?: string
  price: number
  category_id: number
  image?: string | null
  available?: boolean
  sizes?: any[]
  toppings?: any[]
}) {
  const supabase = getSupabaseServerClient()
  
  const payload = {
    name: input.name.trim(),
    description: input.description?.trim() || '',
    price: input.price,
    category_id: input.category_id,
    image: input.image || null,
    active: input.available !== false,
    has_sizes: Array.isArray(input.sizes) && input.sizes.length > 0,
    has_toppings: Array.isArray(input.toppings) && input.toppings.length > 0,
    preparation_time: 30,
  }
  
  const { data, error } = await supabase
    .from('products')
    .insert(payload)
    .select('id, name, description, price, category_id, image, active, has_sizes, has_toppings, preparation_time, sort_order, created_at, updated_at')
    .single()
    
  if (error) throw error

  // Buscar nome da categoria
  const { data: cat, error: catErr } = await supabase
    .from('categories')
    .select('name')
    .eq('id', data.category_id)
    .maybeSingle()
    
  if (catErr) throw catErr

  return {
    ...data,
    image: data.image,
    categoryId: data.category_id,
    category_name: cat?.name || '',
    available: !!data.active,
    showImage: true,
    productNumber: data.sort_order || 0,
    sizes: input.sizes || [],
    toppings: input.toppings || [],
  }
}