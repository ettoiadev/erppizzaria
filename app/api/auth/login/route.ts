import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    message: "Login endpoint is working",
    timestamp: new Date().toISOString(),
    method: "GET",
    supabase_configured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  })
}

export async function POST(request: NextRequest) {
  console.log('🚀 === LOGIN API START ===')
  console.log('🌍 Environment:', process.env.NODE_ENV)
  console.log('📡 Supabase configured:', !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))

  try {
    // Parse do body
    const body = await request.json()
    console.log('📧 Login attempt for:', body.email)

    const { email, password } = body

    // Validação de entrada
    if (!email || typeof email !== 'string' || !email.trim()) {
      console.log('❌ Email validation failed')
      return NextResponse.json(
        { error: "Email é obrigatório e deve ser uma string válida" },
        { status: 400 }
      )
    }

    if (!password || typeof password !== 'string') {
      console.log('❌ Password validation failed')
      return NextResponse.json(
        { error: "Senha é obrigatória e deve ser uma string válida" },
        { status: 400 }
      )
    }

    console.log('🔐 Authenticating user...')

    // Autenticar usuário usando nova função otimizada
    const authResult = await authenticateUser(email.trim(), password)

    if (!authResult) {
      console.log('❌ Authentication failed')
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      )
    }

    const { user, token } = authResult

    console.log('✅ User authenticated successfully:', {
      id: user.id,
      email: user.email,
      role: user.role
    })

    // Preparar resposta
    const response = {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      token
    }

    console.log('🎉 Login successful for user:', user.email)
    console.log('🏁 === LOGIN API END ===')

    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

  } catch (error: any) {
    console.error("💥 === LOGIN ERROR COMPLETO ===")
    console.error("🏷️ Tipo:", error.constructor.name)
    console.error("💬 Mensagem:", error.message)
    console.error("📚 Stack:", error.stack)

    return NextResponse.json({
      error: "Erro interno do servidor",
      message: "Tente novamente em alguns instantes",
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}

export async function OPTIONS() {
  console.log('🔄 OPTIONS request received')
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
} 