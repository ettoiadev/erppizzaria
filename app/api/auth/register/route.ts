import { NextResponse, type NextRequest } from "next/server"
import { createUser } from "@/lib/auth"
import { saveCustomerAddress } from "@/lib/db-supabase"
import { withApiLogging, createApiLogger } from "@/lib/api-logger-middleware"

async function registerHandler(request: NextRequest) {
  const logger = createApiLogger(request)
  
  const { email, password, full_name, phone, address } = await request.json()
  
  logger.info('api', 'Tentativa de registro de usuário', {
    email: email?.substring(0, 3) + '***', // Mascarar email para logs
    hasPassword: !!password,
    hasPhone: !!phone,
    hasAddress: !!address
  })

  // Validate input
  if (!email?.trim() || !password || !full_name?.trim()) {
    logger.warn('api', 'Dados obrigatórios ausentes no registro', {
      hasEmail: !!email?.trim(),
      hasPassword: !!password,
      hasFullName: !!full_name?.trim()
    })
    return NextResponse.json({ error: "Email, senha e nome completo são obrigatórios" }, { status: 400 })
  }

  if (password.length < 6) {
    logger.warn('api', 'Senha muito curta no registro', { passwordLength: password.length })
    return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres" }, { status: 400 })
  }

  // Validate phone if provided
  if (phone) {
    const phoneNumbers = phone.replace(/\D/g, "")
    if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
      logger.warn('api', 'Telefone inválido no registro', { phoneLength: phoneNumbers.length })
      return NextResponse.json({ error: "Telefone deve ter 10 ou 11 dígitos" }, { status: 400 })
    }
  }

  // Create user
  logger.debug('api', 'Criando usuário no banco de dados')
  const user = await createUser({
    email: email.trim(),
    password,
    full_name: full_name.trim(),
    phone: phone ? phone.replace(/\D/g, "") : undefined,
    role: 'customer'
  })

  if (!user) {
    logger.error('api', 'Falha ao criar usuário - retorno nulo')
    return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 })
  }

  logger.logAuth('user_created', user.id, true)
  logger.info('api', 'Usuário criado com sucesso', { userId: user.id, email: user.email })

  // Save address if provided
  if (address && user.id) {
    try {
      logger.debug('api', 'Salvando endereço do cliente')
      await saveCustomerAddress(user.id, address)
      logger.info('api', 'Endereço salvo com sucesso', { userId: user.id })
    } catch (addressError) {
      logger.warn('api', 'Erro ao salvar endereço (não crítico)', addressError, { userId: user.id })
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
      logger.warn('api', 'Tentativa de registro com email duplicado', {
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
