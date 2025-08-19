import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { getSupabaseServerClient } from './supabase'

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
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return { success: false, error: 'Token não fornecido' }
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return { success: false, error: 'Configuração JWT inválida' }
    }

    // Verificar token JWT
    const decoded = verify(token, jwtSecret) as any
    
    if (!decoded.userId) {
      return { success: false, error: 'Token inválido' }
    }

    // Buscar usuário no Supabase
    const supabase = getSupabaseServerClient()
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, email, role, full_name')
      .eq('id', decoded.userId)
      .single()

    if (error || !user) {
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
 * Adiciona headers CORS básicos à resposta
 */
export function addCorsHeaders(response: NextResponse, origin?: string): NextResponse {
  const allowedOrigin = origin === 'https://erppizzaria-tau.vercel.app' 
    ? 'https://erppizzaria-tau.vercel.app' 
    : '*'
    
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  
  return response
}

/**
 * Cria handler para OPTIONS com CORS
 */
export function createOptionsHandler(origin?: string) {
  return function OPTIONS(request: NextRequest) {
    const requestOrigin = request.headers.get('origin')
    const allowedOrigin = requestOrigin === 'https://erppizzaria-tau.vercel.app' 
      ? 'https://erppizzaria-tau.vercel.app' 
      : '*'
      
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true'
      }
    })
  }
}

/**
 * Cria uma resposta de autenticação com tokens
 */
export function createAuthResponse(data: any, tokens?: { accessToken: string, refreshToken: string }): NextResponse {
  const response = NextResponse.json(data)
  
  if (tokens) {
    // Definir cookies seguros para os tokens
    response.cookies.set('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7 dias
    })
    
    response.cookies.set('refreshToken', tokens.refreshToken, {
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
  response.cookies.set('accessToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0
  })
  
  response.cookies.set('refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0
  })
  
  return addCorsHeaders(response)
}