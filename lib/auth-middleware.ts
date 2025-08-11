import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { getUserByEmail } from './db-supabase'
import { isTokenNearExpiry } from './refresh-token'
import { frontendLogger } from './logging'

const JWT_SECRET = process.env.JWT_SECRET || 'william-disk-pizza-jwt-secret-2024-production'

interface AuthenticatedUser {
  id: string
  email: string
  role: string
  full_name?: string
}

type AuthenticatedHandler = (
  request: NextRequest,
  user: AuthenticatedUser
) => Promise<NextResponse> | NextResponse

// Extrair usuário do token JWT
export async function getUserFromToken(token: string): Promise<AuthenticatedUser | null> {
  try {
    const decoded = verify(token, JWT_SECRET) as any
    
    if (!decoded || !decoded.email || decoded.type !== 'access') {
      frontendLogger.warn('auth', 'Token inválido - estrutura incorreta', {
        hasEmail: !!decoded?.email,
        tokenType: decoded?.type
      })
      return null
    }

    // Buscar dados atualizados do usuário no banco
    const user = await getUserByEmail(decoded.email)
    
    if (!user) {
      frontendLogger.warn('auth', 'Usuário não encontrado para token válido', {
        email: decoded.email.replace(/(.{2}).*(@.*)/, '$1***$2')
      })
      return null
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name
    }
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      frontendLogger.warn('auth', 'Token expirado')
    } else if (error.name === 'JsonWebTokenError') {
      frontendLogger.warn('auth', 'Token malformado')
    } else {
      frontendLogger.error('auth', 'Erro ao extrair usuário do token', {
        error: error.message
      })
    }
    return null
  }
}

// Verificar permissões específicas
export function hasPermission(userRole: string, requiredRoles: string[]): boolean {
  // Hierarquia de permissões
  const roleHierarchy: Record<string, number> = {
    'customer': 1,
    'kitchen': 2,
    'delivery': 2,
    'manager': 3,
    'admin': 4
  }

  const userLevel = roleHierarchy[userRole] || 0
  const requiredLevel = Math.min(...requiredRoles.map(role => roleHierarchy[role] || 999))
  
  return userLevel >= requiredLevel
}

// Middleware de autenticação geral
export function withAuth(request: NextRequest, handler: AuthenticatedHandler, requiredRoles: string[] = []) {
  return async (): Promise<NextResponse> => {
    try {
      // Obter token apenas do cookie (mais seguro)
      const token = request.cookies.get('auth-token')?.value
      
      if (!token) {
        frontendLogger.warn('auth', 'Acesso negado - token não fornecido', {
          path: request.nextUrl.pathname,
          method: request.method,
          ip: request.ip || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        })
        return NextResponse.json({
          error: 'Token de acesso requerido'
        }, { status: 401 })
      }

      const user = await getUserFromToken(token)
      
      if (!user) {
        frontendLogger.warn('auth', 'Acesso negado - token inválido', {
          path: request.nextUrl.pathname,
          method: request.method,
          ip: request.ip || 'unknown'
        })
        return NextResponse.json({
          error: 'Token inválido ou expirado'
        }, { status: 401 })
      }

      // Verificar permissões se especificadas
      if (requiredRoles.length > 0 && !hasPermission(user.role, requiredRoles)) {
        frontendLogger.warn('auth', 'Acesso negado - permissão insuficiente', {
          email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
          userRole: user.role,
          requiredRoles,
          path: request.nextUrl.pathname,
          method: request.method,
          ip: request.ip || 'unknown'
        })
        return NextResponse.json({
          error: 'Acesso negado. Permissões insuficientes.'
        }, { status: 403 })
      }

      // Verificar se o token está próximo do vencimento
      const nearExpiry = isTokenNearExpiry(token, 5)
      if (nearExpiry) {
        frontendLogger.info('auth', 'Token próximo do vencimento', {
          email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
          path: request.nextUrl.pathname
        })
      }

      frontendLogger.info('auth', 'Acesso autorizado', {
        email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        role: user.role,
        path: request.nextUrl.pathname,
        method: request.method,
        nearExpiry,
        ip: request.ip || 'unknown'
      })

      return handler(request, user)
    } catch (error: any) {
      frontendLogger.error('auth', 'Erro no middleware de autenticação', {
        error: error.message,
        path: request.nextUrl.pathname,
        method: request.method,
        ip: request.ip || 'unknown'
      })
      return NextResponse.json({
        error: 'Erro interno de autenticação'
      }, { status: 500 })
    }
  }
}

// Middleware específico para administradores
export function withAdminAuth(request: NextRequest, handler: AuthenticatedHandler) {
  return withAuth(request, handler, ['admin'])()
}

// Middleware para gerentes e administradores
export function withManagerAuth(request: NextRequest, handler: AuthenticatedHandler) {
  return withAuth(request, handler, ['manager', 'admin'])()
}

// Middleware para cozinha
export function withKitchenAuth(request: NextRequest, handler: AuthenticatedHandler) {
  return withAuth(request, handler, ['kitchen', 'manager', 'admin'])()
}

// Middleware para entregadores
export function withDeliveryAuth(request: NextRequest, handler: AuthenticatedHandler) {
  return withAuth(request, handler, ['delivery', 'manager', 'admin'])()
}

// Função utilitária para extrair usuário do token (sem middleware)
export async function getUserFromRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return null
    }

    return await getUserFromToken(token)
  } catch (error: any) {
    frontendLogger.error('auth', 'Erro ao extrair usuário do token', { 
      error: error.message
    })
    return null
  }
}

// Helper para criar response com cookies de autenticação seguros
export function createAuthResponse(accessToken: string, refreshToken: string, data: any, status = 200): NextResponse {
  const response = NextResponse.json(data, { status })
  
  // Cookie para access token (curta duração)
  response.cookies.set('auth-token', accessToken, {
    httpOnly: true,
    secure: true, // Sempre HTTPS
    sameSite: 'strict', // Proteção CSRF mais rigorosa
    maxAge: 15 * 60, // 15 minutos
    path: '/'
  })

  // Cookie para refresh token (longa duração)
  response.cookies.set('refresh-token', refreshToken, {
    httpOnly: true,
    secure: true, // Sempre HTTPS
    sameSite: 'strict', // Proteção CSRF mais rigorosa
    maxAge: 7 * 24 * 60 * 60, // 7 dias
    path: '/api/auth' // Restrito às rotas de auth
  })

  return response
}

// Helper para remover cookies de autenticação
export function clearAuthResponse(data: any, status = 200): NextResponse {
  const response = NextResponse.json(data, { status })
  
  // Limpar access token
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 0,
    path: '/'
  })

  // Limpar refresh token
  response.cookies.set('refresh-token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 0,
    path: '/api/auth'
  })

  return response
}