import { NextRequest, NextResponse } from "next/server"
import { getCustomerById, updateCustomerAndAddress, deleteCustomer } from '@/lib/db-supabase'
import { addCorsHeaders, createOptionsHandler } from '@/lib/auth-utils'
import { frontendLogger } from '@/lib/frontend-logger'
import { userUpdateSchema } from '@/lib/validation-schemas'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    frontendLogger.info('Buscando cliente por ID', { customerId: params.id })
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
    frontendLogger.error('Erro ao buscar cliente:', error)
    const response = NextResponse.json({
      error: "Erro interno do servidor"
    }, { status: 500 })
    return addCorsHeaders(response)
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerId = params.id
    frontendLogger.info('Atualizando cliente', { customerId })
    
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
    const validationResult = userUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      frontendLogger.warn('Dados inválidos para atualização de cliente', { 
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
    await updateCustomerAndAddress(customerId, validatedData)
    
    frontendLogger.info('Cliente atualizado com sucesso', { customerId })
    const response = NextResponse.json({ success: true, message: "Cliente atualizado com sucesso" })
    return addCorsHeaders(response)

  } catch (error: any) {
    frontendLogger.error('Erro ao atualizar cliente:', error)
    const response = NextResponse.json({
      error: "Erro interno do servidor"
    }, { status: 500 })
    return addCorsHeaders(response)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerId = params.id
    frontendLogger.info('Excluindo cliente', { customerId })

    await deleteCustomer(customerId)
    
    frontendLogger.info('Cliente excluído com sucesso', { customerId })
    const response = NextResponse.json({ success: true, message: "Cliente excluído com sucesso" })
    return addCorsHeaders(response)

  } catch (error: any) {
    frontendLogger.error('Erro ao excluir cliente:', error)
    const response = NextResponse.json({
      error: "Erro interno do servidor"
    }, { status: 500 })
    return addCorsHeaders(response)
  }
}

export const OPTIONS = createOptionsHandler()