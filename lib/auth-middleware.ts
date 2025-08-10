import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { getUserByEmail } from './db-supabase'
import { appLogger } from './logging'

const JWT_SECRET = process.env.JWT_SECRET || 'william-disk-pizza-jwt-secret-2024-production'

export interface AuthUser {
  id: string
  email: string
  role: 'customer' | 'admin' | 'kitchen' | 'delivery'
}

// Middleware para verificar autenticação
export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Buscar token no header Authorization ou no cookie
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth-token')?.value
    
    const token = authHeader?.replace('Bearer ', '') || cookieToken

    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticação não fornecido' },
        { status: 401 }
      )
    }

    // Verificar token
    const payload = verify(token, JWT_SECRET) as any
    
    if (!payload || typeof payload === 'string') {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Verificar se usuário ainda existe
    const user = await getUserByEmail(payload.email)
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 401 }
      )
    }

    // Chamar handler com usuário autenticado
    return await handler(request, {
      id: user.id,
      email: user.email,
      role: user.role
    })
  } catch (error: any) {
    appLogger.error('auth', 'Erro na autenticação', { 
      error: error.message,
      hasAuthHeader: !!request.headers.get('authorization'),
      hasCookieToken: !!request.cookies.get('auth-token')?.value
    })
    return NextResponse.json(
      { error: 'Token inválido ou expirado' },
      { status: 401 }
    )
  }
}

// Middleware específico para admin
export async function withAdminAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAuth(request, async (req, user) => {
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem acessar esta rota.' },
        { status: 403 }
      )
    }
    return handler(req, user)
  })
}

// Função utilitária para extrair usuário do token (sem middleware)
export async function getUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth-token')?.value
    
    const token = authHeader?.replace('Bearer ', '') || cookieToken

    if (!token) {
      return null
    }

    const payload = verify(token, JWT_SECRET) as any
    
    if (!payload || typeof payload === 'string') {
      return null
    }

    const user = await getUserByEmail(payload.email)
    if (!user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role
    }
  } catch (error: any) {
    appLogger.error('auth', 'Erro ao extrair usuário do token', { 
      error: error.message,
      hasToken: !!token
    })
    return null
  }
}

// Helper para criar response com cookie de autenticação
export function createAuthResponse(token: string, data: any, status = 200): NextResponse {
  const response = NextResponse.json(data, { status })
  
  // Definir cookie de autenticação
  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 dias
    path: '/'
  })

  return response
}

// Helper para remover cookie de autenticação
export function clearAuthResponse(data: any, status = 200): NextResponse {
  const response = NextResponse.json(data, { status })
  
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  })

  return response
}