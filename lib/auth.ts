import bcrypt from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import { getUserByEmail, createUserProfile, UserProfile } from './supabase-integration';
import { getSupabaseAdmin } from './supabase';

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
  role = 'customer' 
}: {
  email: string;
  password: string;
  full_name: string;
  role?: string;
}): Promise<UserProfile | null> {
  try {
    console.log('🔐 Criando usuário:', email);
    
    const hashedPassword = await hashPassword(password);
    let supabaseUserId: string | null = null;

    // Se for admin, criar também no Supabase Auth
    if (role === 'admin') {
      console.log('👤 Criando admin no Supabase Auth...');
      
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: { 
          nome: full_name,
          role: 'admin'
        }
      });

      if (error) {
        console.error('❌ Erro ao criar usuário no Supabase Auth:', error);
        throw new Error('Falha ao criar usuário no sistema de autenticação');
      }

      supabaseUserId = data.user?.id || null;
      console.log('✅ Usuário criado no Supabase Auth:', supabaseUserId);
    }
    
    const user = await createUserProfile({
      email: email.toLowerCase(),
      full_name,
      role,
      password_hash: hashedPassword
    });

    if (!user) {
      throw new Error('Falha ao criar usuário');
    }

    // Se criamos no Supabase Auth, sincronizar o user_id
    if (supabaseUserId && role === 'admin') {
      console.log('🔄 Sincronizando user_id...');
      
      const supabaseAdmin = getSupabaseAdmin();
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ user_id: supabaseUserId })
        .eq('email', email.toLowerCase());

      if (updateError) {
        console.error('⚠️ Erro ao sincronizar user_id:', updateError);
      } else {
        console.log('✅ user_id sincronizado com sucesso!');
      }
    }

    console.log('✅ Usuário criado com sucesso:', user.email);
    
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role as 'customer' | 'admin' | 'kitchen' | 'delivery'
    };
  } catch (error: any) {
    console.error('❌ Erro ao criar usuário:', error.message);
    throw new Error('Erro ao criar conta: ' + error.message);
  }
}

export function generateToken(user: UserProfile): string {
  try {
    console.log('🎫 Gerando token para:', user.email);
    
    const token = sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Token gerado com sucesso');
    return token;
  } catch (error: any) {
    console.error('❌ Erro ao gerar token:', error.message);
    throw new Error('Erro ao gerar token de autenticação');
  }
}

export async function verifyToken(token: string): Promise<any> {
  try {
    const decoded = verify(token, JWT_SECRET);
    console.log('✅ Token verificado com sucesso');
    return decoded;
  } catch (error: any) {
    console.error('❌ Token inválido:', error.message);
    return null;
  }
}

export { getUserByEmail };

export async function verifyAdmin(token: string): Promise<any> {
  try {
    const payload = await verifyToken(token);
    
    if (!payload || typeof payload === 'string' || payload.role !== 'admin') {
      console.log('❌ Token não é de administrador');
      return null;
    }

    console.log('✅ Admin verificado:', payload.email);
    return payload;
  } catch (error: any) {
    console.error('❌ Erro ao verificar admin:', error.message);
    return null;
  }
}

// Função para validar se email já existe
export async function emailExists(email: string): Promise<boolean> {
  try {
    const user = await getUserByEmail(email);
    return !!user;
  } catch (error) {
    console.error('❌ Erro ao verificar email:', error);
    return false;
  }
}

// Função para login completo
export async function authenticateUser(email: string, password: string): Promise<{
  user: UserProfile;
  token: string;
} | null> {
  try {
    console.log('🔐 Autenticando usuário:', email);
    
    // Buscar usuário
    const user = await getUserByEmail(email);
    if (!user) {
      console.log('❌ Usuário não encontrado');
      return null;
    }

    // Verificar senha
    if (!user.password_hash) {
      console.log('❌ Usuário sem senha configurada');
      return null;
    }

    const isValidPassword = await comparePasswords(password, user.password_hash);
    if (!isValidPassword) {
      console.log('❌ Senha inválida');
      return null;
    }

    // Gerar token
    const token = generateToken(user);

    console.log('✅ Usuário autenticado com sucesso');
    
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
    console.error('❌ Erro na autenticação:', error.message);
    return null;
  }
} 