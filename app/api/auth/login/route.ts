import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from '@/lib/supabase'

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

    console.log('🔐 Authenticating user with database...')

    // Buscar usuário na tabela profiles usando admin client
    const supabaseAdmin = getSupabaseAdmin()
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role, password_hash')
      .eq('email', email.trim().toLowerCase())
      .single()

    if (profileError || !profile) {
      console.log('❌ User not found:', profileError?.message)
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      )
    }

    console.log('✅ User found:', {
      id: profile.id,
      email: profile.email,
      role: profile.role
    })

    // Verificar senha
    const bcrypt = require('bcryptjs')
    const isValidPassword = await bcrypt.compare(password, profile.password_hash)

    if (!isValidPassword) {
      console.log('❌ Invalid password')
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      )
    }

    console.log('✅ Password valid')

    // Gerar token JWT
    const jwt = require('jsonwebtoken')
    const JWT_SECRET = process.env.JWT_SECRET
    
    if (!JWT_SECRET) {
      console.log('❌ JWT_SECRET not configured')
      throw new Error('JWT_SECRET not configured')
    }

    const token = jwt.sign(
      {
        id: profile.id,
        email: profile.email,
        role: profile.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Preparar resposta
    const response = {
      user: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role
      },
      token: token
    }

    console.log('🎉 Login successful for user:', profile.email)
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