import { NextResponse } from "next/server"
import { query } from '@/lib/postgresql'
import { frontendLogger } from '@/lib/frontend-logger'

export async function GET() {
  try {
    // Buscar o próximo código sequencial disponível
    // Buscar códigos de clientes existentes
    const result = await query(`
      SELECT customer_code 
      FROM customers 
      WHERE customer_code IS NOT NULL
      ORDER BY customer_code
    `)
    
    const customers = result.rows

    // Filtrar apenas códigos numéricos e encontrar o máximo
    let maxCode = 0
    if (customers && customers.length > 0) {
      const numericCodes = customers
        .map(customer => customer.customer_code)
        .filter(code => code && /^[0-9]+$/.test(code))
        .map(code => parseInt(code, 10))
      
      if (numericCodes.length > 0) {
        maxCode = Math.max(...numericCodes)
      }
    }
    
    const nextNumber = maxCode + 1
    const formattedCode = nextNumber.toString().padStart(4, '0')

    frontendLogger.info('Próximo código sequencial gerado', 'api', {
      nextCode: formattedCode,
      nextNumber: nextNumber
    })

    return NextResponse.json({
      next_code: formattedCode,
      next_number: nextNumber
    })

  } catch (error: any) {
    const errorMessage = error?.message || 'Erro desconhecido'
    const stack = error?.stack
    
    frontendLogger.logError(
      'Erro ao buscar próximo código de cliente',
      { errorMessage, stack },
      error instanceof Error ? error : undefined,
      'api'
    )
    return NextResponse.json({
      error: "Erro interno do servidor",
      details: error.message
    }, { status: 500 })
  }
}