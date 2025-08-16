/**
 * Operações de banco de dados relacionadas a usuários
 */

import { getSupabaseServerClient } from '../supabase'

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
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, password_hash, phone, created_at, updated_at')
    .eq('email', email.toLowerCase().trim())
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data as UserProfile | null
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
  const supabase = getSupabaseServerClient()
  const insert = {
    email: userData.email.toLowerCase(),
    full_name: userData.full_name,
    role: userData.role || 'customer',
    password_hash: userData.password_hash,
    phone: userData.phone ?? null,
  }
  const { data, error } = await supabase
    .from('profiles')
    .insert(insert)
    .select('id, email, full_name, role, password_hash, phone, created_at, updated_at')
    .single()

  if (error) throw error
  return data as UserProfile
}