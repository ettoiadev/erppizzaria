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
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + "...",
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
      const supabaseCheck = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/', {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        }
      })
      
      diagnostics.checks.supabase = {
        reachable: supabaseCheck.ok,
        status: supabaseCheck.status,
        statusText: supabaseCheck.statusText
      }
    } catch (error: any) {
      diagnostics.checks.supabase = {
        reachable: false,
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