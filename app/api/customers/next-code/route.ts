import { NextResponse } from "next/server"
import { query } from '@/lib/postgres'

export async function GET() {
  try {
    // Buscar o próximo código disponível para cliente
    // Primeiro, buscar o maior código existente
    const maxCodeResult = await query(`
      SELECT COALESCE(MAX(customer_code), 0) as max_code
      FROM profiles 
      WHERE role = 'customer' AND customer_code IS NOT NULL
    `)
    
    const maxCode = maxCodeResult.rows[0]?.max_code || 0
    const nextCode = maxCode + 1

    return NextResponse.json({
      next_code: nextCode
    })

  } catch (error: any) {
    console.error("[CUSTOMERS] Erro ao buscar próximo código:", error)
    return NextResponse.json({
      error: "Erro interno do servidor"
    }, { status: 500 })
  }
}