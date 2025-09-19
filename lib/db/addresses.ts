/**
 * Operações de banco de dados relacionadas a endereços
 */

import { query } from '../database'

/**
 * Lista endereços de um usuário
 */
export async function listAddresses(userId: string) {
  const result = await query(`
    SELECT id, user_id, label, street, number, complement, neighborhood, 
           city, state, zip_code, is_default, created_at, updated_at
    FROM customer_addresses
    WHERE user_id = $1
    ORDER BY is_default DESC, created_at DESC
  `, [userId])
  
  return result.rows
}

/**
 * Cria novo endereço
 */
export async function createAddress(input: { 
  user_id: string
  label: string
  street: string
  number: string
  complement?: string | null
  neighborhood: string
  city: string
  state: string
  zip_code: string
  is_default?: boolean 
}) {
  if (input.is_default) {
    await query(`
      UPDATE customer_addresses SET is_default = false WHERE user_id = $1
    `, [input.user_id])
  }
  
  const result = await query(`
    INSERT INTO customer_addresses (
      user_id, label, street, number, complement, neighborhood, 
      city, state, zip_code, is_default, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
    )
    RETURNING id, user_id, label, street, number, complement, neighborhood, 
             city, state, zip_code, is_default, created_at, updated_at
  `, [
    input.user_id,
    input.label || 'Endereço',
    input.street,
    input.number,
    input.complement ?? '',
    input.neighborhood,
    input.city,
    input.state,
    input.zip_code,
    input.is_default || false
  ])
  
  return result.rows[0]
}

/**
 * Busca endereço por ID
 */
export async function getAddressById(id: string) {
  const result = await query(`
    SELECT id, user_id, label, street, number, complement, neighborhood, 
           city, state, zip_code, is_default, created_at, updated_at
    FROM customer_addresses
    WHERE id = $1
  `, [id])
  
  if (result.rows.length === 0) return null
  return result.rows[0]
}

/**
 * Atualiza endereço
 */
export async function updateAddress(id: string, input: { 
  is_default?: boolean
  label?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  zip_code?: string 
}) {
  // Buscar user_id para remoção de outros padrões
  const foundResult = await query(`
    SELECT user_id FROM customer_addresses WHERE id = $1
  `, [id])
  
  if (foundResult.rows.length === 0) return null
  const found = foundResult.rows[0]
  
  if (input.is_default) {
    await query(`
      UPDATE customer_addresses 
      SET is_default = false 
      WHERE user_id = $1 AND id != $2
    `, [found.user_id, id])
  }
  
  // Construir query dinâmica
  const fields = []
  const values = []
  let paramIndex = 1
  
  if (input.label !== undefined) {
    fields.push(`label = $${paramIndex++}`)
    values.push(input.label)
  }
  if (input.street !== undefined) {
    fields.push(`street = $${paramIndex++}`)
    values.push(input.street)
  }
  if (input.number !== undefined) {
    fields.push(`number = $${paramIndex++}`)
    values.push(input.number)
  }
  if (input.complement !== undefined) {
    fields.push(`complement = $${paramIndex++}`)
    values.push(input.complement)
  }
  if (input.neighborhood !== undefined) {
    fields.push(`neighborhood = $${paramIndex++}`)
    values.push(input.neighborhood)
  }
  if (input.city !== undefined) {
    fields.push(`city = $${paramIndex++}`)
    values.push(input.city)
  }
  if (input.state !== undefined) {
    fields.push(`state = $${paramIndex++}`)
    values.push(input.state)
  }
  if (input.zip_code !== undefined) {
    fields.push(`zip_code = $${paramIndex++}`)
    values.push(input.zip_code)
  }
  if (input.is_default !== undefined) {
    fields.push(`is_default = $${paramIndex++}`)
    values.push(input.is_default)
  }
  
  fields.push(`updated_at = NOW()`)
  values.push(id)
  
  const result = await query(`
    UPDATE customer_addresses 
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING id, user_id, label, street, number, complement, neighborhood, 
             city, state, zip_code, is_default, created_at, updated_at
  `, values)
  
  return result.rows[0]
}

/**
 * Exclui endereço
 */
export async function deleteAddress(id: string) {
  // Verificar se é padrão e se há outros
  const foundResult = await query(`
    SELECT is_default, user_id FROM customer_addresses WHERE id = $1
  `, [id])
  
  if (foundResult.rows.length === 0) return { success: true }
  const found = foundResult.rows[0]

  if (found.is_default) {
    const totalResult = await query(`
      SELECT COUNT(*) as count FROM customer_addresses WHERE user_id = $1
    `, [found.user_id])
    
    const hasOthers = parseInt(totalResult.rows[0].count) > 1
    if (hasOthers) {
      throw new Error('Não é possível excluir o endereço padrão. Defina outro endereço como padrão primeiro.')
    }
  }

  await query(`DELETE FROM customer_addresses WHERE id = $1`, [id])
  return { success: true }
}

/**
 * Salva endereço do cliente
 */
export async function saveCustomerAddress(userId: string, addressData: any): Promise<boolean> {
  // Remover padrão de outros endereços
  await query(`
    UPDATE customer_addresses SET is_default = false WHERE user_id = $1
  `, [userId])
  
  // Inserir novo endereço
  await query(`
    INSERT INTO customer_addresses (
      user_id, label, zip_code, street, neighborhood, city, state, 
      number, complement, is_default, created_at, updated_at
    ) VALUES (
      $1, 'Endereço Principal', $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW()
    )
  `, [
    userId,
    addressData.zipCode,
    addressData.street,
    addressData.neighborhood,
    addressData.city,
    addressData.state,
    addressData.number,
    addressData.complement || ''
  ])
  
  return true
}