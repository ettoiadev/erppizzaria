import { NextResponse, type NextRequest } from "next/server"
import { comparePasswords, generateToken, getUserByEmail } from "@/lib/auth"

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('=== POST /api/auth/login - INÍCIO ===');
    
    const body = await request.json()
    console.log('Login attempt for email:', body.email);
    
    const { email, password } = body

    // Validate input
    if (!email?.trim() || !password) {
      console.log('Validation failed: missing email or password');
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    console.log('Searching for user with email:', email);
    
    // Get user by email
    const user = await getUserByEmail(email)
    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      console.log('User not found');
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    console.log('User found:', {
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Verify password
    const isValidPassword = await comparePasswords(password, user.password_hash)
    console.log('Password valid:', isValidPassword);

    if (!isValidPassword) {
      console.log('Invalid password');
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    // Generate JWT token
    const token = generateToken(user)
    console.log('Token generated successfully');

    // Return user data and token
    const response = {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      token
    };
    
    console.log('Login successful for user:', user.email);
    console.log('=== POST /api/auth/login - FIM ===');

    return NextResponse.json(response)
  } catch (error: any) {
    console.error("=== Login error COMPLETO ===");
    console.error("Tipo:", error.constructor.name);
    console.error("Mensagem:", error.message);
    console.error("Stack:", error.stack);
    
    if (error.code) {
      console.error("Código PostgreSQL:", error.code);
      console.error("Detalhe:", error.detail);
    }
    
    return NextResponse.json({ 
      error: "Erro interno do servidor",
      details: error.message 
    }, { status: 500 })
  }
}
