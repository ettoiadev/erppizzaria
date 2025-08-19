import { NextResponse, type NextRequest } from "next/server"
import { createUser } from "@/lib/auth"
import { saveCustomerAddress } from "@/lib/db-supabase"
import { frontendLogger } from "@/lib/frontend-logger"
import { checkRateLimit, addRateLimitHeaders } from '@/lib/simple-rate-limit'
import { addCorsHeaders } from '@/lib/auth-utils'
import { userRegistrationSchema } from '@/lib/validation-schemas'

async function registerHandler(request: NextRequest, rateLimitCheck: any) {
  const requestData = await request.json()
  
  // Validar e sanitizar entrada usando Zod schema
  let validatedData
  try {
    validatedData = userRegistrationSchema.parse({
      ...requestData,
      role: 'customer' // Forçar role customer para esta rota
    })
  } catch (validationError: any) {
    const errorMessage = validationError.errors?.[0]?.message || 'Dados inválidos'
    frontendLogger.logError('Dados inválidos no registro', { error: errorMessage }, undefined, 'api')
    const response = NextResponse.json({ error: errorMessage }, { status: 400 })
    addCorsHeaders(response)
    return response
  }

  const { email, password, full_name, phone } = validatedData
  const { address } = requestData // Address não está no schema principal
  
  frontendLogger.info('Tentativa de registro de usuário', 'api', {
    email: email?.substring(0, 3) + '***', // Mascarar email para logs
    hasPassword: !!password,
    hasPhone: !!phone,
    hasAddress: !!address
  })

  // Create user
  frontendLogger.debug('Criando usuário no banco de dados', 'api')
  const user = await createUser({
    email: email.trim(),
    password,
    full_name: full_name.trim(),
    phone: phone ? phone.replace(/\D/g, "") : undefined,
    role: 'customer'
  })

  if (!user) {
    frontendLogger.logError('Falha ao criar usuário - retorno nulo', {}, undefined, 'api')
    return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 })
  }

  frontendLogger.info('Evento de autenticação: usuário criado', 'api', { userId: user.id })
  frontendLogger.info('Usuário criado com sucesso', 'api', { userId: user.id, email: user.email })

  // Save address if provided
  if (address && user.id) {
    try {
      frontendLogger.debug('Salvando endereço do cliente', 'api')
      await saveCustomerAddress(user.id, address)
      frontendLogger.info('Endereço salvo com sucesso', 'api', { userId: user.id })
    } catch (addressError) {
      frontendLogger.logError('Erro ao salvar endereço (não crítico)', { userId: user.id }, addressError as Error, 'api')
      // Não falhar o registro se o endereço falhar
    }
  }

  // Return success response
  return NextResponse.json({
    message: "Usuário criado com sucesso",
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role: user.role
    }
  })
}

// Wrapper com tratamento de erro específico para registro
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
    const result = await registerHandler(request, rateLimitCheck)
    
    // Adicionar cabeçalhos de rate limit apenas se a resposta for de sucesso (status 200/201)
    if (result.status === 200 || result.status === 201) {
      addRateLimitHeaders(result, request, 'auth')
    }
    
    return result
  } catch (error: any) {
    // Handle specific database errors
    if (error.code === '23505') { // Unique constraint violation
      frontendLogger.warn('Tentativa de registro com email duplicado', 'api', {
        errorCode: error.code,
        constraint: error.constraint
      })
      const response = NextResponse.json({ error: "Este email já está em uso" }, { status: 400 })
      addCorsHeaders(response)
      return response
    }
    
    frontendLogger.logError('Erro no registro de usuário', { error: error.message }, error, 'api')
    const response = NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    addCorsHeaders(response)
    return response
  }
}
