import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getUserByEmail } from '@/lib/db-supabase'
import { createAuthResponse } from '@/lib/auth-middleware'
import { generateTokenPair } from '@/lib/refresh-token'
import { frontendLogger } from '@/lib/frontend-logger'
import { getSupabaseServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ message: "Login endpoint is working", timestamp: new Date().toISOString(), method: "GET" })
}

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Iniciando processo de login...")
    
    // Aplicar rate limiting (temporariamente desabilitado)
    console.log("🔓 Rate limiting desabilitado para debug")
    /*
    // Implementar rate limiting
    const rateLimitResult = await authRateLimiter(request)
    if (rateLimitResult instanceof NextResponse) {
      return rateLimitResult
    }
    */

    const body = await request.json()
    const { email, password } = body

    console.log("📝 Dados recebidos:", { email, password: password ? "***" : "undefined" })

    // Validar dados
    if (!email || !password) {
      console.log("❌ Dados inválidos:", { email: !!email, password: !!password })
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      )
    }

    console.log("🔐 Tentativa de login:", { email })

    // Buscar usuário
    console.log("🔍 Buscando usuário no banco (Supabase)...")
    const supabase = getSupabaseServerClient()
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, email, password_hash, full_name, role')
      .eq('email', email)
      .maybeSingle()
    if (error) throw error

    if (!user) {
      console.log("❌ Usuário não encontrado:", email)
      return NextResponse.json(
        { error: "Email ou senha inválidos" },
        { status: 401 }
      )
    }
    console.log("✅ Usuário encontrado:", { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      hasPasswordHash: !!user.password_hash 
    })

    // Verificar senha
    console.log("🔐 Verificando senha...")
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    
    console.log("🔑 Resultado da verificação:", { 
      isValid: isValidPassword,
      passwordProvided: !!password,
      hashExists: !!user.password_hash 
    })
    
    if (!isValidPassword) {
      console.log("❌ Senha inválida para usuário:", email)
      return NextResponse.json(
        { error: "Email ou senha inválidos" },
        { status: 401 }
      )
    }

    // Gerar par de tokens (access + refresh)
    const tokenPair = generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role || 'customer'
    })

    frontendLogger.info('Login realizado com sucesso', 'auth', {
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      role: user.role || 'customer',
      accessTokenExpiry: '15min',
      refreshTokenExpiry: '7d'
    })

    const response = createAuthResponse(tokenPair.accessToken, tokenPair.refreshToken, {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role || 'customer'
      },
      expiresIn: tokenPair.expiresIn
    })

    // Adicionar headers CORS na resposta
    response.headers.set('Access-Control-Allow-Origin', 'https://erppizzaria-tau.vercel.app')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin')

    return response

  } catch (error: any) {
    console.error("❌ Erro no login:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  console.log('🔄 OPTIONS request received')
  const origin = request.headers.get('origin')
  
  if (origin === 'https://erppizzaria-tau.vercel.app') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Origin',
        'Access-Control-Allow-Credentials': 'true'
      },
    })
  }
  
  return new NextResponse(null, { status: 204 })
}