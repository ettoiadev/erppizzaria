import { sign, verify } from 'jsonwebtoken'
import { getUserByEmail } from './db-supabase'
import { appLogger } from './logging'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'william-disk-pizza-jwt-secret-2024-production'
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'william-disk-pizza-refresh-secret-2024-production'

// Armazenamento em memória para refresh tokens (em produção, usar Redis)
const refreshTokenStore = new Map<string, {
  userId: string
  email: string
  role: string
  expiresAt: Date
  isRevoked: boolean
}>()

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface RefreshTokenPayload {
  userId: string
  email: string
  role: string
  tokenId: string
  iat: number
  exp: number
}

/**
 * Gera um par de tokens (access + refresh)
 */
export function generateTokenPair(user: { id: string; email: string; role: string }): TokenPair {
  try {
    const tokenId = crypto.randomUUID()
    const now = new Date()
    const accessTokenExpiry = 15 * 60 // 15 minutos
    const refreshTokenExpiry = 7 * 24 * 60 * 60 // 7 dias
    
    // Access token de curta duração
    const accessToken = sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        type: 'access'
      },
      JWT_SECRET,
      { expiresIn: accessTokenExpiry }
    )

    // Refresh token de longa duração
    const refreshToken = sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        tokenId,
        type: 'refresh'
      },
      REFRESH_SECRET,
      { expiresIn: refreshTokenExpiry }
    )

    // Armazenar refresh token
    refreshTokenStore.set(tokenId, {
      userId: user.id,
      email: user.email,
      role: user.role,
      expiresAt: new Date(now.getTime() + refreshTokenExpiry * 1000),
      isRevoked: false
    })

    appLogger.info('auth', 'Par de tokens gerado', {
      email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      role: user.role,
      tokenId,
      accessTokenExpiry: `${accessTokenExpiry}s`,
      refreshTokenExpiry: `${refreshTokenExpiry}s`
    })

    return {
      accessToken,
      refreshToken,
      expiresIn: accessTokenExpiry
    }
  } catch (error: any) {
    appLogger.error('auth', 'Erro ao gerar par de tokens', {
      email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      error: error.message
    })
    throw new Error('Erro ao gerar tokens de autenticação')
  }
}

/**
 * Renova o access token usando o refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenPair | null> {
  try {
    // Verificar refresh token
    const payload = verify(refreshToken, REFRESH_SECRET) as RefreshTokenPayload
    
    if (!payload || payload.type !== 'refresh') {
      appLogger.warn('auth', 'Refresh token inválido - tipo incorreto')
      return null
    }

    // Verificar se o token existe no store
    const storedToken = refreshTokenStore.get(payload.tokenId)
    if (!storedToken) {
      appLogger.warn('auth', 'Refresh token não encontrado no store', {
        tokenId: payload.tokenId
      })
      return null
    }

    // Verificar se o token foi revogado
    if (storedToken.isRevoked) {
      appLogger.warn('auth', 'Refresh token revogado', {
        tokenId: payload.tokenId,
        email: payload.email.replace(/(.{2}).*(@.*)/, '$1***$2')
      })
      return null
    }

    // Verificar se o token expirou
    if (new Date() > storedToken.expiresAt) {
      appLogger.warn('auth', 'Refresh token expirado', {
        tokenId: payload.tokenId,
        email: payload.email.replace(/(.{2}).*(@.*)/, '$1***$2')
      })
      refreshTokenStore.delete(payload.tokenId)
      return null
    }

    // Verificar se o usuário ainda existe
    const user = await getUserByEmail(payload.email)
    if (!user) {
      appLogger.warn('auth', 'Usuário não encontrado durante refresh', {
        email: payload.email.replace(/(.{2}).*(@.*)/, '$1***$2')
      })
      revokeRefreshToken(payload.tokenId)
      return null
    }

    // Gerar novo par de tokens
    const newTokenPair = generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role
    })

    // Revogar o refresh token antigo
    revokeRefreshToken(payload.tokenId)

    appLogger.info('auth', 'Access token renovado com sucesso', {
      email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      oldTokenId: payload.tokenId
    })

    return newTokenPair
  } catch (error: any) {
    appLogger.error('auth', 'Erro ao renovar access token', {
      error: error.message
    })
    return null
  }
}

/**
 * Revoga um refresh token
 */
export function revokeRefreshToken(tokenId: string): void {
  const storedToken = refreshTokenStore.get(tokenId)
  if (storedToken) {
    storedToken.isRevoked = true
    appLogger.info('auth', 'Refresh token revogado', {
      tokenId,
      email: storedToken.email.replace(/(.{2}).*(@.*)/, '$1***$2')
    })
  }
}

/**
 * Revoga todos os refresh tokens de um usuário
 */
export function revokeAllUserTokens(userId: string): void {
  let revokedCount = 0
  for (const [tokenId, tokenData] of refreshTokenStore.entries()) {
    if (tokenData.userId === userId && !tokenData.isRevoked) {
      tokenData.isRevoked = true
      revokedCount++
    }
  }
  
  appLogger.info('auth', 'Todos os refresh tokens do usuário revogados', {
    userId,
    revokedCount
  })
}

/**
 * Limpa tokens expirados do store (executar periodicamente)
 */
export function cleanupExpiredTokens(): void {
  const now = new Date()
  let cleanedCount = 0
  
  for (const [tokenId, tokenData] of refreshTokenStore.entries()) {
    if (now > tokenData.expiresAt) {
      refreshTokenStore.delete(tokenId)
      cleanedCount++
    }
  }
  
  if (cleanedCount > 0) {
    appLogger.info('auth', 'Tokens expirados limpos', {
      cleanedCount,
      remainingTokens: refreshTokenStore.size
    })
  }
}

/**
 * Verifica se um access token está próximo do vencimento
 */
export function isTokenNearExpiry(token: string, thresholdMinutes: number = 5): boolean {
  try {
    const payload = verify(token, JWT_SECRET) as any
    if (!payload.exp) return true
    
    const expiryTime = payload.exp * 1000 // Convert to milliseconds
    const now = Date.now()
    const thresholdTime = thresholdMinutes * 60 * 1000
    
    return (expiryTime - now) <= thresholdTime
  } catch {
    return true // Se não conseguir verificar, considerar como próximo do vencimento
  }
}

// Executar limpeza de tokens expirados a cada hora
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredTokens, 60 * 60 * 1000) // 1 hora
}