import { NextResponse, type NextRequest } from "next/server"
import { createUser } from "@/lib/auth"
import { saveCustomerAddress } from "@/lib/db-supabase"
import { withApiLogging, createApiLogger } from "@/lib/api-logger-middleware"
import { frontendLogger } from "@/lib/frontend-logger"

async function registerHandler(request: NextRequest) {
  const logger = createApiLogger(request)
  
  const { email, password, full_name, phone, address } = await request.json()
  
  frontendLogger.info('Tentativa de registro de usuário', 'api', {
    email: email?.substring(0, 3) + '***', // Mascarar email para logs
    hasPassword: !!password,
    hasPhone: !!phone,
    hasAddress: !!address
  })

  // Validate input
  if (!email?.trim() || !password || !full_name?.trim()) {
    frontendLogger.warn('Dados obrigatórios ausentes no registro', 'api', {
      hasEmail: !!email?.trim(),
      hasPassword: !!password,
      hasFullName: !!full_name?.trim()
    })
    return NextResponse.json({ error: "Email, senha e nome completo são obrigatórios" }, { status: 400 })
  }

  if (password.length < 6) {
    frontendLogger.warn('Senha muito curta no registro', 'api', { passwordLength: password.length })
    return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres" }, { status: 400 })
  }

  // Validate phone if provided
  if (phone) {
    const phoneNumbers = phone.replace(/\D/g, "")
    if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
      frontendLogger.warn('Telefone inválido no registro', 'api', { phoneLength: phoneNumbers.length })
      return NextResponse.json({ error: "Telefone deve ter 10 ou 11 dígitos" }, { status: 400 })
    }
  }

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

  logger.logAuth('user_created', user.id, true)
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
export const POST = withApiLogging(async (request: NextRequest) => {
  try {
    return await registerHandler(request)
  } catch (error: any) {
    const logger = createApiLogger(request)
    
    // Handle specific database errors
    if (error.code === '23505') { // Unique constraint violation
      frontendLogger.warn('Tentativa de registro com email duplicado', 'api', {
        errorCode: error.code,
        constraint: error.constraint
      })
      return NextResponse.json({ error: "Este email já está em uso" }, { status: 400 })
    }
    
    // Log do erro será feito pelo middleware
    throw error
  }
}, {
  logRequests: true,
  logResponses: true,
  logErrors: true,
  sensitiveRoutes: ['/api/auth']
})
