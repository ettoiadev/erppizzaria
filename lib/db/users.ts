/**
 * Operações de banco de dados relacionadas a usuários
 */

import { getSupabaseServerClient, supabaseAdmin } from '../supabase'

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
  // Usar cliente administrativo para contornar RLS durante autenticação
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null // Usuário não encontrado
    }
    throw error
  }
  
  return data
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