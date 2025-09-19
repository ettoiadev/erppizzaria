import { NextRequest, NextResponse } from 'next/server'
import { RATE_LIMIT_CONFIG } from './security-config'
import { frontendLogger } from './frontend-logger'
import { createSecureErrorResponse } from './security-utils'

// Interface para resultado do rate limiting
interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  message?: string
}

// Cache em memória para rate limiting (em produção, usar Redis)
const rateLimitCache = new Map<string, {
  count: number
  resetTime: number
  firstRequest: number
}>()

/**
 * Limpa entradas expiradas do cache
 */
function cleanExpiredEntries(): void {
  const now = Date.now()
  for (const [key, value] of rateLimitCache.entries()) {
    if (now > value.resetTime) {
      rateLimitCache.delete(key)
    }
  }
}

/**
 * Extrai identificador único da requisição
 */
function getRequestIdentifier(request: NextRequest): string {
  // Priorizar IP real
  const ip = request.ip || 
            request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            request.headers.get('x-real-ip') ||
            'unknown'
  
  // Para autenticação, incluir user agent para maior segurança
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const authHeader = request.headers.get('authorization')
  
  // Se tem token de auth, usar hash do token + IP
  if (authHeader) {
    const tokenHash = Buffer.from(authHeader).toString('base64').slice(0, 10)
    return `${ip}:${tokenHash}`
  }
  
  // Para requisições anônimas, usar IP + User Agent hash
  const uaHash = Buffer.from(userAgent).toString('base64').slice(0, 8)
  return `${ip}:${uaHash}`
}

/**
 * Aplica rate limiting baseado no tipo de endpoint
 */
export function applyEnhancedRateLimit(
  request: NextRequest,
  type: keyof typeof RATE_LIMIT_CONFIG = 'public'
): RateLimitResult {
  // Limpar entradas expiradas periodicamente
  if (Math.random() < 0.1) { // 10% de chance
    cleanExpiredEntries()
  }
  
  const config = RATE_LIMIT_CONFIG[type]
  const identifier = getRequestIdentifier(request)
  const cacheKey = `${type}:${identifier}`
  const now = Date.now()
  
  // Buscar ou criar entrada no cache
  let entry = rateLimitCache.get(cacheKey)
  
  if (!entry || now > entry.resetTime) {
    // Nova janela de tempo
    entry = {
      count: 1,
      resetTime: now + config.window,
      firstRequest: now
    }
    rateLimitCache.set(cacheKey, entry)
    
    return {
      allowed: true,
      remaining: config.requests - 1,
      resetTime: entry.resetTime
    }
  }
  
  // Incrementar contador
  entry.count++
  
  if (entry.count > config.requests) {
    // Rate limit excedido
    frontendLogger.warn('Rate limit excedido', 'api', {
      type,
      identifier: identifier.replace(/:\w+$/, ':***'), // Mascarar parte do identificador
      count: entry.count,
      limit: config.requests,
      window: config.window,
      ip: request.ip || 'unknown'
    })
    
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      message: config.message
    }
  }
  
  return {
    allowed: true,
    remaining: config.requests - entry.count,
    resetTime: entry.resetTime
  }
}

/**
 * Middleware de rate limiting que retorna resposta de erro se excedido
 */
export function rateLimitMiddleware(
  request: NextRequest,
  type: keyof typeof RATE_LIMIT_CONFIG = 'public'
): NextResponse | null {
  const result = applyEnhancedRateLimit(request, type)
  
  if (!result.allowed) {
    return createSecureErrorResponse(
      result.message || 'Rate limit excedido',
      429,
      request,
      'warn'
    )
  }
  
  return null // Permitir requisição
}

/**
 * Adiciona headers de rate limit à resposta
 */
export function addRateLimitHeaders(
  response: NextResponse,
  request: NextRequest,
  type: keyof typeof RATE_LIMIT_CONFIG = 'public'
): NextResponse {
  const result = applyEnhancedRateLimit(request, type)
  
  response.headers.set('X-RateLimit-Limit', RATE_LIMIT_CONFIG[type].requests.toString())
  response.headers.set('X-RateLimit-Remaining', Math.max(0, result.remaining).toString())
  response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString())
  response.headers.set('X-RateLimit-Window', (RATE_LIMIT_CONFIG[type].window / 1000).toString())
  
  return response
}

/**
 * Rate limiting específico para autenticação com detecção de ataques
 */
export function authRateLimit(request: NextRequest): RateLimitResult {
  const result = applyEnhancedRateLimit(request, 'auth')
  
  // Detectar possível ataque de força bruta
  if (!result.allowed) {
    const identifier = getRequestIdentifier(request)
    const cacheKey = `auth:${identifier}`
    const entry = rateLimitCache.get(cacheKey)
    
    if (entry && entry.count > RATE_LIMIT_CONFIG.auth.requests * 2) {
      // Possível ataque - log com mais detalhes
      frontendLogger.logError('Possível ataque de força bruta detectado', {
         identifier: identifier.replace(/:\w+$/, ':***'),
         attempts: entry.count,
         timeWindow: Date.now() - entry.firstRequest,
         ip: request.ip || 'unknown',
         userAgent: request.headers.get('user-agent') || 'unknown'
       }, new Error('Brute force attack detected'), 'api')
    }
  }
  
  return result
}

/**
 * Rate limiting específico para APIs administrativas
 */
export function adminRateLimit(request: NextRequest): RateLimitResult {
  return applyEnhancedRateLimit(request, 'admin')
}

/**
 * Rate limiting específico para APIs públicas
 */
export function publicRateLimit(request: NextRequest): RateLimitResult {
  return applyEnhancedRateLimit(request, 'public')
}

/**
 * Rate limiting específico para APIs gerais
 */
export function apiRateLimit(request: NextRequest): RateLimitResult {
  return applyEnhancedRateLimit(request, 'api')
}

/**
 * Limpa cache de rate limiting (útil para testes)
 */
export function clearRateLimitCache(): void {
  rateLimitCache.clear()
}

/**
 * Obtém estatísticas do rate limiting
 */
export function getRateLimitStats(): {
  totalEntries: number
  activeEntries: number
  expiredEntries: number
} {
  const now = Date.now()
  let activeEntries = 0
  let expiredEntries = 0
  
  for (const [, value] of rateLimitCache.entries()) {
    if (now > value.resetTime) {
      expiredEntries++
    } else {
      activeEntries++
    }
  }
  
  return {
    totalEntries: rateLimitCache.size,
    activeEntries,
    expiredEntries
  }
}