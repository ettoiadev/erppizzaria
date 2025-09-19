import { sign, verify } from 'jsonwebtoken'
import { getUserByEmail } from './auth'
import { appLogger } from './logging'
import { query } from './db'
import crypto from 'crypto'

// JWT_SECRET é obrigatório em produção
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET é obrigatório em produção. Configure a variável de ambiente JWT_SECRET.')
  }
  // Apenas em desenvolvimento, usar chave temporária
  appLogger.warn('auth', 'JWT_SECRET não configurado - usando chave temporária para desenvolvimento')
}

// Chave temporária para desenvolvimento (nunca usar em produção)
const TEMP_JWT_SECRET = 'william-disk-pizza-dev-temp-key-2024'

// REFRESH_SECRET é obrigatório em produção
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET
if (!REFRESH_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('REFRESH_TOKEN_SECRET é obrigatório em produção. Configure a variável de ambiente REFRESH_TOKEN_SECRET.')
  }
  // Apenas em desenvolvimento, usar chave temporária
  appLogger.warn('auth', 'REFRESH_TOKEN_SECRET não configurado - usando chave temporária para desenvolvimento')
}

// Chave temporária para refresh token em desenvolvimento
const TEMP_REFRESH_SECRET = 'william-disk-pizza-refresh-dev-temp-key-2024'

// Interface para refresh tokens no banco
interface RefreshTokenRecord {
  id: string
  user_id: string
  email: string
  role: string
  token: string
  expires_at: string
  is_revoked: boolean
  created_at: string
  updated_at: string
}

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
  type: string
  iat: number
  exp: number
}

/**
 * Gera um par de tokens (access + refresh)
 */
export async function generateTokenPair(user: { id: string; email: string; role: string }): Promise<TokenPair> {
  try {
    // Usar JWT_SECRET real ou chave temporária de desenvolvimento
    const secret = JWT_SECRET || TEMP_JWT_SECRET
    const refreshSecret = REFRESH_SECRET || TEMP_REFRESH_SECRET
    
    if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET não configurado em produção')
    }
    
    if (!REFRESH_SECRET && process.env.NODE_ENV === 'production') {
      throw new Error('REFRESH_TOKEN_SECRET não configurado em produção')
    }
    
    const tokenId = crypto.randomUUID()
    const now = new Date()
    const accessTokenExpiry = 60 * 60 // 1 hora
    const refreshTokenExpiry = 30 * 24 * 60 * 60 // 30 dias
    
    // Access token de curta duração
    const accessToken = sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        type: 'access'
      },
      secret,
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
      refreshSecret,
      { expiresIn: refreshTokenExpiry }
    )

    // Armazenar refresh token no PostgreSQL
    const expiresAt = new Date(now.getTime() + refreshTokenExpiry * 1000)
    try {
      await query(
        `INSERT INTO refresh_tokens (
          id, user_id, email, role, token, expires_at, is_revoked
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          tokenId,
          user.id,
          user.email,
          user.role,
          refreshToken,
          expiresAt,
          false
        ]
      )
    } catch (insertError) {
      appLogger.error('auth', 'Erro ao armazenar refresh token no banco', insertError instanceof Error ? insertError : new Error(String(insertError)), {
        email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        tokenId
      })
      throw new Error('Erro ao armazenar token de autenticação')
    }

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
    appLogger.error('auth', 'Erro ao gerar par de tokens', error, {
      email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2')
    })
    throw new Error('Erro ao gerar tokens de autenticação')
  }
}

/**
 * Renova o access token usando o refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenPair | null> {
  try {
    // Usar REFRESH_SECRET real ou chave temporária de desenvolvimento
    const refreshSecret = REFRESH_SECRET || TEMP_REFRESH_SECRET
    
    if (!REFRESH_SECRET && process.env.NODE_ENV === 'production') {
      throw new Error('REFRESH_TOKEN_SECRET não configurado em produção')
    }
    
    // Verificar refresh token
    const payload = verify(refreshToken, refreshSecret) as RefreshTokenPayload
    
    if (!payload || payload.type !== 'refresh') {
      appLogger.warn('auth', 'Refresh token inválido - tipo incorreto')
      return null
    }

    // Verificar se o token existe no banco
    const tokenResult = await query(
      'SELECT * FROM refresh_tokens WHERE id = $1',
      [payload.tokenId]
    )

    if (tokenResult.rows.length === 0) {
      appLogger.warn('auth', 'Refresh token não encontrado no banco', {
        tokenId: payload.tokenId
      })
      return null
    }
    
    const storedToken = tokenResult.rows[0]
    
    // Verificar se o token armazenado corresponde ao token fornecido
    if (storedToken.token && storedToken.token !== refreshToken) {
      appLogger.warn('auth', 'Token fornecido não corresponde ao token armazenado', {
        tokenId: payload.tokenId
      })
      return null
    }

    // Verificar se o token foi revogado
    if (storedToken.is_revoked) {
      appLogger.warn('auth', 'Refresh token revogado', {
        tokenId: payload.tokenId,
        email: payload.email.replace(/(.{2}).*(@.*)/, '$1***$2')
      })
      return null
    }

    // Verificar se o token expirou
    const expiresAt = new Date(storedToken.expires_at)
    if (new Date() > expiresAt) {
      appLogger.warn('auth', 'Refresh token expirado', {
        tokenId: payload.tokenId,
        email: payload.email.replace(/(.{2}).*(@.*)/, '$1***$2')
      })
      // Remover token expirado do banco
      await query('DELETE FROM refresh_tokens WHERE id = $1', [payload.tokenId])
      return null
    }

    // Verificar se o usuário ainda existe
    const user = await getUserByEmail(payload.email)
    if (!user) {
      appLogger.warn('auth', 'Usuário não encontrado durante refresh', {
        email: payload.email.replace(/(.{2}).*(@.*)/, '$1***$2')
      })
      await revokeRefreshToken(payload.tokenId)
      return null
    }

    // Gerar novo par de tokens
    const newTokenPair = await generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role
    })

    // Revogar o refresh token antigo
    await revokeRefreshToken(payload.tokenId)

    appLogger.info('auth', 'Access token renovado com sucesso', {
      email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      oldTokenId: payload.tokenId
    })

    return newTokenPair
  } catch (error: any) {
    appLogger.error('auth', 'Erro ao renovar access token', error)
    return null
  }
}

/**
 * Revoga um refresh token
 */
export async function revokeRefreshToken(tokenId: string): Promise<void> {
  try {
    const tokenResult = await query(
      'SELECT email FROM refresh_tokens WHERE id = $1',
      [tokenId]
    )

    if (tokenResult.rows.length === 0) {
      appLogger.warn('auth', 'Token não encontrado para revogação', {
        tokenId
      })
      return
    }

    await query(
      'UPDATE refresh_tokens SET is_revoked = true, updated_at = $1 WHERE id = $2',
      [new Date(), tokenId]
    )

    appLogger.info('auth', 'Refresh token revogado', {
      tokenId,
      email: tokenResult.rows[0].email.replace(/(.{2}).*(@.*)/, '$1***$2')
    })
  } catch (error: any) {
    appLogger.error('auth', 'Erro ao revogar refresh token', error, {
      tokenId
    })
  }
}

/**
 * Revoga todos os refresh tokens de um usuário
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  try {
    const countResult = await query(
      'SELECT COUNT(*) FROM refresh_tokens WHERE user_id = $1 AND is_revoked = false',
      [userId]
    )

    await query(
      'UPDATE refresh_tokens SET is_revoked = true, updated_at = $1 WHERE user_id = $2 AND is_revoked = false',
      [new Date(), userId]
    )

    const revokedCount = parseInt(countResult.rows[0].count) || 0
    appLogger.info('auth', 'Todos os refresh tokens do usuário revogados', {
      userId,
      revokedCount
    })
  } catch (error: any) {
    appLogger.error('auth', 'Erro ao revogar tokens do usuário', error, {
      userId
    })
  }
}

/**
 * Limpa tokens expirados e revogados do banco (executar periodicamente)
 */
export async function cleanupExpiredTokens(): Promise<void> {
  try {
    const now = new Date()
    
    // Primeiro, contar quantos tokens expirados serão removidos
    const expiredCountResult = await query(
      'SELECT COUNT(*) FROM refresh_tokens WHERE expires_at < $1',
      [now]
    )
    const expiredCount = parseInt(expiredCountResult.rows[0].count) || 0
    
    // Contar tokens revogados há mais de 7 dias
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const revokedCountResult = await query(
      'SELECT COUNT(*) FROM refresh_tokens WHERE is_revoked = true AND updated_at < $1',
      [sevenDaysAgo]
    )
    const revokedCount = parseInt(revokedCountResult.rows[0].count) || 0

    // Remover tokens expirados
    if (expiredCount > 0) {
      await query(
        'DELETE FROM refresh_tokens WHERE expires_at < $1',
        [now]
      )
    }
    
    // Remover tokens revogados antigos
    if (revokedCount > 0) {
      await query(
        'DELETE FROM refresh_tokens WHERE is_revoked = true AND updated_at < $1',
        [sevenDaysAgo]
      )

      // Contar tokens restantes e estatísticas
      const totalCountResult = await query('SELECT COUNT(*) FROM refresh_tokens')
      const totalCount = parseInt(totalCountResult.rows[0].count) || 0
        
      // Contar tokens ativos
      const activeCountResult = await query(
        'SELECT COUNT(*) FROM refresh_tokens WHERE is_revoked = false'
      )
      const activeCount = parseInt(activeCountResult.rows[0].count) || 0
        
      // Contar tokens revogados
      const currentRevokedCountResult = await query(
        'SELECT COUNT(*) FROM refresh_tokens WHERE is_revoked = true'
      )
      const currentRevokedCount = parseInt(currentRevokedCountResult.rows[0].count) || 0

      appLogger.info('auth', 'Limpeza de tokens concluída', {
        cleanedExpiredCount: expiredCount,
        cleanedRevokedCount: revokedCount,
        remainingTotal: totalCount,
        remainingActive: activeCount,
        remainingRevoked: currentRevokedCount
      })
    }
  } catch (error: any) {
    appLogger.error('auth', 'Erro na limpeza de tokens expirados', error)
  }
}

/**
 * Verifica se um access token está próximo do vencimento
 */
export function isTokenNearExpiry(token: string, thresholdMinutes: number = 15): boolean {
  try {
    // Usar JWT_SECRET real ou chave temporária de desenvolvimento
    const secret = JWT_SECRET || TEMP_JWT_SECRET
    
    if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET não configurado em produção')
    }
    
    const payload = verify(token, secret) as any
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