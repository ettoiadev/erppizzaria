import { NextRequest, NextResponse } from "next/server"
import { appLogger } from '@/lib/logging'
import { loginUser } from '@/lib/auth'
import { userLoginSchema } from '@/lib/validation-schemas'
import { addCorsHeaders, createOptionsHandler } from '@/lib/auth-utils'
import { validateAndSanitizeDataDirect, createValidationErrorResponse } from '@/lib/validation-utils'
import { applyRateLimit, createRateLimitErrorResponse } from '@/lib/rate-limit-utils'
import { authRateLimit, addRateLimitHeaders } from '@/lib/enhanced-rate-limiter'
import { createSecureResponse, createSecureErrorResponse, logSuspiciousActivity, validateTrustedOrigin } from '@/lib/security-utils'

// Configurar runtime Node.js para suporte ao módulo crypto
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return createSecureResponse({ 
    message: "Login endpoint is working", 
    timestamp: new Date().toISOString(), 
    method: "GET" 
  }, 200, request)
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Validar origem confiável
    if (!validateTrustedOrigin(request)) {
      logSuspiciousActivity(request, 'Login attempt from untrusted origin')
      return createSecureErrorResponse('Origem não autorizada', 403, request, 'warn')
    }

    // 2. Enhanced Rate Limiting
    const rateLimitResult = authRateLimit(request)
    if (!rateLimitResult.allowed) {
      const errorResponse = createSecureErrorResponse(
        rateLimitResult.message || 'Muitas tentativas de login',
        429,
        request,
        'warn'
      )
      return addRateLimitHeaders(errorResponse, request, 'auth')
    }

    // 3. Validação e Sanitização
    const body = await request.json()
    const validationResult = await validateAndSanitizeDataDirect(body, userLoginSchema)
    if (!validationResult.success) {
      return createValidationErrorResponse(validationResult.error || 'Dados inválidos')
    }

    const validatedData = validationResult.data as { email: string; password: string }
    
    // 4. Logging da requisição
    appLogger.info('auth', 'Login request received', { email: validatedData.email.replace(/(.{2}).*(@.*)/, '$1***$2') })
    
    const { email, password } = validatedData

    // 5. Verificar se é um login administrativo
    const isAdminLogin = request.url.includes('/admin/login') || request.headers.get('x-admin-login') === 'true'

    // 6. Realizar login usando o novo sistema de autenticação
    const authResult = await loginUser(email, password)
    
    // 7. Verificar permissões administrativas se necessário
    if (isAdminLogin && authResult.user.role !== 'admin') {
      logSuspiciousActivity(request, 'Admin login attempt with non-admin user', {
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        role: authResult.user.role
      })
      appLogger.warn('auth', 'Tentativa de login administrativo com usuário não autorizado', {
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        role: authResult.user.role
      })
      return createSecureErrorResponse('Acesso não autorizado', 403, request, 'warn')
    }

    // 8. Login bem-sucedido
    appLogger.info('auth', 'Login realizado com sucesso', {
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      role: authResult.user.role
    })

    // 9. Retornar resposta com JWT token
    const response = createSecureResponse({
      success: true,
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        full_name: authResult.user.full_name,
        role: authResult.user.role,
        phone: authResult.user.phone
      },
      token: authResult.token
    }, 200, request)

    // 10. Adicionar cookie de autenticação JWT
    response.cookies.set('auth-token', authResult.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 dias
    })

    // 11. Adicionar headers de rate limit
    return addRateLimitHeaders(response, request, 'auth')

  } catch (error: any) {
    appLogger.error('auth', 'Erro interno no login', error instanceof Error ? error : new Error(String(error)), { 
      error: error?.message, 
      stack: error?.stack,
      code: error?.code
    })
    
    // Tratamento específico para erros de banco de dados
    if (error?.code === 'ECONNREFUSED' || error?.code === '57P01') {
      return createSecureErrorResponse('Erro de conexão com o banco de dados', 503, request, 'error')
    }
    
    // Tratamento para credenciais inválidas
    if (error?.message === 'Credenciais inválidas') {
      return createSecureErrorResponse('Email ou senha incorretos', 401, request, 'warn')
    }
    
    return createSecureErrorResponse('Erro interno do servidor', 500, request, 'error')
  }
}

// Melhorar o tratamento de CORS para o endpoint de login
export async function OPTIONS(request: NextRequest) {
  const response = NextResponse.json({}, { status: 200 })
  
  // Adicionar headers CORS explicitamente
  response.headers.set('Access-Control-Allow-Origin', process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_SITE_URL || '')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-login')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  
  return response
}