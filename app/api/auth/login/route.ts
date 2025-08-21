import { NextRequest, NextResponse } from "next/server"
import { frontendLogger } from '@/lib/frontend-logger'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { appLogger } from '@/lib/logging'
import { userLoginSchema } from '@/lib/validation-schemas'
import { addCorsHeaders, createOptionsHandler } from '@/lib/auth-utils'
import { validateAndSanitizeDataDirect, createValidationErrorResponse } from '@/lib/validation-utils'
import { applyRateLimit, createRateLimitErrorResponse } from '@/lib/rate-limit-utils'

export const dynamic = 'force-dynamic'

export async function GET() {
  const response = NextResponse.json({ message: "Login endpoint is working", timestamp: new Date().toISOString(), method: "GET" })
  return addCorsHeaders(response)
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Rate Limiting
    const rateLimitResult = await applyRateLimit(request, 'auth')
    if (!rateLimitResult.success) {
      return createRateLimitErrorResponse(rateLimitResult)
    }

    // 2. Validação e Sanitização
    const body = await request.json()
    const validationResult = await validateAndSanitizeDataDirect(body, userLoginSchema)
    if (!validationResult.success) {
      return createValidationErrorResponse(validationResult.error || 'Dados inválidos')
    }

    const validatedData = validationResult.data as { email: string; password: string }
    
    // 3. Logging da requisição
    appLogger.info('auth', 'Login request received', { email: validatedData.email.replace(/(.{2}).*(@.*)/, '$1***$2') })
    
    const { email, password } = validatedData

    // 4. Verificar se é um login administrativo
    const isAdminLogin = request.url.includes('/admin/login') || request.headers.get('x-admin-login') === 'true'

    // 5. Verificar se o usuário existe e tem permissão administrativa (se necessário)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('email', email)
      .maybeSingle()

    if (profileError) {
      appLogger.error('auth', 'Erro ao buscar perfil do usuário', profileError)
      return NextResponse.json({ error: "Erro ao verificar credenciais" }, { status: 500 })
    }

    if (isAdminLogin && (!profile || profile.role !== 'admin')) {
      appLogger.warn('auth', 'Tentativa de login administrativo com usuário não autorizado', {
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        role: profile?.role
      })
      return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 })
    }

    // 6. Realizar login usando Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      appLogger.warn('auth', 'Falha no login', {
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        error: authError.message
      })
      return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
    }

    // 7. Login bem-sucedido
    appLogger.info('auth', 'Login realizado com sucesso', {
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      role: profile?.role
    })

    // 8. Retornar resposta com tokens do Supabase
    const response = NextResponse.json({
      success: true,
      user: {
        id: authData.user?.id,
        email: authData.user?.email,
        role: profile?.role
      },
      session: authData.session
    })

    // 9. Adicionar cookies de sessão do Supabase
    if (authData.session) {
      response.cookies.set('sb-access-token', authData.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      })

      response.cookies.set('sb-refresh-token', authData.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      })
    }

    return addCorsHeaders(response)

  } catch (error: any) {
    appLogger.error('auth', 'Erro interno no login', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export const OPTIONS = createOptionsHandler()