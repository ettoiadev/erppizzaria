import { NextResponse } from "next/server"
import { query } from '@/lib/db'
import { addCorsHeaders, createOptionsHandler } from '@/lib/auth-utils'
import { frontendLogger } from '@/lib/frontend-logger'
import { z } from 'zod'

// Schema para validação de endereços
const addressSchema = z.object({
  customer_id: z.string().min(1, "ID do cliente é obrigatório"),
  name: z.string().min(1, "Nome do endereço é obrigatório").trim(),
  street: z.string().min(1, "Rua/Logradouro é obrigatório").trim(),
  number: z.string().min(1, "Número é obrigatório").trim(),
  complement: z.string().optional().transform(val => val?.trim() || ''),
  neighborhood: z.string().min(1, "Bairro é obrigatório").trim(),
  city: z.string().min(1, "Cidade é obrigatória").trim(),
  state: z.string().length(2, "Estado deve ter 2 caracteres (UF)").toUpperCase(),
  zip_code: z.string().min(1, "CEP é obrigatório").transform(val => {
    const cleaned = val.replace(/\D/g, '')
    if (cleaned.length !== 8) {
      throw new Error("CEP deve ter 8 dígitos")
    }
    return cleaned
  }),
  is_default: z.boolean().optional().default(false)
})

// GET - Listar endereços do usuário
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    frontendLogger.info('Buscando endereços do usuário', 'api', { userId })

    if (!userId) {
      const response = NextResponse.json({ error: "UserId não fornecido" }, { status: 400 })
      return addCorsHeaders(response)
    }

    const result = await query(
      'SELECT id, user_id, label, street, number, complement, neighborhood, city, state, zip_code, is_default, created_at, updated_at FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [userId]
    )
    
    const addresses = result.rows
    frontendLogger.info('Endereços encontrados', 'api', { userId, count: addresses.length })
    
    const response = NextResponse.json({ addresses })
    return addCorsHeaders(response)
  } catch (error) {
    frontendLogger.logError("Erro ao buscar endereços", { error: (error as any)?.message, stack: (error as any)?.stack })
    const response = NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    return addCorsHeaders(response)
  }
}

// POST - Adicionar novo endereço
export async function POST(request: Request) {
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

    frontendLogger.info('Criando novo endereço', 'api', {
      customerId: body.customer_id,
      name: body.name
    })

    // Validar e sanitizar dados usando Zod
    const validationResult = addressSchema.safeParse(body)
    if (!validationResult.success) {
      frontendLogger.warn('Dados inválidos para criação de endereço', 'api', {
        errors: validationResult.error.errors
      })
      const response = NextResponse.json({
        error: "Dados inválidos",
        details: validationResult.error.errors
      }, { status: 400 })
      return addCorsHeaders(response)
    }

    const validatedData = validationResult.data
    const { customer_id, name, street, number, complement, neighborhood, city, state, zip_code, is_default } = validatedData

    const result = await query(`
      INSERT INTO addresses (
        user_id, label, street, number, complement, neighborhood,
        city, state, zip_code, is_default
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, user_id, label, street, number, complement,
                neighborhood, city, state, zip_code, is_default,
                created_at, updated_at
    `, [
      customer_id,
      name || 'Endereço',
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      zip_code,
      is_default || false
    ])
    
    const address = result.rows[0]
    
    frontendLogger.info('Endereço criado com sucesso', 'api', {
      addressId: address.id,
      customerId: customer_id
    })
    
    const response = NextResponse.json({ address })
    return addCorsHeaders(response)
  } catch (error) {
    frontendLogger.logError("Erro ao criar endereço", { error: (error as any)?.message, stack: (error as any)?.stack })
    const response = NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    return addCorsHeaders(response)
  }
}

export const OPTIONS = createOptionsHandler()
