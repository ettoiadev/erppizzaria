import { NextRequest, NextResponse } from 'next/server'
import { createUser, generateToken } from '@/lib/auth'
import { registerSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar dados
    const validatedData = registerSchema.parse(body)
    
    // Criar usuário
    const user = await createUser(validatedData)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Erro ao criar usuário. Email pode já estar em uso.' },
        { status: 400 }
      )
    }

    // Gerar token
    const token = generateToken(user)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      token
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}