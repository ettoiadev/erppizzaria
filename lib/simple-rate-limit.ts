import { NextRequest, NextResponse } from 'next/server'
import { frontendLogger } from './frontend-logger'

interface RateLimitEntry {
  count: number
  resetTime: number
}

// Cache em memória para rate limiting
const rateLimitCache = new Map<string, RateLimitEntry>()

// Configurações predefinidas
export const RATE_LIMIT_PRESETS = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 5, // 5 tentativas por 15 minutos
    message: 'Muitas tentativas de autenticação. Tente novamente em 15 minutos.'
  },
  orders: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    maxRequests: 10, // 10 pedidos por minuto
    message: 'Muitos pedidos. Aguarde um momento antes de fazer outro pedido.'
  },
  general: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    maxRequests: 60, // 60 requisições por minuto
    message: 'Muitas requisições. Tente novamente em alguns segundos.'
  }
} as const

// Limpar cache expirado periodicamente
setInterval(() => {
  const now = Date.now()
  const entries = Array.from(rateLimitCache.entries())
  for (const [key, entry] of entries) {
    if (now > entry.resetTime) {
      rateLimitCache.delete(key)
    }
  }
}, 60000) // Limpar a cada minuto

/**
 * Gera chave única para rate limiting baseada no IP
 */
function generateKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || request.ip || 'unknown'
  
  return `ratelimit:${ip}`
}

/**
 * Verifica e aplica rate limiting
 */
export function checkRateLimit(
  request: NextRequest,
  preset: keyof typeof RATE_LIMIT_PRESETS
): { allowed: boolean; response?: NextResponse } {
  const config = RATE_LIMIT_PRESETS[preset]
  const key = generateKey(request)
  const now = Date.now()
  
  // Buscar ou criar entrada no cache
  let entry = rateLimitCache.get(key)
  
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs
    }
    rateLimitCache.set(key, entry)
    return { allowed: true }
  }
  
  // Incrementar contador
  entry.count++
  rateLimitCache.set(key, entry)
  
  // Verificar se excedeu o limite
  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    
    // Log do rate limit atingido
    frontendLogger.warn('Rate limit atingido', 'api', {
      ip: key.replace('ratelimit:', ''),
      preset,
      count: entry.count,
      maxRequests: config.maxRequests,
      url: request.url,
      method: request.method
    })
    
    const response = NextResponse.json(
      { 
        error: config.message,
        success: false,
        retryAfter
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(entry.resetTime / 1000).toString(),
          'Retry-After': retryAfter.toString()
        }
      }
    )
    
    return { allowed: false, response }
  }
  
  return { allowed: true }
}

/**
 * Adiciona headers de rate limit à resposta
 */
export function addRateLimitHeaders(
  response: NextResponse,
  request: NextRequest,
  preset: keyof typeof RATE_LIMIT_PRESETS
): NextResponse {
  const config = RATE_LIMIT_PRESETS[preset]
  const key = generateKey(request)
  const entry = rateLimitCache.get(key)
  
  if (entry) {
    const remaining = Math.max(0, config.maxRequests - entry.count)
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString())
  }
  
  return response
}