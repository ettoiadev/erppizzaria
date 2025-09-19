import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { sign } from "jsonwebtoken"
import { frontendLogger } from '@/lib/frontend-logger'
import { query } from '@/lib/db'
import { appLogger } from '@/lib/logging'
import { checkRateLimit, addRateLimitHeaders } from '@/lib/simple-rate-limit'
import { validateInput, createValidationErrorResponse } from '@/lib/input-validation'
import { addCorsHeaders } from '@/lib/auth-utils'

// Configurar runtime Node.js para suporte ao módulo crypto
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Verificar rate limiting
  const rateLimitCheck = checkRateLimit(request, 'auth')
  if (!rateLimitCheck.allowed) {
    return rateLimitCheck.response!
  }

  try {
    appLogger.info('auth', 'Iniciando processo de login SIMPLIFICADO')
    
    // Validar variáveis de ambiente críticas
    const JWT_SECRET = process.env.JWT_SECRET
    if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
      appLogger.critical('auth', 'JWT_SECRET não configurado em produção')
      return NextResponse.json(
        { error: "Configuração do servidor incompleta" },
        { status: 500 }
      )
    }
    
    const body = await request.json()
    
    // Validar e sanitizar entrada
    const loginSchema = {
      email: { required: true, type: 'email' as const },
      password: { required: true, type: 'string' as const, minLength: 1 }
    }
    
    const validation = validateInput(body, loginSchema)
    if (!validation.isValid) {
      const response = createValidationErrorResponse(validation.errors)
      addCorsHeaders(response)
      return response
    }

    const { email, password } = validation.sanitizedData

    appLogger.info('auth', 'Tentativa de login simplificado', { 
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2') 
    })

    // Buscar usuário
    const users = await query(
      'SELECT id, email, password_hash, full_name, role FROM profiles WHERE email = $1',
      [email]
    )

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: "Email ou senha inválidos" },
        { status: 401 }
      )
    }

    const user = users[0]
    
    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Email ou senha inválidos" },
        { status: 401 }
      )
    }

    // Gerar apenas access token (sem refresh token)
    const accessToken = sign(
      {
        id: user.id,
        email: user.email,
        role: user.role || 'customer',
        type: 'access'
      },
      JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' } // Token válido por 24 horas
    )

    appLogger.info('auth', 'Login simplificado realizado com sucesso', {
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      role: user.role || 'customer'
    })

    // Retornar resposta simples
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
      message: 'Login realizado com sucesso (modo simplificado)'
    })

    // Adicionar headers CORS
    response.headers.set('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin')

    // Adicionar headers de rate limit
    addRateLimitHeaders(response, request, 'auth')

    return response

  } catch (error: any) {
    appLogger.error('auth', 'Erro no login simplificado', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  
  if (origin === 'http://localhost:3000') {
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
