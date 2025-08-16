// Exemplo de rota de API usando todos os middlewares de validação e tratamento de erros
import { NextRequest, NextResponse } from 'next/server'
import { withValidation } from '@/lib/validation-middleware'
import { withDatabaseErrorHandling } from '@/lib/database-error-handler'
import { withPresetRateLimit } from '@/lib/rate-limit-middleware'
import { withPresetSanitization } from '@/lib/sanitization-middleware'
import { withErrorMonitoring } from '@/lib/error-monitoring'
import { withApiLogging } from '@/lib/api-logger-middleware'
import { withAuth } from '@/lib/auth-middleware'
import { userRegistrationSchema, userLoginSchema } from '@/lib/validation-schemas'
import { supabase } from '@/lib/supabase'

// Schema específico para esta API
import { z } from 'zod'

const exampleSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  age: z.number().min(18).max(120).optional(),
  preferences: z.object({
    newsletter: z.boolean(),
    notifications: z.boolean()
  }).default({
    newsletter: false,
    notifications: true
  }).optional()
})

// Função principal do handler (sem middlewares)
async function handleCreateUser(
  req: NextRequest,
  validatedData: z.infer<typeof exampleSchema>
): Promise<NextResponse> {
  try {
    // Simular operação de banco de dados
    const { data, error } = await supabase
      .from('users')
      .insert({
        name: validatedData.name,
        email: validatedData.email,
        age: validatedData.age,
        preferences: validatedData.preferences
      })
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({
      success: true,
      data,
      message: 'Usuário criado com sucesso'
    }, { status: 201 })
    
  } catch (error) {
    // O middleware de database error handling vai capturar e tratar este erro
    throw error
  }
}

// Aplicar todos os middlewares em camadas
const enhancedHandler = withErrorMonitoring(
  withApiLogging(
    withPresetRateLimit('public', {}, // Rate limiting para APIs públicas
      withPresetSanitization('userForm', {}, // Sanitização para formulários de usuário
        withValidation(exampleSchema, // Validação usando Zod
          withDatabaseErrorHandling( // Tratamento de erros de banco
            handleCreateUser,
            {
              logErrors: true,
              sanitizeErrors: process.env.NODE_ENV === 'production',
              customErrorMessages: {
                unique_violation: 'Este email já está cadastrado no sistema'
              }
            }
          )
        )
      )
    ),
    {
      logRequests: true,
      logResponses: true,
      logErrors: true
    }
  )
)

// Handler para GET - listar usuários (com autenticação)
async function handleGetUsers(req: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const search = url.searchParams.get('search') || ''
    
    let query = supabase
      .from('users')
      .select('id, name, email, created_at', { count: 'exact' })
      .range((page - 1) * limit, page * limit - 1)
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }
    
    const { data, error, count } = await query
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
    
  } catch (error) {
    throw error
  }
}

// Schema para query parameters do GET
const getUsersQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().max(100).optional()
})

// Handler GET com middlewares
const enhancedGetHandler = withErrorMonitoring(
  withApiLogging(
    withPresetRateLimit('search', {}, // Rate limiting para buscas
      withPresetSanitization('search', {}, // Sanitização para buscas
        withDatabaseErrorHandling(
          handleGetUsers,
          { logErrors: true }
        )
      )
    ),
    { logRequests: true, logResponses: false }
  )
)

// Handler para PUT - atualizar usuário
async function handleUpdateUser(
  req: NextRequest,
  validatedData: Partial<z.infer<typeof exampleSchema>>,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const userId = context.params.id
    
    // Verificar se usuário existe
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()
    
    if (fetchError || !existingUser) {
      return NextResponse.json({
        error: 'Usuário não encontrado'
      }, { status: 404 })
    }
    
    // Atualizar usuário
    const { data, error } = await supabase
      .from('users')
      .update(validatedData)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({
      success: true,
      data,
      message: 'Usuário atualizado com sucesso'
    })
    
  } catch (error) {
    throw error
  }
}

// Schema para parâmetros de rota
const routeParamsSchema = z.object({
  id: z.string().uuid('ID deve ser um UUID válido')
})

// Schema para atualização (campos opcionais)
const updateUserSchema = exampleSchema.partial()

// Handler PUT com middlewares
const enhancedUpdateHandler = withErrorMonitoring(
  withApiLogging(
    withPresetRateLimit('public', {},
      withPresetSanitization('userForm', {},
        withValidation(updateUserSchema,
          withDatabaseErrorHandling(
            handleUpdateUser,
            {
              logErrors: true,
              customErrorMessages: {
                unique_violation: 'Email já está em uso por outro usuário',
                foreign_key_violation: 'Não é possível atualizar devido a dependências'
              }
            }
          )
        )
      )
    ),
    { logRequests: true, logResponses: true }
  )
)

// Handler para DELETE - excluir usuário
async function handleDeleteUser(
  req: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const userId = context.params.id
    
    // Verificar se usuário existe
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, name')
      .eq('id', userId)
      .single()
    
    if (fetchError || !existingUser) {
      return NextResponse.json({
        error: 'Usuário não encontrado'
      }, { status: 404 })
    }
    
    // Excluir usuário
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({
      success: true,
      message: `Usuário ${existingUser.name} excluído com sucesso`
    })
    
  } catch (error) {
    throw error
  }
}

// Handler DELETE com middlewares
const enhancedDeleteHandler = withErrorMonitoring(
  withApiLogging(
    withPresetRateLimit('admin', {}, // Rate limiting mais restritivo para exclusões
      withDatabaseErrorHandling(
        handleDeleteUser,
        {
          logErrors: true,
          customErrorMessages: {
            foreign_key_violation: 'Não é possível excluir usuário com registros dependentes'
          }
        }
      )
    ),
    { logRequests: true, logResponses: true }
  )
)

// Exportar handlers para cada método HTTP
export async function POST(req: NextRequest) {
  return enhancedHandler(req)
}

export async function GET(req: NextRequest) {
  return enhancedGetHandler(req)
}

export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  return enhancedUpdateHandler(req, context)
}

export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  return enhancedDeleteHandler(req, context)
}

// Exemplo de como usar em uma rota específica com configuração customizada
export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  // Handler customizado para PATCH com configurações específicas
  const customHandler = withErrorMonitoring(
    withApiLogging(
      withPresetRateLimit('public', {
        maxRequests: 20, // Limite customizado
        windowMs: 10 * 60 * 1000, // 10 minutos
        message: 'Muitas atualizações. Aguarde 10 minutos.'
      },
        withPresetSanitization('userForm', {
          strictMode: true, // Modo estrito para PATCH
          maxLength: {
            name: 50, // Limite menor para nome
            email: 200
          }
        },
          withValidation(z.object({ name: z.string().min(2).max(100) }), // Apenas nome pode ser atualizado via PATCH
            withDatabaseErrorHandling(
              async (req: NextRequest, validatedData: { name: string }) => {
                const userId = context.params.id
                
                const { data, error } = await supabase
                  .from('users')
                  .update({ name: validatedData.name })
                  .eq('id', userId)
                  .select()
                  .single()
                
                if (error) throw error
                
                return NextResponse.json({
                  success: true,
                  data,
                  message: 'Nome atualizado com sucesso'
                })
              },
              { logErrors: true }
            )
          )
        )
      ),
      {
        logRequests: true,
        logResponses: true
      }
    )
  )
  
  return customHandler(req)
}