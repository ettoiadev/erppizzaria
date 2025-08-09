import { NextResponse, type NextRequest } from "next/server"
import { verifyToken } from "@/lib/auth"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {} as Record<string, any>
  }

  try {
    // 1. Verificar variáveis de ambiente
    diagnostics.checks.environment = {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_KEY,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasMercadoPagoToken: !!process.env.MERCADOPAGO_ACCESS_TOKEN,
      nodeEnv: process.env.NODE_ENV,
    }

    // 2. Verificar token se fornecido
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.split(" ")[1]
    
    diagnostics.checks.authentication = {
      hasAuthHeader: !!authHeader,
      hasToken: !!token,
      tokenLength: token?.length || 0
    }

    if (token) {
      try {
        const decoded = await verifyToken(token)
        diagnostics.checks.authentication.tokenValid = !!decoded
        diagnostics.checks.authentication.tokenPayload = decoded ? {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          exp: decoded.exp
        } : null
      } catch (error: any) {
        diagnostics.checks.authentication.tokenError = error.message
      }
    }

    // 3. Verificar localStorage (simulado)
    diagnostics.checks.localStorage = {
      note: "Verificar no browser: localStorage.getItem('auth-token')"
    }

    // 4. Verificar conectividade com Supabase
    try {
      const { getSupabaseServerClient } = await import('@/lib/supabase')
      const supabase = getSupabaseServerClient()
      const { count, error } = await supabase.from('profiles').select('id', { count: 'exact', head: true })
      diagnostics.checks.database = {
        connected: !error,
        countProfiles: count ?? null,
        error: error?.message || null
      }
    } catch (error: any) {
      diagnostics.checks.database = {
        connected: false,
        error: error.message
      }
    }

    return NextResponse.json({
      success: true,
      message: "Diagnóstico da configuração admin",
      diagnostics
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      diagnostics
    }, { status: 500 })
  }
} 