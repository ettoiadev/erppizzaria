import { NextRequest } from "next/server"
import { comparePasswords, generateToken, getUserByEmail } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return Response.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      )
    }

    // Buscar usuário
    const user = await getUserByEmail(email)
    if (!user) {
      return Response.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      )
    }

    // Verificar senha
    const isValidPassword = await comparePasswords(password, user.password_hash)
    if (!isValidPassword) {
      return Response.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      )
    }

    // Gerar token
    const token = generateToken(user)

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      token
    })

  } catch (error) {
    console.error("Login error:", error)
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
} 