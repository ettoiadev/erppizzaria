import { NextRequest, NextResponse } from "next/server"
import { getCustomerById, updateCustomerAndAddress, deleteCustomer } from '@/lib/db/customers'
import { addCorsHeaders, createOptionsHandler } from '@/lib/auth-utils'
import { frontendLogger } from '@/lib/frontend-logger'
import { profileUpdateSchema } from '@/lib/validation-schemas'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    frontendLogger.info('Buscando cliente por ID', 'api', { customerId: params.id })
    const customerId = params.id

    const customer = await getCustomerById(customerId)
    if (!customer) {
      const response = NextResponse.json({
        error: "Cliente não encontrado"
      }, { status: 404 })
      return addCorsHeaders(response)
    }
    
    const response = NextResponse.json(customer)
    return addCorsHeaders(response)

  } catch (error: any) {
    const errorMessage = error?.message || 'Erro desconhecido'
    const stack = error?.stack
    
    frontendLogger.logError('Erro ao buscar cliente', {
      errorMessage,
      stack,
      customerId: params.id
    }, error instanceof Error ? error : undefined, 'api')
    const response = NextResponse.json({
      error: "Erro interno do servidor"
    }, { status: 500 })
    return addCorsHeaders(response)
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerId = params.id
    frontendLogger.info('Atualizando cliente', 'api', { customerId })
    
    let body
    try {
      body = await request.json()
    } catch (error) {
      const response = NextResponse.json({
        error: "JSON inválido"
      }, { status: 400 })
      return addCorsHeaders(response)
    }

    // Validar e sanitizar dados usando Zod
    const validationResult = profileUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      frontendLogger.warn('Dados inválidos para atualização de cliente', 'api', { 
        errors: validationResult.error.errors,
        customerId 
      })
      const response = NextResponse.json({
        error: "Dados inválidos",
        details: validationResult.error.errors
      }, { status: 400 })
      return addCorsHeaders(response)
    }

    const validatedData = validationResult.data
    
    // Mapear dados validados para o formato esperado pela função
    const updateData = {
      name: validatedData.full_name || '',
      email: '', // Email não pode ser alterado via esta API
      phone: validatedData.phone || null,
      address: undefined // Address não é suportado pelo profileUpdateSchema
    }
    
    // Se não há dados para atualizar, retornar erro
    if (!validatedData.full_name && !validatedData.phone) {
      const response = NextResponse.json({
        error: "Nenhum dado válido para atualização"
      }, { status: 400 })
      return addCorsHeaders(response)
    }
    
    await updateCustomerAndAddress(customerId, updateData)
    
    frontendLogger.info('Cliente atualizado com sucesso', 'api', { customerId })
    const response = NextResponse.json({ success: true, message: "Cliente atualizado com sucesso" })
    return addCorsHeaders(response)

  } catch (error: any) {
    const errorMessage = error?.message || 'Erro desconhecido'
    const stack = error?.stack
    
    frontendLogger.logError('Erro ao atualizar cliente', {
      errorMessage,
      stack,
      customerId: params.id
    }, error instanceof Error ? error : undefined, 'api')
    const response = NextResponse.json({
      error: "Erro interno do servidor"
    }, { status: 500 })
    return addCorsHeaders(response)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerId = params.id
    frontendLogger.info('Excluindo cliente', 'api', { customerId })

    await deleteCustomer(customerId)
    
    frontendLogger.info('Cliente excluído com sucesso', 'api', { customerId })
    const response = NextResponse.json({ success: true, message: "Cliente excluído com sucesso" })
    return addCorsHeaders(response)

  } catch (error: any) {
    const errorMessage = error?.message || 'Erro desconhecido'
    const stack = error?.stack
    
    frontendLogger.logError('Erro ao excluir cliente', {
      errorMessage,
      stack,
      customerId: params.id
    }, error instanceof Error ? error : undefined, 'api')
    const response = NextResponse.json({
      error: "Erro interno do servidor"
    }, { status: 500 })
    return addCorsHeaders(response)
  }
}

export const OPTIONS = createOptionsHandler()