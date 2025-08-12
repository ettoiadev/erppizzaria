import { NextRequest } from "next/server"
import { authenticateUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 === TESTE LOGIN API START ===')
    
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return Response.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      )
    }

    console.log('🔐 Testando autenticação para:', email)

    // Usar a mesma função de autenticação otimizada
    const authResult = await authenticateUser(email, password)

    if (!authResult) {
      console.log('❌ Teste: Authentication failed')
      return Response.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      )
    }

    const { user, accessToken, refreshToken, expiresIn } = authResult

    console.log('✅ Teste: Usuário autenticado:', user.email)

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      accessToken,
      refreshToken,
      expiresIn,
      test_route: true
    })

  } catch (error: any) {
    console.error("❌ Teste: Login error:", error.message)
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}