/**
 * Operações de banco de dados relacionadas a categorias
 */

import { getSupabaseServerClient } from '../supabase'

/**
 * Busca categorias
 */
export async function getCategories(includeInactive = false) {
  const supabase = getSupabaseServerClient()
  
  let query = supabase.from('categories').select('*')
  if (!includeInactive) {
    query = query.eq('active', true)
  }
  
  const { data, error } = await query.order('sort_order', { ascending: true, nullsFirst: false })
  if (error) throw error
  return data || []
}

/**
 * Cria nova categoria
 */
export async function createCategory(input: { 
  name: string
  description?: string | null
  image?: string | null
  sort_order?: number | null 
}) {
  const supabase = getSupabaseServerClient()
  
  const payload = {
    name: input.name.trim(),
    description: input.description ?? null,
    image: input.image ?? null,
    sort_order: input.sort_order ?? 0,
    active: true,
  }
  
  const { data, error } = await supabase
    .from('categories')
    .insert(payload)
    .select('*')
    .single()
    
  if (error) throw error
  return data
}

/**
 * Atualiza ordem das categorias
 */
export async function updateCategorySortOrders(categoryOrders: Array<{ id: number; sort_order: number }>) {
  const supabase = getSupabaseServerClient()
  
  // Atualiza em lote iterativamente
  for (const item of categoryOrders) {
    const { error } = await supabase
      .from('categories')
      .update({ sort_order: item.sort_order, updated_at: new Date().toISOString() })
      .eq('id', item.id)
    if (error) throw error
  }
  
  return true
}