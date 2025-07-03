import { NextResponse, type NextRequest } from "next/server"
import { comparePasswords, generateToken, getUserByEmail } from "@/lib/auth"

// Forçar renderização dinâmica para Vercel
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  console.log('🚀 === LOGIN API START ===');
  console.log('🌍 Environment:', process.env.NODE_ENV);
  console.log('📡 Supabase URL configured:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('🔑 JWT Secret configured:', !!process.env.JWT_SECRET);
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  try {
    // Validar Content-Type
    const contentType = request.headers.get('content-type');
    console.log('📋 Content-Type:', contentType);
    
    if (!contentType?.includes('application/json')) {
      console.log('❌ Content-Type inválido');
      return NextResponse.json(
        { error: "Content-Type deve ser application/json" }, 
        { status: 400, headers }
      );
    }

    // Parse do body
    let body;
    try {
      body = await request.json();
      console.log('📥 Body parsed successfully');
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return NextResponse.json(
        { error: "JSON inválido no corpo da requisição" }, 
        { status: 400, headers }
      );
    }
    
    console.log('📧 Login attempt for email:', body.email);
    
    const { email, password } = body;

    // Validação rigorosa de entrada
    if (!email || typeof email !== 'string' || !email.trim()) {
      console.log('❌ Email validation failed');
      return NextResponse.json(
        { error: "Email é obrigatório e deve ser uma string válida" }, 
        { status: 400, headers }
      );
    }

    if (!password || typeof password !== 'string') {
      console.log('❌ Password validation failed');
      return NextResponse.json(
        { error: "Senha é obrigatória e deve ser uma string válida" }, 
        { status: 400, headers }
      );
    }

    console.log('🔍 Searching for user...');
    
    // Buscar usuário por email
    const user = await getUserByEmail(email);
    console.log('👤 User found:', user ? 'Yes' : 'No');

    if (!user) {
      console.log('❌ User not found');
      return NextResponse.json(
        { error: "Credenciais inválidas" }, 
        { status: 401, headers }
      );
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      hasPasswordHash: !!user.password_hash
    });

    // Verificar se o usuário tem hash de senha
    if (!user.password_hash) {
      console.error('❌ User has no password hash');
      return NextResponse.json(
        { error: "Erro de configuração do usuário" }, 
        { status: 500, headers }
      );
    }

    // Verificar senha
    console.log('🔐 Verifying password...');
    const isValidPassword = await comparePasswords(password, user.password_hash);
    console.log('🔑 Password valid:', isValidPassword);

    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return NextResponse.json(
        { error: "Credenciais inválidas" }, 
        { status: 401, headers }
      );
    }

    // Gerar token JWT
    console.log('🎫 Generating JWT token...');
    const token = generateToken(user);
    console.log('✅ Token generated successfully');

    // Preparar resposta
    const response = {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      token
    };
    
    console.log('🎉 Login successful for user:', user.email);
    console.log('🏁 === LOGIN API END ===');

    return NextResponse.json(response, { headers });
    
  } catch (error: any) {
    console.error("💥 === LOGIN ERROR COMPLETO ===");
    console.error("🏷️ Tipo:", error.constructor.name);
    console.error("💬 Mensagem:", error.message);
    console.error("📚 Stack:", error.stack);
    
    if (error.code) {
      console.error("🔢 Código:", error.code);
      console.error("📝 Detalhe:", error.detail);
      console.error("💡 Hint:", error.hint);
    }
    
    // Garantir que sempre retornamos JSON válido
    return NextResponse.json({ 
      error: "Erro interno do servidor",
      message: "Tente novamente em alguns instantes",
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers
    });
  }
}

// Handler para OPTIONS (CORS preflight)
export async function OPTIONS(request: NextRequest) {
  console.log('🔄 OPTIONS request received');
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Handler para GET (para debug)
export async function GET() {
  console.log('🔍 GET request received');
  return NextResponse.json({
    message: "Login endpoint is working",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasJwtSecret: !!process.env.JWT_SECRET
  });
}
