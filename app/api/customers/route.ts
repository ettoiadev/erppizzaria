import { NextRequest, NextResponse } from "next/server"
import { listCustomers } from '@/lib/db-supabase'

export async function GET(request: NextRequest) {
  try {
    const customers = await listCustomers()
    return NextResponse.json({ customers, total: customers.length })

  } catch (error: any) {
    console.error("[CUSTOMERS] Erro ao buscar clientes:", error)
    return NextResponse.json({
      error: "Erro interno do servidor",
      message: "Não foi possível carregar a lista de clientes",
      customers: [],
      total: 0
    }, { status: 500 })
  }
}