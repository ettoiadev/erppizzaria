import bcrypt from 'bcrypt';
import { query } from './db';
import { sign, verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'william-disk-pizza-jwt-secret-2024';

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePasswords(password: string, hashedPassword: string) {
  return bcrypt.compare(password, hashedPassword);
}

export async function createUser({ email, password, full_name, role = 'customer' }: {
  email: string;
  password: string;
  full_name: string;
  role?: string;
}) {
  const hashedPassword = await hashPassword(password);
  
  // Criar perfil do usuário diretamente na tabela profiles
  const result = await query(
    'INSERT INTO profiles (email, full_name, role, password_hash) VALUES ($1, $2, $3, $4) RETURNING *',
    [email.toLowerCase(), full_name, role, hashedPassword]
  );
  
  return {
    id: result.rows[0].id,
    email: email.toLowerCase(),
    full_name,
    role
  };
}

export function generateToken(user: any) {
  return sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function verifyToken(token: string) {
  try {
    return verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function getUserByEmail(email: string) {
  try {
    if (!email?.trim()) {
      console.log('getUserByEmail: Email vazio fornecido');
      return null;
    }

    console.log('getUserByEmail: Buscando usuário com email:', email);
    
    const result = await query(
      'SELECT id, email, full_name, role, password_hash FROM profiles WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    
    console.log('getUserByEmail: Resultado da query:', {
      rowCount: result.rowCount,
      hasUser: !!result.rows[0]
    });
    
    const user = result.rows[0];
    
    if (user) {
      console.log('getUserByEmail: Usuário encontrado:', {
        id: user.id,
        email: user.email,
        role: user.role,
        hasPassword: !!user.password_hash
      });
    } else {
      console.log('getUserByEmail: Nenhum usuário encontrado para email:', email);
    }
    
    return user || null;
    
  } catch (error: any) {
    console.error('getUserByEmail: Erro ao buscar usuário:', {
      email,
      error: error.message,
      code: error.code,
      hint: error.hint
    });
    return null;
  }
}

export async function verifyAdmin(token: string) {
  const payload = await verifyToken(token);
  if (!payload || typeof payload === 'string' || payload.role !== 'admin') {
    return null;
  }
  return payload;
} 