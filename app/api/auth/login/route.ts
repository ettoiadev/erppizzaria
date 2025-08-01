import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from '@/lib/auth'
import { createAuthResponse } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    message: "Login endpoint is working",
    timestamp: new Date().toISOString(),
    method: "GET",
    database_configured: !!process.env.DATABASE_URL
  })
}

export async function POST(request: NextRequest) {
  console.log('🚀 === LOGIN API START ===')
  console.log('🌍 Environment:', process.env.NODE_ENV)
  console.log('🗄️ Database configured:', !!process.env.DATABASE_URL)

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

    console.log('🔐 Authenticating user with PostgreSQL...')

    // Autenticar usuário usando função consolidada
    const authResult = await authenticateUser(email.trim().toLowerCase(), password)

    if (!authResult) {
      console.log('❌ Authentication failed')
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      )
    }

    console.log('✅ Authentication successful for user:', authResult.user.email)
    console.log('🏁 === LOGIN API END ===')

    // Retornar resposta com cookie de autenticação
    return createAuthResponse(authResult.token, {
      user: authResult.user,
      token: authResult.token
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