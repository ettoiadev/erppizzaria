import { NextResponse } from "next/server"
import { getSupabaseServerClient } from '@/lib/supabase'
import { frontendLogger } from '@/lib/frontend-logger'

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()
    
    // Buscar o próximo código sequencial disponível
    // Considerar apenas clientes ativos (active = true ou NULL)
    const { data: customers, error } = await supabase
      .from('profiles')
      .select('customer_code')
      .eq('role', 'customer')
      .not('customer_code', 'is', null)
      .or('active.is.null,active.eq.true')
    
    if (error) {
      frontendLogger.error('Erro ao buscar códigos de clientes', 'api', {
        error: error.message,
        stack: error.stack
      })
      throw error
    }

    // Filtrar apenas códigos numéricos e encontrar o máximo
    let maxCode = 0
    if (customers && customers.length > 0) {
      for (const customer of customers) {
        const code = customer.customer_code
        if (code && /^[0-9]+$/.test(code)) {
          const numericCode = parseInt(code, 10)
          if (numericCode > maxCode) {
            maxCode = numericCode
          }
        }
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
    frontendLogger.error('Erro ao buscar próximo código de cliente', 'api', {
      error: error.message,
      stack: error.stack
    })
    return NextResponse.json({
      error: "Erro interno do servidor",
      details: error.message
    }, { status: 500 })
  }
}