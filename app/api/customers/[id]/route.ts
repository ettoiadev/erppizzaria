import { NextRequest, NextResponse } from "next/server"
import { getCustomerById, updateCustomerAndAddress, deleteCustomer } from '@/lib/db-supabase'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerId = params.id

    const customer = await getCustomerById(customerId)
    if (!customer) {
      return NextResponse.json({
        error: "Cliente não encontrado"
      }, { status: 404 })
    }
    return NextResponse.json(customer)

  } catch (error: any) {
    console.error("[CUSTOMERS] Erro ao buscar cliente:", error)
    return NextResponse.json({
      error: "Erro interno do servidor"
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerId = params.id
    const body = await request.json()
    const { name, email, phone, address } = body

    // Validar dados obrigatórios
    if (!name || !email) {
      return NextResponse.json({
        error: "Nome e email são obrigatórios"
      }, { status: 400 })
    }

    await updateCustomerAndAddress(customerId, { name, email, phone, address })
    return NextResponse.json({ success: true, message: "Cliente atualizado com sucesso" })

  } catch (error: any) {
    console.error("[CUSTOMERS] Erro ao atualizar cliente:", error)
    return NextResponse.json({
      error: "Erro interno do servidor"
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerId = params.id

    await deleteCustomer(customerId)
    return NextResponse.json({ success: true, message: "Cliente excluído com sucesso" })

  } catch (error: any) {
    console.error("[CUSTOMERS] Erro ao excluir cliente:", error)
    return NextResponse.json({
      error: "Erro interno do servidor"
    }, { status: 500 })
  }
}