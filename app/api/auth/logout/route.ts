import { NextRequest, NextResponse } from 'next/server'
import { addCorsHeaders } from '@/lib/auth-utils'
import { frontendLogger } from '@/lib/frontend-logger'
import { appLogger } from '@/lib/logging'

// Configurar runtime Node.js para suporte ao módulo crypto
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Obter informações do usuário do header (definido pelo middleware)
    const userEmail = request.headers.get('x-user-email')
    const userId = request.headers.get('x-user-id')

    // Log do logout
    if (userEmail) {
      appLogger.info('auth', 'Logout realizado', {
        email: userEmail.replace(/(.{2}).*(@.*)/, '$1***$2'),
        userId
      })
    }

    // Criar resposta de sucesso
    const response = NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso'
    })

    // Limpar cookie de autenticação
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0 // Expira imediatamente
    })

    return addCorsHeaders(response)

  } catch (error: any) {
    appLogger.error('auth', 'Erro interno no logout', error)

    // Mesmo com erro, limpar cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso'
    })

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    })

    return addCorsHeaders(response)
  }
}

// Método GET para logout simples (sem body)
export async function GET(request: NextRequest) {
  return POST(request)
}