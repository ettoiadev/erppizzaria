import { NextResponse } from "next/server"
import { query } from '@/lib/postgres'

export async function GET() {
  try {
    // Buscar o próximo código sequencial disponível
    // Considerar apenas clientes ativos (active = true ou NULL)
    const nextCodeResult = await query(`
      SELECT COALESCE(MAX(CAST(customer_code AS INTEGER)), 0) + 1 as next_code
      FROM profiles 
      WHERE role = 'customer' 
      AND customer_code IS NOT NULL 
      AND customer_code ~ '^[0-9]+$'
      AND (active = true OR active IS NULL)
    `)
    
    const nextNumber = nextCodeResult.rows[0]?.next_code || 1
    const formattedCode = nextNumber.toString().padStart(4, '0')

    console.log(`[CUSTOMERS] Próximo código sequencial: ${formattedCode}`)

    return NextResponse.json({
      next_code: formattedCode,
      next_number: nextNumber
    })

  } catch (error: any) {
    console.error("[CUSTOMERS] Erro ao buscar próximo código:", error)
    return NextResponse.json({
      error: "Erro interno do servidor",
      details: error.message
    }, { status: 500 })
  }
}