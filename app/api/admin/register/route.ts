import { NextResponse, type NextRequest } from "next/server"
import { createUser, emailExists } from "@/lib/auth"
import { query } from '@/lib/db'
import { checkRateLimit, addRateLimitHeaders } from '@/lib/simple-rate-limit'
import { addCorsHeaders } from '@/lib/auth-utils'
import { validateInput } from '@/lib/input-validation'
import { userRegistrationSchema } from '@/lib/validation-schemas'
import { frontendLogger } from '@/lib/frontend-logger'
import { createSecureResponse, createSecureErrorResponse, logSuspiciousActivity, validateTrustedOrigin, sanitizeInput } from '@/lib/security-utils'
import { authRateLimit, addRateLimitHeaders as addEnhancedRateLimitHeaders } from '@/lib/enhanced-rate-limiter'

export async function POST(request: NextRequest) {
  // Validar origem confiável
  if (!validateTrustedOrigin(request)) {
    logSuspiciousActivity(request, 'Admin registration attempt from untrusted origin')
    return createSecureErrorResponse('Origem não autorizada', 403, request, 'warn')
  }

  // Enhanced Rate Limiting
  const rateLimitResult = authRateLimit(request)
  if (!rateLimitResult.allowed) {
    const errorResponse = createSecureErrorResponse(
      rateLimitResult.message || 'Muitas tentativas. Tente novamente mais tarde.',
      429,
      request,
      'warn'
    )
    return addEnhancedRateLimitHeaders(errorResponse, request, 'auth')
  }

  try {
    const rawData = await request.json()

    // Sanitizar dados de entrada
    const sanitizedData = sanitizeInput(rawData)

    // Validar e sanitizar dados usando Zod schema
    let validatedData
    try {
      validatedData = userRegistrationSchema.parse({
        ...sanitizedData,
        role: 'admin' // Forçar role admin para esta rota
      })
    } catch (validationError: any) {
      const errorMessage = validationError.errors?.[0]?.message || 'Dados inválidos'
      logSuspiciousActivity(request, 'Invalid admin registration data', { error: errorMessage })
      return createSecureErrorResponse(errorMessage, 400, request, 'warn')
    }

    const { full_name, email, password } = validatedData

    // Check if admin registration is allowed (default to true if setting doesn't exist)
    let allowRegistration = true
    try {
      const result = await query(
        'SELECT setting_value FROM admin_settings WHERE setting_key = $1',
        ['allow_admin_registration']
      )
      
      if (result.rows.length > 0) {
        const value = result.rows[0].setting_value
        allowRegistration = value === "true" || value === true || value === "enabled"
      }
    } catch (error) {
      frontendLogger.info("Admin settings table not found or accessible, allowing registration by default")
      allowRegistration = true
    }

    if (!allowRegistration) {
      logSuspiciousActivity(request, 'Admin registration attempt when disabled')
      return createSecureErrorResponse(
        'O cadastro de administradores está desabilitado. Entre em contato com um administrador existente.',
        403,
        request,
        'warn'
      )
    }

    // Check if email already exists
    const userExists = await emailExists(email)

    if (userExists) {
      logSuspiciousActivity(request, 'Admin registration attempt with existing email', { email: email.replace(/(.{2}).*(@.*)/, '$1***$2') })
      return createSecureErrorResponse('Este email já está cadastrado', 400, request, 'warn')
    }

    // Create user with admin role
    const user = await createUser({
      email,
      password,
      full_name,
      role: "admin"
    })

    if (!user) {
      return createSecureErrorResponse('Erro ao criar usuário administrador', 500, request, 'error')
    }

    frontendLogger.info(`Admin user created successfully: ${user.user.id}`, 'api', {
      adminId: user.user.id,
      email: user.user.email?.replace(/(.{2}).*(@.*)/, '$1***$2'), // Anonimizar email
      fullName: user.user.full_name
    })

    const response = createSecureResponse({
      message: "Administrador criado com sucesso",
      user: {
        id: user.user.id,
        email: user.user.email,
        full_name: user.user.full_name,
        role: user.user.role
      }
    }, 200, request)
    
    // Adicionar cabeçalhos de rate limit
    addRateLimitHeaders(response, request, 'auth')
    addEnhancedRateLimitHeaders(response, request, 'auth')
    
    return response
  } catch (error: any) {
    frontendLogger.logError("Admin registration API error", {
      error: error.message,
      stack: error.stack
    }, error as Error, 'api')
    return createSecureErrorResponse('Erro interno do servidor', 500, request, 'error')
  }
}