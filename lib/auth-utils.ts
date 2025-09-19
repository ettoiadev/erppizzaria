import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { getUserById } from './auth'

interface User {
  id: string
  email: string
  role: string
  full_name?: string
}

interface AuthResult {
  success: boolean
  user?: User
  error?: string
}

/**
 * Extrai e valida o token JWT da requisição
 */
export async function validateAuthToken(request: NextRequest): Promise<AuthResult> {
  try {
    // Tentar obter token do header Authorization primeiro
    const authHeader = request.headers.get('authorization')
    let token = authHeader?.replace('Bearer ', '')
    
    // Se não encontrou no header, tentar obter do cookie
    if (!token) {
      token = request.cookies.get('auth-token')?.value
    }

    if (!token) {
      return { success: false, error: 'Token não fornecido' }
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return { success: false, error: 'Configuração JWT inválida' }
    }

    // Verificar token JWT
    const decoded = verify(token, jwtSecret) as any
    
    if (!decoded.id) {
      return { success: false, error: 'Token inválido' }
    }

    // Buscar usuário no PostgreSQL
    const user = await getUserById(decoded.id)

    if (!user) {
      return { success: false, error: 'Usuário não encontrado' }
    }

    return { success: true, user }
  } catch (error) {
    return { success: false, error: 'Token inválido ou expirado' }
  }
}

/**
 * Valida se o usuário tem role de admin
 */
export async function validateAdminAuth(request: NextRequest): Promise<AuthResult> {
  const authResult = await validateAuthToken(request)
  
  if (!authResult.success || !authResult.user) {
    return authResult
  }

  if (authResult.user.role !== 'admin') {
    return { success: false, error: 'Acesso negado: privilégios de admin necessários' }
  }

  return authResult
}

/**
 * Valida se o usuário tem role de manager
 */
export async function validateManagerAuth(request: NextRequest): Promise<AuthResult> {
  const authResult = await validateAuthToken(request)
  
  if (!authResult.success || !authResult.user) {
    return authResult
  }

  if (!['admin', 'manager'].includes(authResult.user.role)) {
    return { success: false, error: 'Acesso negado: privilégios de gerente necessários' }
  }

  return authResult
}

/**
 * Valida se o usuário tem role de kitchen
 */
export async function validateKitchenAuth(request: NextRequest): Promise<AuthResult> {
  const authResult = await validateAuthToken(request)
  
  if (!authResult.success || !authResult.user) {
    return authResult
  }

  if (!['admin', 'manager', 'kitchen'].includes(authResult.user.role)) {
    return { success: false, error: 'Acesso negado: privilégios de cozinha necessários' }
  }

  return authResult
}

/**
 * Valida se o usuário tem role de delivery
 */
export async function validateDeliveryAuth(request: NextRequest): Promise<AuthResult> {
  const authResult = await validateAuthToken(request)
  
  if (!authResult.success || !authResult.user) {
    return authResult
  }

  if (!['admin', 'manager', 'delivery'].includes(authResult.user.role)) {
    return { success: false, error: 'Acesso negado: privilégios de entrega necessários' }
  }

  return authResult
}

/**
 * Cria resposta de erro de autenticação
 */
export function createAuthErrorResponse(error: string, status: number = 401): NextResponse {
  return NextResponse.json(
    { error, success: false },
    { status }
  )
}

/**
 * Adiciona headers CORS seguros à resposta
 * @deprecated Use applyCorsHeaders from security-utils.ts instead
 */
export function addCorsHeaders(response: NextResponse, origin?: string): NextResponse {
  const { applyCorsHeaders, applySecurityHeaders } = require('./security-utils')
  
  // Usar as novas funções de segurança padronizadas
  applyCorsHeaders(response)
  applySecurityHeaders(response)
  
  return response
}

/**
 * Cria handler para OPTIONS com CORS seguro
 * @deprecated Use createSecureOptionsHandler from security-utils.ts instead
 */
export function createOptionsHandler(origin?: string) {
  const { createSecureOptionsHandler } = require('./security-utils')
  return createSecureOptionsHandler()
}

/**
 * Cria uma resposta de autenticação com tokens
 */
export function createAuthResponse(data: any, tokens?: { accessToken: string, refreshToken: string }): NextResponse {
  const response = NextResponse.json(data)
  
  if (tokens) {
    // Definir cookies seguros para os tokens
    response.cookies.set('auth-token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7 dias
    })
    
    response.cookies.set('refresh-token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30 // 30 dias
    })
  }
  
  return addCorsHeaders(response)
}

/**
 * Limpa os tokens de autenticação dos cookies
 */
export function clearAuthResponse(data: any): NextResponse {
  const response = NextResponse.json(data)
  
  // Limpar cookies de autenticação
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0
  })
  
  response.cookies.set('refresh-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0
  })
  
  return addCorsHeaders(response)
}