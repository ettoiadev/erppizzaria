import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabase, User } from './supabase'

const JWT_SECRET = process.env.JWT_SECRET!

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required')
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(user: User): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

export async function createUser(data: {
  email: string
  password: string
  full_name: string
  phone?: string
  role?: 'customer' | 'admin'
}): Promise<User | null> {
  try {
    const passwordHash = await hashPassword(data.password)
    
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: data.email.toLowerCase(),
        password_hash: passwordHash,
        full_name: data.full_name,
        phone: data.phone,
        role: data.role || 'customer'
      })
      .select()
      .single()

    if (error) throw error
    return user
  } catch (error) {
    console.error('Error creating user:', error)
    return null
  }
}

export async function authenticateUser(email: string, password: string): Promise<{
  user: User
  token: string
} | null> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (error || !user) return null

    const isValid = await comparePasswords(password, user.password_hash)
    if (!isValid) return null

    const token = generateToken(user)
    
    return { user, token }
  } catch (error) {
    console.error('Error authenticating user:', error)
    return null
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return user
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}