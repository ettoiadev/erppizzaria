import { sign, verify } from 'jsonwebtoken'
import { getUserByEmail } from './db-supabase'
import { appLogger } from './logging'
import supabase from './supabase'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'william-disk-pizza-jwt-secret-2024-production'
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'william-disk-pizza-refresh-secret-2024-production'

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

    // Armazenar refresh token no Supabase
    const expiresAt = new Date(now.getTime() + refreshTokenExpiry * 1000)
    const { error: insertError } = await supabase
      .from('refresh_tokens')
      .insert({
        id: tokenId,
        user_id: user.id,
        email: user.email,
        role: user.role,
        token: refreshToken,
        expires_at: expiresAt.toISOString(),
        is_revoked: false
      })

    if (insertError) {
      appLogger.error('auth', 'Erro ao armazenar refresh token no banco', insertError, {
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
    // Verificar refresh token
    const payload = verify(refreshToken, REFRESH_SECRET) as RefreshTokenPayload
    
    if (!payload || payload.type !== 'refresh') {
      appLogger.warn('auth', 'Refresh token inválido - tipo incorreto')
      return null
    }

    // Verificar se o token existe no banco
    const { data: storedToken, error: fetchError } = await supabase
      .from('refresh_tokens')
      .select('*')
      .eq('id', payload.tokenId)
      .single()

    if (fetchError || !storedToken) {
      appLogger.warn('auth', 'Refresh token não encontrado no banco', {
        tokenId: payload.tokenId,
        error: fetchError?.message
      })
      return null
    }
    
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
      await supabase.from('refresh_tokens').delete().eq('id', payload.tokenId)
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
    const { data: storedToken, error: fetchError } = await supabase
      .from('refresh_tokens')
      .select('email')
      .eq('id', tokenId)
      .single()

    if (fetchError || !storedToken) {
      appLogger.warn('auth', 'Token não encontrado para revogação', {
        tokenId,
        error: fetchError?.message
      })
      return
    }

    const { error: updateError } = await supabase
      .from('refresh_tokens')
      .update({ is_revoked: true, updated_at: new Date().toISOString() })
      .eq('id', tokenId)

    if (updateError) {
      appLogger.error('auth', 'Erro ao revogar refresh token', updateError, {
        tokenId
      })
      return
    }

    appLogger.info('auth', 'Refresh token revogado', {
      tokenId,
      email: storedToken.email.replace(/(.{2}).*(@.*)/, '$1***$2')
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
    const { data: updatedTokens, error: updateError } = await supabase
      .from('refresh_tokens')
      .update({ 
        is_revoked: true, 
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', userId)
      .eq('is_revoked', false)
      .select('id')

    if (updateError) {
      appLogger.error('auth', 'Erro ao revogar tokens do usuário', updateError, {
        userId
      })
      return
    }

    const revokedCount = updatedTokens?.length || 0
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
    const now = new Date().toISOString()
    
    // Primeiro, contar quantos tokens expirados serão removidos
    const { count: expiredCount, error: countError } = await supabase
      .from('refresh_tokens')
      .select('*', { count: 'exact', head: true })
      .lt('expires_at', now)

    if (countError) {
      appLogger.error('auth', 'Erro ao contar tokens expirados', countError)
      return
    }
    
    // Contar tokens revogados há mais de 7 dias
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { count: revokedCount, error: revokedCountError } = await supabase
      .from('refresh_tokens')
      .select('*', { count: 'exact', head: true })
      .eq('is_revoked', true)
      .lt('updated_at', sevenDaysAgo.toISOString())
      
    if (revokedCountError) {
      appLogger.error('auth', 'Erro ao contar tokens revogados', revokedCountError)
    }

    // Remover tokens expirados
    if (expiredCount && expiredCount > 0) {
      const { error: deleteError } = await supabase
        .from('refresh_tokens')
        .delete()
        .lt('expires_at', now)

      if (deleteError) {
        appLogger.error('auth', 'Erro ao limpar tokens expirados', deleteError)
        return
      }
    }
    
    // Remover tokens revogados antigos
    if (revokedCount && revokedCount > 0) {
      const { error: deleteRevokedError } = await supabase
        .from('refresh_tokens')
        .delete()
        .eq('is_revoked', true)
        .lt('updated_at', sevenDaysAgo.toISOString())
        
      if (deleteRevokedError) {
        appLogger.error('auth', 'Erro ao limpar tokens revogados antigos', deleteRevokedError)
      }

      // Contar tokens restantes e estatísticas
      const { count: totalCount, error: totalError } = await supabase
        .from('refresh_tokens')
        .select('*', { count: 'exact', head: true })
        
      // Contar tokens ativos
      const { count: activeCount, error: activeError } = await supabase
        .from('refresh_tokens')
        .select('*', { count: 'exact', head: true })
        .eq('is_revoked', false)
        
      // Contar tokens revogados
      const { count: currentRevokedCount, error: currentRevokedError } = await supabase
        .from('refresh_tokens')
        .select('*', { count: 'exact', head: true })
        .eq('is_revoked', true)

      appLogger.info('auth', 'Limpeza de tokens concluída', {
        cleanedExpiredCount: expiredCount || 0,
        cleanedRevokedCount: revokedCount || 0,
        remainingTotal: totalCount || 0,
        remainingActive: activeCount || 0,
        remainingRevoked: currentRevokedCount || 0
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