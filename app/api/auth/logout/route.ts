import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { revokeRefreshToken, revokeAllUserTokens } from '@/lib/refresh-token'
import { clearAuthResponse } from '@/lib/auth-middleware'
import { frontendLogger } from '@/lib/logging'

const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'william-disk-pizza-refresh-secret-2024-production'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refresh-token')?.value
    const { revokeAll = false } = await request.json().catch(() => ({}))
    
    let userId: string | null = null
    let email: string | null = null

    // Se temos um refresh token, extrair informações e revogar
    if (refreshToken) {
      try {
        const payload = verify(refreshToken, REFRESH_SECRET) as any
        userId = payload.userId
        email = payload.email
        
        if (revokeAll && userId) {
          // Revogar todos os tokens do usuário
          revokeAllUserTokens(userId)
          frontendLogger.info('auth', 'Logout com revogação de todos os tokens', {
            email: email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
            userId
          })
        } else {
          // Revogar apenas o token atual
          revokeRefreshToken(payload.tokenId)
          frontendLogger.info('auth', 'Logout com revogação do token atual', {
            email: email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
            tokenId: payload.tokenId
          })
        }
      } catch (error: any) {
        frontendLogger.warn('auth', 'Erro ao processar refresh token no logout', {
          error: error.message
        })
      }
    }

    // Limpar cookies independentemente do resultado da revogação
    return clearAuthResponse({
      success: true,
      message: 'Logout realizado com sucesso'
    })

  } catch (error: any) {
    frontendLogger.error('auth', 'Erro interno no logout', {
      error: error.message,
      stack: error.stack
    })

    // Mesmo com erro, limpar cookies
    return clearAuthResponse({
      success: true,
      message: 'Logout realizado com sucesso'
    })
  }
}

// Método GET para logout simples (sem body)
export async function GET(request: NextRequest) {
  return POST(request)
}