import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { generateTokenPair } from "@/lib/refresh-token"
import { createAuthResponse } from "@/lib/auth-middleware"
import { frontendLogger } from '@/lib/frontend-logger'
import { getSupabaseServerClient } from '@/lib/supabase'
import { authRateLimiter } from '@/lib/rate-limiter'
import { appLogger } from '@/lib/logging'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ message: "Login endpoint is working", timestamp: new Date().toISOString(), method: "GET" })
}

export async function POST(request: NextRequest) {
  try {
    appLogger.info('auth', 'Iniciando processo de login')
    
    // Aplicar rate limiting para segurança
    const rateLimitResult = await authRateLimiter(request)
    if (rateLimitResult instanceof NextResponse) {
      appLogger.warn('auth', 'Rate limit atingido para tentativa de login')
      return rateLimitResult
    }

    const body = await request.json()
    const { email, password } = body

    appLogger.debug('auth', 'Dados de login recebidos', { 
      email: email ? email.replace(/(.{2}).*(@.*)/, '$1***$2') : 'undefined',
      hasPassword: !!password 
    })

    // Validar dados
    if (!email || !password) {
      appLogger.warn('auth', 'Tentativa de login com dados inválidos', { 
        hasEmail: !!email, 
        hasPassword: !!password 
      })
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      )
    }

    appLogger.info('auth', 'Tentativa de login', { 
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2') 
    })

    // Buscar usuário
    appLogger.debug('auth', 'Buscando usuário no banco (Supabase)')
    const supabase = getSupabaseServerClient()
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, email, password_hash, full_name, role')
      .eq('email', email)
      .maybeSingle()
    if (error) throw error

    if (!user) {
      appLogger.warn('auth', 'Tentativa de login com usuário inexistente', { 
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2') 
      })
      return NextResponse.json(
        { error: "Email ou senha inválidos" },
        { status: 401 }
      )
    }
    
    appLogger.debug('auth', 'Usuário encontrado', { 
      id: user.id, 
      email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'), 
      role: user.role,
      hasPasswordHash: !!user.password_hash 
    })

    // Verificar senha
    appLogger.debug('auth', 'Verificando senha')
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    
    appLogger.debug('auth', 'Resultado da verificação de senha', { 
      isValid: isValidPassword,
      passwordProvided: !!password,
      hashExists: !!user.password_hash 
    })
    
    if (!isValidPassword) {
      appLogger.warn('auth', 'Tentativa de login com senha inválida', { 
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2') 
      })
      return NextResponse.json(
        { error: "Email ou senha inválidos" },
        { status: 401 }
      )
    }

    // Gerar par de tokens (access + refresh)
    appLogger.info('auth', 'Iniciando geração de tokens')
    
    let tokenPair: any
    try {
      tokenPair = await generateTokenPair({
        id: user.id,
        email: user.email,
        role: user.role || 'customer'
      })
      
      appLogger.info('auth', 'Tokens gerados com sucesso', {
        hasAccessToken: !!tokenPair.accessToken,
        hasRefreshToken: !!tokenPair.refreshToken,
        expiresIn: tokenPair.expiresIn
      })
    } catch (tokenError: any) {
      appLogger.error('auth', 'Erro ao gerar tokens', tokenError, {
        errorType: typeof tokenError,
        errorMessage: tokenError.message,
        errorStack: tokenError.stack
      })
      throw new Error(`Falha na geração de tokens: ${tokenError.message}`)
    }

    frontendLogger.info('Login realizado com sucesso', 'auth', {
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      role: user.role || 'customer',
      accessTokenExpiry: '15min',
      refreshTokenExpiry: '7d'
    })

    const response = createAuthResponse(tokenPair.accessToken, tokenPair.refreshToken, {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role || 'customer'
      },
      expiresIn: tokenPair.expiresIn
    })

    // Adicionar headers CORS na resposta
    response.headers.set('Access-Control-Allow-Origin', 'https://erppizzaria-tau.vercel.app')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin')

    return response

  } catch (error: any) {
    appLogger.error('auth', 'Erro interno no login', error instanceof Error ? error : new Error(String(error)), {
      errorType: typeof error,
      errorValue: String(error)
    })
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  appLogger.debug('auth', 'OPTIONS request received')
  const origin = request.headers.get('origin')
  
  if (origin === 'https://erppizzaria-tau.vercel.app') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Origin',
        'Access-Control-Allow-Credentials': 'true'
      },
    })
  }
  
  return new NextResponse(null, { status: 204 })
}