import { NextResponse } from "next/server"
import { getAddressById, updateAddress, deleteAddress } from "@/lib/db/addresses"
import { addCorsHeaders, createOptionsHandler } from '@/lib/auth-utils'
import { frontendLogger } from '@/lib/frontend-logger'
import { z } from 'zod'

// Schema para validação de atualização de endereços
const addressUpdateSchema = z.object({
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

// Schema para validação de atualização parcial (PATCH)
const addressPatchSchema = z.object({
  is_default: z.boolean()
})

// GET - Buscar um endereço específico
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    frontendLogger.info('Buscando endereço por ID', 'api', { addressId: params.id })

    const address = await getAddressById(params.id)
    if (!address) {
      frontendLogger.warn('Endereço não encontrado', 'api', { addressId: params.id })
      const response = NextResponse.json({ error: "Endereço não encontrado" }, { status: 404 })
      return addCorsHeaders(response)
    }
    
    frontendLogger.info('Endereço encontrado', 'api', { addressId: params.id })
    const response = NextResponse.json({ address })
    return addCorsHeaders(response)
  } catch (error) {
    frontendLogger.logError("Erro ao buscar endereço", { error: (error as any)?.message, stack: (error as any)?.stack })
    const response = NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    return addCorsHeaders(response)
  }
}

// PATCH - Atualizar um endereço parcialmente (para marcar como padrão)
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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

    frontendLogger.info('Atualizando endereço parcialmente', 'api', { 
      addressId: params.id,
      data: body
    })

    // Validar dados usando Zod
    const validationResult = addressPatchSchema.safeParse(body)
    if (!validationResult.success) {
      frontendLogger.warn('Dados inválidos para atualização parcial de endereço', 'api', { 
        addressId: params.id,
        errors: validationResult.error.errors
      })
      const response = NextResponse.json({
        error: "Dados inválidos",
        details: validationResult.error.errors
      }, { status: 400 })
      return addCorsHeaders(response)
    }

    const validatedData = validationResult.data
    const address = await updateAddress(params.id, validatedData)
    
    frontendLogger.info('Endereço atualizado parcialmente com sucesso', 'api', { 
      addressId: params.id
    })
    
    const response = NextResponse.json({ address })
    return addCorsHeaders(response)
  } catch (error: any) {
    frontendLogger.logError('Erro ao atualizar endereço', {
      error: error.message,
      stack: error.stack,
      addressId: params.id
    })
    const response = NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    return addCorsHeaders(response)
  }
}

// PUT - Atualizar um endereço completo
export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

    frontendLogger.info('Atualizando endereço completo', 'api', {
      addressId: params.id,
      data: body
    })

    // Validar e sanitizar dados usando Zod
    const validationResult = addressUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      frontendLogger.warn('Dados inválidos para atualização de endereço', 'api', { 
        addressId: params.id,
        errors: validationResult.error.errors
      })
      const response = NextResponse.json({
        error: "Dados inválidos",
        details: validationResult.error.errors
      }, { status: 400 })
      return addCorsHeaders(response)
    }

    const validatedData = validationResult.data
    const { name, street, number, complement, neighborhood, city, state, zip_code, is_default } = validatedData

    const address = await updateAddress(params.id, { 
      label: name || 'Endereço', 
      street, 
      number, 
      complement, 
      neighborhood, 
      city, 
      state, 
      zip_code, 
      is_default: is_default || false 
    })
    
    frontendLogger.info('Endereço atualizado com sucesso', 'api', { 
      addressId: params.id
    })
    
    const response = NextResponse.json({ address })
    return addCorsHeaders(response)
  } catch (error) {
    frontendLogger.logError("Erro ao atualizar endereço", { error: (error as any)?.message, stack: (error as any)?.stack })
    const response = NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    return addCorsHeaders(response)
  }
}

// DELETE - Excluir um endereço
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    frontendLogger.info('Excluindo endereço', 'api', { addressId: params.id })

    await deleteAddress(params.id)
    
    frontendLogger.info('Endereço excluído com sucesso', 'api', { addressId: params.id })
    const response = NextResponse.json({ message: "Endereço excluído com sucesso" })
    return addCorsHeaders(response)
  } catch (error) {
    frontendLogger.logError("Erro ao excluir endereço", { error: (error as any)?.message, stack: (error as any)?.stack })
    const response = NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    return addCorsHeaders(response)
  }
}

export const OPTIONS = createOptionsHandler()
