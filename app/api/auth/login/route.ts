import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { authRateLimiter } from '@/lib/rate-limiter'

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
    const rateLimitResult = authRateLimiter(request)
    if (rateLimitResult instanceof NextResponse) {
      console.log("⚠️ Rate limit aplicado")
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

    // Gerar token JWT
    console.log("🔑 Gerando JWT token...")
    console.log("🔑 JWT_SECRET exists:", !!process.env.JWT_SECRET)
    
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET não encontrado nas variáveis de ambiente")
      throw new Error("JWT_SECRET não configurado")
    }
    
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        role: user.role || 'customer'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    
    console.log("✅ JWT token gerado com sucesso")

    console.log("✅ Login bem-sucedido:", { email, role: user.role })

    return NextResponse.json({ message: "Login realizado com sucesso", user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role || 'customer' }, token })

  } catch (error: any) {
    console.error("❌ Erro no login:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
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