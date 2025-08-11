import { NextRequest, NextResponse } from 'next/server'
import { refreshAccessToken } from '@/lib/refresh-token'
import { createAuthResponse, clearAuthResponse } from '@/lib/auth-middleware'
import { frontendLogger } from '@/lib/logging'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Obter refresh token do cookie
    const refreshToken = request.cookies.get('refresh-token')?.value
    
    if (!refreshToken) {
      frontendLogger.warn('auth', 'Tentativa de refresh sem token', {
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
      frontendLogger.warn('auth', 'Falha na renovação do token', {
        ip: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      })
      
      return clearAuthResponse({
        success: false,
        error: 'Token inválido ou expirado'
      }, 401)
    }

    frontendLogger.info('auth', 'Token renovado com sucesso', {
      ip: request.ip || 'unknown',
      expiresIn: newTokenPair.expiresIn
    })

    return createAuthResponse(newTokenPair.accessToken, newTokenPair.refreshToken, {
      success: true,
      expiresIn: newTokenPair.expiresIn
    })

  } catch (error: any) {
    frontendLogger.error('auth', 'Erro interno na renovação de token', {
      error: error.message,
      stack: error.stack,
      ip: request.ip || 'unknown'
    })

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
    frontendLogger.error('auth', 'Erro ao verificar refresh token', {
      error: error.message
    })

    return NextResponse.json({
      valid: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}