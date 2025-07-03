import bcrypt from 'bcrypt';
import { query } from './db';
import { sign, verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Idealmente, use uma variável de ambiente

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
  
  // Criar usuário na tabela auth.users
  const userResult = await query(
    'INSERT INTO auth.users (email) VALUES ($1) RETURNING id',
    [email.toLowerCase()]
  );
  
  const userId = userResult.rows[0].id;
  
  // Criar perfil do usuário
  await query(
    'INSERT INTO profiles (id, email, full_name, role, password_hash) VALUES ($1, $2, $3, $4, $5)',
    [userId, email.toLowerCase(), full_name, role, hashedPassword]
  );
  
  return {
    id: userId,
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
  const result = await query(
    'SELECT u.id, u.email, p.full_name, p.role, p.password_hash FROM auth.users u JOIN profiles p ON u.id = p.id WHERE u.email = $1',
    [email.toLowerCase()]
  );
  
  return result.rows[0];
}

export async function verifyAdmin(token: string) {
  const payload = await verifyToken(token);
  if (!payload || typeof payload === 'string' || payload.role !== 'admin') {
    return null;
  }
  return payload;
} 