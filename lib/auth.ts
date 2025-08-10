import bcrypt from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import { getUserByEmail, createUserProfile, UserProfile } from './db-supabase';
import { appLogger } from './logging';

const JWT_SECRET = process.env.JWT_SECRET || 'william-disk-pizza-jwt-secret-2024-production';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createUser({ 
  email, 
  password, 
  full_name, 
  phone,
  role = 'customer' 
}: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role?: string;
}): Promise<UserProfile | null> {
  try {
    appLogger.info('auth', 'Criando usuário', { email: email.replace(/(.{2}).*(@.*)/, '$1***$2') });
    
    const hashedPassword = await hashPassword(password);
    
    const user = await createUserProfile({
      email: email.toLowerCase(),
      full_name,
      role,
      password_hash: hashedPassword,
      phone
    });

    if (!user) {
      throw new Error('Falha ao criar usuário');
    }

    appLogger.info('auth', 'Usuário criado com sucesso', { 
      email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      role: user.role 
    });
    
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role: user.role as 'customer' | 'admin' | 'kitchen' | 'delivery'
    };
  } catch (error: any) {
    appLogger.error('auth', 'Erro ao criar usuário', { 
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      error: error.message 
    });
    throw new Error('Erro ao criar conta: ' + error.message);
  }
}

export function generateToken(user: UserProfile): string {
  try {
    appLogger.info('auth', 'Gerando token', { 
      email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      role: user.role 
    });
    
    const token = sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    appLogger.info('auth', 'Token gerado com sucesso', { 
      email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2') 
    });
    return token;
  } catch (error: any) {
    appLogger.error('auth', 'Erro ao gerar token', { 
      email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      error: error.message 
    });
    throw new Error('Erro ao gerar token de autenticação');
  }
}

export async function verifyToken(token: string): Promise<any> {
  try {
    const decoded = verify(token, JWT_SECRET);
    appLogger.debug('auth', 'Token verificado com sucesso');
    return decoded;
  } catch (error: any) {
    appLogger.warn('auth', 'Token inválido', { error: error.message });
    return null;
  }
}

export { getUserByEmail };

export async function verifyAdmin(token: string): Promise<any> {
  try {
    const payload = await verifyToken(token);
    
    if (!payload) {
      return null;
    }

    // Normalizar o payload para usar 'id' consistentemente
    const normalizedPayload = {
      ...payload,
      id: payload.id || payload.userId
    };

    if (normalizedPayload.role !== 'admin' && normalizedPayload.role !== 'ADMIN') {
      return null;
    }

    return normalizedPayload;
  } catch (error: any) {
    appLogger.error('auth', 'Erro ao verificar admin', { error: error.message });
    return null;
  }
}

// Função para validar se email já existe
export async function emailExists(email: string): Promise<boolean> {
  try {
    const user = await getUserByEmail(email);
    return !!user;
  } catch (error) {
    appLogger.error('auth', 'Erro ao verificar email', { 
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      error: error instanceof Error ? error.message : String(error) 
    });
    return false;
  }
}

// Função para login completo
export async function authenticateUser(email: string, password: string): Promise<{
  user: UserProfile;
  token: string;
} | null> {
  try {
    appLogger.info('auth', 'Autenticando usuário', { 
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2') 
    });
    
    // Buscar usuário
    const user = await getUserByEmail(email);
    if (!user) {
      appLogger.warn('auth', 'Usuário não encontrado', { 
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2') 
      });
      return null;
    }

    // Verificar senha
    if (!user.password_hash) {
      appLogger.warn('auth', 'Usuário sem senha configurada', { 
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2') 
      });
      return null;
    }

    const isValidPassword = await comparePasswords(password, user.password_hash);
    if (!isValidPassword) {
      appLogger.warn('auth', 'Senha inválida', { 
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2') 
      });
      return null;
    }

    // Gerar token
    const token = generateToken(user);

    appLogger.info('auth', 'Usuário autenticado com sucesso', { 
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      role: user.role 
    });
    
    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      token
    };
  } catch (error: any) {
    appLogger.error('auth', 'Erro na autenticação', { 
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      error: error.message 
    });
    return null;
  }
}