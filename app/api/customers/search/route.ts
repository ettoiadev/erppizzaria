import { NextRequest, NextResponse } from "next/server"
import { query } from '@/lib/postgresql'
import { addCorsHeaders, createOptionsHandler } from '@/lib/auth-utils'
import { frontendLogger } from '@/lib/frontend-logger'
import { userRegistrationSchema } from '@/lib/validation-schemas'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Schema para validação de parâmetros de busca
const customerSearchSchema = z.object({
  q: z.string().optional().transform(val => val?.trim() || ''),
  code: z.string().optional().transform(val => val?.trim() || ''),
  limit: z.string().optional().transform(val => {
    const num = parseInt(val || '10')
    return isNaN(num) ? 10 : Math.min(Math.max(num, 1), 50)
  })
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validar parâmetros de busca
    const validationResult = customerSearchSchema.safeParse({
      q: searchParams.get('q'),
      code: searchParams.get('code'),
      limit: searchParams.get('limit')
    })
    
    if (!validationResult.success) {
      frontendLogger.warn('Parâmetros de busca inválidos', 'api', { errors: validationResult.error.errors })
      const response = NextResponse.json({
        error: "Parâmetros de busca inválidos",
        details: validationResult.error.errors
      }, { status: 400 })
      return addCorsHeaders(response)
    }
    
    const { q: searchTerm, code: codeSearch, limit } = validationResult.data

    frontendLogger.info('Busca de clientes iniciada', 'api', { searchTerm, codeSearch, limit })

    // Se não há termo de busca nem código, retornar vazio
    if (!searchTerm && !codeSearch) {
      const response = NextResponse.json({ customers: [] })
      return addCorsHeaders(response)
    }

    // Função para normalizar strings (remover acentos, converter para minúsculas)
    const normalizeString = (str: string) => {
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .trim()
    }

    const normalizedSearchTerm = normalizeString(searchTerm)
    const phoneOnlyNumbers = searchTerm.replace(/\D/g, '') // Apenas números do telefone

    frontendLogger.info('Parâmetros de busca processados', 'api', { normalizedSearchTerm, phoneOnlyNumbers, codeSearch })

    const profiles = await query(
      'SELECT id, full_name, phone, email, customer_code, created_at FROM profiles WHERE role = $1 ORDER BY created_at DESC',
      ['customer']
    )
    frontendLogger.info('Perfis carregados do banco', 'api', { totalProfiles: profiles.rows.length })

    // Filtrar e processar clientes no frontend
    const matchingCustomers = []
    
    for (const profile of profiles.rows) {
      try {
        const normalizedName = normalizeString(profile.full_name || '')
        const normalizedEmail = normalizeString(profile.email || '')
        const profilePhoneNumbers = (profile.phone || '').replace(/\D/g, '')

        // Verificar se há match
        let shouldInclude = false

        if (codeSearch) {
          // Busca específica por código
          const codeMatch = profile.customer_code && profile.customer_code.toUpperCase().includes(codeSearch.toUpperCase())
          shouldInclude = codeMatch
        } else {
          // Busca normal por nome, email, telefone ou código
          const nameMatch = normalizedName.includes(normalizedSearchTerm)
          const emailMatch = normalizedEmail.includes(normalizedSearchTerm)
          const phoneMatch = phoneOnlyNumbers && profilePhoneNumbers.includes(phoneOnlyNumbers)
          const codeMatch = profile.customer_code && profile.customer_code.toUpperCase().includes(searchTerm.toUpperCase())
          
          shouldInclude = nameMatch || emailMatch || phoneMatch || codeMatch
        }

        if (shouldInclude) {
          const addressRows = await query(
            'SELECT street, number, neighborhood, city, state, complement, zip_code, is_default, created_at FROM customer_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC LIMIT 1',
            [profile.id]
          )
          const address = addressRows.rows.length > 0 ? addressRows.rows[0] : null
          
          // Montar endereço completo
          let fullAddress = 'Endereço não cadastrado'
          if (address) {
            const parts = [
              address.street,
              address.number,
              address.neighborhood,
              address.city,
              address.state
            ].filter(Boolean)
            
            if (parts.length > 0) {
              fullAddress = parts.join(', ')
            }
          }

          const orderRows = await query(
            'SELECT total FROM orders WHERE user_id = $1',
            [profile.id]
          )
          const totalOrders = (orderRows.rows || []).length
          const totalSpent = (orderRows.rows || []).reduce((sum: number, o: any) => sum + Number(o.total || 0), 0)

          matchingCustomers.push({
            id: profile.id,
            customer_code: profile.customer_code,
            name: profile.full_name || 'Nome não informado',
            phone: profile.phone || 'Telefone não informado',
            email: profile.email || 'Email não informado',
            address: fullAddress,
            totalOrders,
            totalSpent,
            createdAt: profile.created_at,
            // Destacar o termo encontrado
            matchType: ((): 'name' | 'email' | 'phone' => {
              if (codeSearch) return 'name'
              const nameMatch = normalizedName.includes(normalizedSearchTerm)
              const emailMatch = normalizedEmail.includes(normalizedSearchTerm)
              return nameMatch ? 'name' : emailMatch ? 'email' : 'phone'
            })()
          })

          // Limitar resultados
          if (matchingCustomers.length >= limit) {
            break
          }
        }
      } catch (error) {
          frontendLogger.warn('Erro ao processar cliente', 'api', { profileId: profile.id, error })
        }
      }

      frontendLogger.info('Busca de clientes concluída', 'api', {
        totalFound: matchingCustomers.length,
        searchTerm,
        codeSearch
      })

      const response = NextResponse.json({
        customers: matchingCustomers,
        total: matchingCustomers.length,
        searchTerm: searchTerm
      })
      return addCorsHeaders(response)

    } catch (error: any) {
      frontendLogger.logError(
        'Erro na busca de clientes',
        error instanceof Error ? error.stack : undefined,
        error instanceof Error ? error : undefined,
        'api'
      )
      const response = NextResponse.json({
        error: "Erro interno do servidor",
        message: "Não foi possível realizar a busca",
        customers: [] 
      }, { status: 500 })
      return addCorsHeaders(response)
    }
  }

export async function POST(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch (error) {
      const response = NextResponse.json({
        error: "JSON inválido"
      }, { status: 400 })
      return addCorsHeaders(response)
    }

    frontendLogger.info('Criando novo cliente', 'api', {
      name: body.name,
      phone: body.phone,
      email: body.email
    })

    // Validar e sanitizar dados usando Zod
    const validationResult = userRegistrationSchema.safeParse({
      ...body,
      role: 'customer' // Forçar role customer
    })
    
    if (!validationResult.success) {
      frontendLogger.warn('Dados inválidos para criação de cliente', 'api', {
        errors: validationResult.error.errors
      })
      const response = NextResponse.json({
        error: "Dados inválidos",
        details: validationResult.error.errors
      }, { status: 400 })
      return addCorsHeaders(response)
    }

    const validatedData = validationResult.data
    const { full_name: name, phone, email } = validatedData

    const existingByPhone = await query(
      'SELECT id FROM profiles WHERE phone = $1 AND role = $2 LIMIT 1',
      [phone, 'customer']
    )
    if (existingByPhone.rows.length > 0) {
      frontendLogger.warn('Tentativa de criar cliente com telefone duplicado', 'api', { phone })
      const response = NextResponse.json({ 
        error: "Já existe um cliente cadastrado com este telefone" 
      }, { status: 400 })
      return addCorsHeaders(response)
    }

    // Gerar email se não fornecido
    const cleanPhone = phone?.replace(/\D/g, '') || ''
    const customerEmail = email?.trim() || `cliente_${cleanPhone}@temp.williamdiskpizza.com`

    const existingByEmail = await query(
      'SELECT id FROM profiles WHERE email = $1 LIMIT 1',
      [customerEmail]
    )
    if (existingByEmail.rows.length > 0) {
      frontendLogger.warn('Tentativa de criar cliente com email duplicado', 'api', { email: customerEmail })
      const response = NextResponse.json({ 
        error: "Este e-mail já está cadastrado" 
      }, { status: 400 })
      return addCorsHeaders(response)
    }

    const newCustomerRows = await query(
      'INSERT INTO profiles (email, full_name, role, password_hash, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, phone, customer_code, created_at',
      [customerEmail, name.trim(), 'customer', '$2b$10$defaulthashforcustomer', phone]
    )
    const newCustomer = newCustomerRows.rows[0]

    frontendLogger.info('Cliente criado com sucesso', 'api', {
      customerId: newCustomer.id,
      customerCode: newCustomer.customer_code
    })

    // Endereço será criado posteriormente se necessário

    const response = NextResponse.json({
      success: true,
      message: "Cliente criado com sucesso",
      customer: {
        id: newCustomer.id,
        customer_code: newCustomer.customer_code,
        name: newCustomer.full_name,
        phone: newCustomer.phone,
        email: newCustomer.email,
        address: 'Endereço não cadastrado',
        totalOrders: 0,
        totalSpent: 0,
        createdAt: newCustomer.created_at
      }
    })
    return addCorsHeaders(response)

  } catch (error: any) {
    frontendLogger.logError('Erro ao criar cliente', 'api', {
      message: error?.message || 'Erro desconhecido',
      stack: error?.stack,
      name: error?.name || 'Error'
    })
    const response = NextResponse.json({
      error: "Erro interno do servidor",
      message: "Não foi possível criar o cliente",
      details: error.message
    }, { status: 500 })
    return addCorsHeaders(response)
  }
}

export const OPTIONS = createOptionsHandler()