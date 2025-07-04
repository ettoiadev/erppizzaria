import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Inicializar Supabase com anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

    console.log('🔐 Authenticating user with Supabase Auth...')

    // Autenticar usando Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password
    })

    if (authError || !authData.user) {
      console.log('❌ Supabase Auth failed:', authError?.message)
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      )
    }

    console.log('✅ Supabase Auth successful, user ID:', authData.user.id)

    // Criar um client autenticado com a sessão do usuário
    const authenticatedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${authData.session?.access_token}`
        }
      }
    })

    // Buscar perfil do usuário usando o client autenticado
    const { data: profile, error: profileError } = await authenticatedSupabase
      .from('profiles')
      .select('id, email, full_name, role, user_id')
      .eq('user_id', authData.user.id)
      .single()

    if (profileError || !profile) {
      console.log('❌ Profile not found:', profileError?.message)
      return NextResponse.json(
        { error: "Perfil de usuário não encontrado" },
        { status: 401 }
      )
    }

    console.log('✅ Profile found:', {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      user_id: profile.user_id
    })

    // Preparar resposta com token do Supabase
    const response = {
      user: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        user_id: profile.user_id
      },
      token: authData.session?.access_token,
      refresh_token: authData.session?.refresh_token
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