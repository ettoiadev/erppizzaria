/**
 * Operações de banco de dados relacionadas a usuários
 */

import { query } from '../database'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: 'customer' | 'admin' | 'kitchen' | 'delivery'
  password_hash?: string
  phone?: string
  created_at?: string
  updated_at?: string
}

/**
 * Busca usuário por email
 */
export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  const result = await query(`
    SELECT id, email, full_name, role, password_hash, phone, created_at, updated_at
    FROM profiles
    WHERE email = $1
  `, [email.toLowerCase()])
  
  if (result.rows.length === 0) {
    return null // Usuário não encontrado
  }
  
  return result.rows[0] as UserProfile
}

/**
 * Cria novo perfil de usuário
 */
export async function createUserProfile(userData: {
  email: string
  full_name: string
  role?: string
  password_hash: string
  phone?: string
}): Promise<UserProfile | null> {
  const result = await query(`
    INSERT INTO profiles (
      email, full_name, role, password_hash, phone, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, NOW(), NOW()
    ) RETURNING id, email, full_name, role, password_hash, phone, created_at, updated_at
  `, [
    userData.email.toLowerCase(),
    userData.full_name,
    userData.role || 'customer',
    userData.password_hash,
    userData.phone ?? null
  ])

  if (result.rows.length === 0) {
    throw new Error('Failed to create user profile')
  }
  
  return result.rows[0] as UserProfile
}