/**
 * Operações de banco de dados relacionadas a categorias
 */

import { query } from '../database'

/**
 * Busca categorias
 */
export async function getCategories(includeInactive = false) {
  let sql = `
    SELECT id, name, description, image, sort_order, active, created_at, updated_at
    FROM categories
  `
  
  const params: any[] = []
  if (!includeInactive) {
    sql += ` WHERE active = true`
  }
  
  sql += ` ORDER BY sort_order ASC NULLS LAST`
  
  const result = await query(sql, params)
  return result.rows
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
  const result = await query(`
    INSERT INTO categories (
      name, description, image, sort_order, active, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, true, NOW(), NOW()
    )
    RETURNING id, name, description, image, sort_order, active, created_at, updated_at
  `, [
    input.name.trim(),
    input.description ?? null,
    input.image ?? null,
    input.sort_order ?? 0
  ])
  
  return result.rows[0]
}

/**
 * Atualiza ordem das categorias
 */
export async function updateCategorySortOrders(categoryOrders: Array<{ id: string; sort_order: number }>) {
  // Atualiza em lote iterativamente
  for (const item of categoryOrders) {
    await query(`
      UPDATE categories 
      SET sort_order = $1, updated_at = NOW()
      WHERE id = $2
    `, [item.sort_order, item.id])
  }
  
  return true
}