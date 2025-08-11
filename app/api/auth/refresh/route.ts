import { NextRequest, NextResponse } from 'next/server'
import { refreshAccessToken } from '@/lib/refresh-token'
import { createAuthResponse, clearAuthResponse } from '@/lib/auth-middleware'
import { frontendLogger } from '@/lib/frontend-logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Obter refresh token do cookie
    const refreshToken = request.cookies.get('refresh-token')?.value
    
    if (!refreshToken) {
      frontendLogger.warn('Tentativa de refresh sem token', 'auth', {
        ip: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      })
      
      return clearAuthResponse({
        success: false,
        error: 'Refresh token não encontrado'
      }, 401)
    }

    // Tentar renovar o token
    const newTokenPair = await refreshAccessToken(refreshToken)
    
    if (!newTokenPair) {
      frontendLogger.warn('Falha na renovação do token', 'auth', {
        ip: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      })
      
      return clearAuthResponse({
        success: false,
        error: 'Token inválido ou expirado'
      }, 401)
    }

    frontendLogger.info('Token renovado com sucesso', 'auth', {
      ip: request.ip || 'unknown',
      expiresIn: newTokenPair.expiresIn
    })

    return createAuthResponse(newTokenPair.accessToken, newTokenPair.refreshToken, {
      success: true,
      expiresIn: newTokenPair.expiresIn
    })

  } catch (error: any) {
    frontendLogger.logError('Erro interno na renovação de token', {
       error: error.message,
       ip: request.headers.get('x-forwarded-for') || 'unknown'
     }, error, 'auth')

    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

// Método GET para verificar se o refresh token é válido
export async function GET(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refresh-token')?.value
    
    if (!refreshToken) {
      return NextResponse.json({
        valid: false,
        error: 'Refresh token não encontrado'
      }, { status: 401 })
    }

    // Tentar renovar para verificar validade
    const newTokenPair = await refreshAccessToken(refreshToken)
    
    return NextResponse.json({
      valid: !!newTokenPair
    })

  } catch (error: any) {
    frontendLogger.logError('Erro ao verificar refresh token', {
       error: error.message
     }, error, 'auth')

    return NextResponse.json({
      valid: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}