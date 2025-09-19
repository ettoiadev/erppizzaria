import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from './database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Garantir que JWT_SECRET seja uma string válida
if (!JWT_SECRET || JWT_SECRET === 'your-super-secret-jwt-key') {
  console.warn('AVISO: Usando JWT_SECRET padrão. Configure JWT_SECRET no arquivo .env para produção.');
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'customer' | 'admin' | 'kitchen' | 'delivery';
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResult {
  user: User;
  token: string;
}

// Função para hash da senha
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Função para verificar senha
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Função para gerar JWT token
export function generateToken(user: User): string {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };
  
  try {
    return jwt.sign(payload, JWT_SECRET as string, { expiresIn: '7d' });
  } catch (error) {
    console.error('Erro ao gerar token JWT:', error);
    throw new Error('Erro interno do servidor');
  }
}

// Função para verificar JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET as string);
  } catch (error) {
    throw new Error('Token inválido');
  }
}

// Função para registrar usuário
export async function registerUser(userData: {
  email: string;
  password: string;
  full_name: string;
  role?: 'customer' | 'admin' | 'kitchen' | 'delivery';
  phone?: string;
}): Promise<AuthResult> {
  try {
    // Verificar se o email já existe
    const existingUser = await query(
      'SELECT id FROM profiles WHERE email = $1',
      [userData.email]
    );
    
    if (existingUser.rows.length > 0) {
      throw new Error('Email já está em uso');
    }
    
    // Hash da senha
    const hashedPassword = await hashPassword(userData.password);
    
    // Inserir usuário
    const result = await query(
      `INSERT INTO profiles (email, full_name, role, password_hash, phone) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, full_name, role, phone, created_at, updated_at`,
      [
        userData.email,
        userData.full_name,
        userData.role || 'customer',
        hashedPassword,
        userData.phone
      ]
    );
    
    const user = result.rows[0];
    const token = generateToken(user);
    
    return { user, token };
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    throw error;
  }
}

// Função para login
export async function loginUser(email: string, password: string): Promise<AuthResult> {
  try {
    // Buscar usuário por email
    const result = await query(
      `SELECT id, email, full_name, role, phone, password_hash, created_at, updated_at 
       FROM profiles 
       WHERE email = $1`,
      [email]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Credenciais inválidas');
    }
    
    const userWithPassword = result.rows[0];
    
    // Verificar senha
    const isValidPassword = await verifyPassword(password, userWithPassword.password_hash);
    
    if (!isValidPassword) {
      throw new Error('Credenciais inválidas');
    }
    
    // Remover password_hash do objeto user
    const { password_hash, ...user } = userWithPassword;
    
    const token = generateToken(user);
    
    return { user, token };
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    throw error;
  }
}

// Função para obter usuário pelo ID
export async function getUserById(id: string): Promise<User | null> {
  try {
    const result = await query(
      `SELECT id, email, full_name, role, phone, created_at, updated_at 
       FROM profiles 
       WHERE id = $1`,
      [id]
    );
    
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    throw error;
  }
}

// Função para atualizar usuário
export async function updateUser(id: string, userData: {
  full_name?: string;
  phone?: string;
  email?: string;
}): Promise<User> {
  try {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (userData.full_name) {
      updates.push(`full_name = $${paramCount}`);
      values.push(userData.full_name);
      paramCount++;
    }
    
    if (userData.phone) {
      updates.push(`phone = $${paramCount}`);
      values.push(userData.phone);
      paramCount++;
    }
    
    if (userData.email) {
      updates.push(`email = $${paramCount}`);
      values.push(userData.email);
      paramCount++;
    }
    
    if (updates.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }
    
    values.push(id);
    
    const result = await query(
      `UPDATE profiles 
       SET ${updates.join(', ')}, updated_at = NOW() 
       WHERE id = $${paramCount} 
       RETURNING id, email, full_name, role, phone, created_at, updated_at`,
      values
    );
    
    if (result.rows.length === 0) {
      throw new Error('Usuário não encontrado');
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    throw error;
  }
}

// Função para alterar senha
export async function changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
  try {
    // Buscar senha atual
    const result = await query(
      'SELECT password_hash FROM profiles WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Usuário não encontrado');
    }
    
    const { password_hash } = result.rows[0];
    
    // Verificar senha atual
    const isValidPassword = await verifyPassword(currentPassword, password_hash);
    
    if (!isValidPassword) {
      throw new Error('Senha atual incorreta');
    }
    
    // Hash da nova senha
    const hashedNewPassword = await hashPassword(newPassword);
    
    // Atualizar senha
    await query(
      'UPDATE profiles SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hashedNewPassword, id]
    );
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    throw error;
  }
}

// Função para verificar se o usuário tem permissão
export function hasPermission(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}

// Função para extrair token do header Authorization
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

// Função para obter usuário por email
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await query(
      `SELECT id, email, full_name, role, phone, created_at, updated_at 
       FROM profiles 
       WHERE email = $1`,
      [email]
    );
    
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Erro ao buscar usuário por email:', error);
    throw error;
  }
}

// Função para verificar se email existe
export async function emailExists(email: string): Promise<boolean> {
  try {
    const result = await query(
      'SELECT id FROM profiles WHERE email = $1',
      [email]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    console.error('Erro ao verificar email:', error);
    throw error;
  }
}

// Função para criar usuário (alias para registerUser)
export async function createUser(userData: {
  email: string;
  password: string;
  full_name: string;
  role?: 'customer' | 'admin' | 'kitchen' | 'delivery';
  phone?: string;
}): Promise<AuthResult> {
  return registerUser(userData);
}

// Função para verificar se usuário é admin
export async function verifyAdmin(token: string): Promise<User | null> {
  try {
    const decoded = verifyToken(token);
    const user = await getUserById(decoded.id);
    
    if (!user || user.role !== 'admin') {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Erro ao verificar admin:', error);
    return null;
  }
}