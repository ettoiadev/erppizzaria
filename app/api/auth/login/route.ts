import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { sign } from 'jsonwebtoken'
import { frontendLogger } from '@/lib/frontend-logger'
import { getSupabaseServerClient } from '@/lib/supabase'
import { appLogger } from '@/lib/logging'
import { userLoginSchema } from '@/lib/validation-schemas'
import { addCorsHeaders, createOptionsHandler } from '@/lib/auth-utils'
import { validateAndSanitizeData, createValidationErrorResponse } from '@/lib/validation-utils'
import { applyRateLimit, createRateLimitErrorResponse } from '@/lib/rate-limit-utils'

export const dynamic = 'force-dynamic'

export async function GET() {
  const response = NextResponse.json({ message: "Login endpoint is working", timestamp: new Date().toISOString(), method: "GET" })
  return addCorsHeaders(response)
}

// Nova função POST integrada (sem middlewares)
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Rate Limiting
    const rateLimitResult = await applyRateLimit(request, 'auth')
    if (!rateLimitResult.success) {
      return createRateLimitErrorResponse(rateLimitResult)
    }

    // 2. Validação e Sanitização
    const body = await request.json()
    const validationResult = await validateAndSanitizeData(body, userLoginSchema)
    if (!validationResult.success) {
      return createValidationErrorResponse(validationResult.errors)
    }

    const validatedData = validationResult.data as { email: string; password: string }
    
    // 3. Logging da requisição
    appLogger.info('auth', 'Login request received', { email: validatedData.email.replace(/(.{2}).*(@.*)/, '$1***$2') })
    frontendLogger.info('Login attempt', 'auth', { email: validatedData.email.replace(/(.{2}).*(@.*)/, '$1***$2') })
  // 4. Validar variáveis de ambiente críticas
    const requiredEnvVars = {
      JWT_SECRET: process.env.JWT_SECRET,
      REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_KEY: process.env.SUPABASE_KEY,
      NODE_ENV: process.env.NODE_ENV
    }
    
    const missingVars = Object.entries(requiredEnvVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key)
    
    if (missingVars.length > 0 && process.env.NODE_ENV === 'production') {
      appLogger.critical('auth', 'Variáveis de ambiente críticas não configuradas', undefined, { missingVars })
      const response = NextResponse.json(
        { error: "Configuração do servidor incompleta" },
        { status: 500 }
      )
      return addCorsHeaders(response)
    }
    
    appLogger.info('auth', 'Variáveis de ambiente validadas', { 
      hasJwtSecret: !!requiredEnvVars.JWT_SECRET,
      hasRefreshSecret: !!requiredEnvVars.REFRESH_TOKEN_SECRET,
      hasSupabaseUrl: !!requiredEnvVars.SUPABASE_URL,
      hasSupabaseKey: !!requiredEnvVars.SUPABASE_KEY,
      nodeEnv: requiredEnvVars.NODE_ENV
    })
    
    const { email, password } = validatedData

    appLogger.debug('auth', 'Dados de login recebidos', { 
      email: email ? email.replace(/(.{2}).*(@.*)/, '$1***$2') : 'undefined',
      hasPassword: !!password 
    })

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
      const response = NextResponse.json(
        { error: "Email ou senha inválidos" },
        { status: 401 }
      )
      return addCorsHeaders(response)
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
      const response = NextResponse.json(
        { error: "Email ou senha inválidos" },
        { status: 401 }
      )
      return addCorsHeaders(response)
    }

    // Gerar apenas access token (sem refresh token para resolver erro 500)
    appLogger.info('auth', 'Iniciando geração de access token (modo simplificado)')
    
    let accessToken: string
    try {
      // Gerar apenas access token sem refresh token
      accessToken = sign(
        {
          id: user.id,
          email: user.email,
          role: user.role || 'customer',
          type: 'access'
        },
        requiredEnvVars.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' } // Token válido por 24 horas
      )
      
      appLogger.info('auth', 'Access token gerado com sucesso', {
        hasAccessToken: !!accessToken,
        expiresIn: '24h'
      })
    } catch (tokenError: any) {
      appLogger.error('auth', 'Erro ao gerar access token', tokenError, {
        errorType: typeof tokenError,
        errorMessage: tokenError.message,
        errorStack: tokenError.stack
      })
      throw new Error(`Falha na geração de access token: ${tokenError.message}`)
    }

    frontendLogger.info('Login realizado com sucesso', 'auth', {
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      role: user.role || 'customer',
      accessTokenExpiry: '24h',
      message: 'Login funcionando (modo simplificado)'
    })

    // Retornar resposta simples sem refresh token
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role || 'customer'
      },
      accessToken,
      expiresIn: 24 * 60 * 60, // 24 horas em segundos
      message: 'Login realizado com sucesso (modo simplificado - sem refresh tokens)'
    })

    return addCorsHeaders(response)

  } catch (error: any) {
    // Log detalhado do erro
    const errorDetails = {
      errorType: typeof error,
      errorMessage: error.message,
      errorStack: error.stack,
      errorCode: error.code,
      errorHint: error.hint,
      errorDetails: error.details,
      timestamp: new Date().toISOString(),
      endpoint: '/api/auth/login',
      method: 'POST'
    }
    
    appLogger.error('auth', 'Erro interno no login', error instanceof Error ? error : new Error(String(error)), errorDetails)
    
    // Em desenvolvimento, retornar mais detalhes
    if (process.env.NODE_ENV === 'development') {
      const response = NextResponse.json(
        { 
          error: "Erro interno do servidor", 
          details: errorDetails 
        },
        { status: 500 }
      )
      return addCorsHeaders(response)
    }
    
    // Em produção, retornar erro genérico
    const response = NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}

// Handler para requisições OPTIONS (CORS)
export async function OPTIONS() {
  return createOptionsHandler()
}