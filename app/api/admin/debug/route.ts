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
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasMercadoPagoToken: !!process.env.MERCADOPAGO_ACCESS_TOKEN,
      nodeEnv: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL?.substring(0, 30) + "...",
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

    // 4. Verificar conectividade com PostgreSQL
    try {
      const { testConnection } = await import('@/lib/postgres')
      const dbTest = await testConnection()
      
      diagnostics.checks.database = {
        connected: dbTest.success,
        message: dbTest.message,
        error: dbTest.error || null
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