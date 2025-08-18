import { NextResponse, type NextRequest } from "next/server"
import { createUser, emailExists } from "@/lib/auth"
import { getSupabaseServerClient } from "@/lib/supabase"
import { checkRateLimit, addRateLimitHeaders } from '@/lib/simple-rate-limit'
import { addCorsHeaders } from '@/lib/auth-utils'
import { validateInput } from '@/lib/input-validation'
import { userRegistrationSchema } from '@/lib/validation-schemas'
import { frontendLogger } from '@/lib/frontend-logger'

export async function POST(request: NextRequest) {
  // Verificar rate limiting
  const rateLimitCheck = await checkRateLimit(request, 'auth')
  if (!rateLimitCheck.allowed) {
    const response = NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente mais tarde.' },
      { status: 429 }
    )
    addCorsHeaders(response)
    return response
  }

  try {
    const rawData = await request.json()

    // Validar e sanitizar dados usando Zod schema
    let validatedData
    try {
      validatedData = userRegistrationSchema.parse({
        ...rawData,
        role: 'admin' // Forçar role admin para esta rota
      })
    } catch (validationError: any) {
      const errorMessage = validationError.errors?.[0]?.message || 'Dados inválidos'
      const response = NextResponse.json({ error: errorMessage }, { status: 400 })
      addCorsHeaders(response)
      return response
    }

    const { full_name, email, password } = validatedData

    // Check if admin registration is allowed (default to true if setting doesn't exist)
    let allowRegistration = true
    try {
      const supabase = getSupabaseServerClient()
      const { data: setting, error } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'allowAdminRegistration')
        .single()
      
      if (!error && setting) {
        const value = setting.setting_value
        allowRegistration = value === "true" || value === true || value === "enabled"
      }
    } catch (error) {
      frontendLogger.info("Admin settings table not found or accessible, allowing registration by default")
      allowRegistration = true
    }

    if (!allowRegistration) {
      return NextResponse.json(
        {
          error: "O cadastro de administradores está desabilitado. Entre em contato com um administrador existente.",
        },
        { status: 403 }
      )
    }

    // Check if email already exists
    const userExists = await emailExists(email)

    if (userExists) {
      return NextResponse.json({ error: "Este email já está cadastrado" }, { status: 400 })
    }

    // Create user with admin role
    const user = await createUser({
      email,
      password,
      full_name,
      role: "admin"
    })

    if (!user) {
      return NextResponse.json({ error: "Erro ao criar usuário administrador" }, { status: 500 })
    }

    frontendLogger.info(`Admin user created successfully: ${user.id}`, {
      adminId: user.id,
      email: user.email?.replace(/(.{2}).*(@.*)/, '$1***$2'), // Anonimizar email
      fullName: user.full_name
    })

    const response = NextResponse.json({
      message: "Administrador criado com sucesso",
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    })
    
    // Adicionar cabeçalhos de rate limit e CORS
    addRateLimitHeaders(response, rateLimitCheck.remaining, rateLimitCheck.resetTime)
    addCorsHeaders(response)
    
    return response
  } catch (error: any) {
    frontendLogger.error("Admin registration API error:", error)
    const response = NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    addCorsHeaders(response)
    return response
  }
}