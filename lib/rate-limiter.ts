import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number // Janela de tempo em ms
  maxRequests: number // Máximo de requisições por janela
  message?: string // Mensagem de erro
  headers?: boolean // Incluir headers de rate limit
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// Cache em memória para rate limiting
const rateLimitCache = new Map<string, RateLimitEntry>()

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
 * Middleware de Rate Limiting
 */
export function createRateLimiter(config: RateLimitConfig) {
  return function rateLimiter(request: NextRequest) {
    const ip = request.ip || 
               request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const key = `${ip}:${userAgent}`
    const now = Date.now()
    
    // Buscar ou criar entrada no cache
    let entry = rateLimitCache.get(key)
    
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs
      }
    }
    
    // Incrementar contador
    entry.count++
    rateLimitCache.set(key, entry)
    
    // Verificar se excedeu o limite
    if (entry.count > config.maxRequests) {
      const response = NextResponse.json(
        { 
          error: 'Too many requests',
          message: config.message || 'Muitas requisições. Tente novamente em alguns minutos.',
          retryAfter: Math.ceil((entry.resetTime - now) / 1000)
        },
        { status: 429 }
      )
      
      // Adicionar headers informativos
      if (config.headers) {
        response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
        response.headers.set('X-RateLimit-Remaining', '0')
        response.headers.set('X-RateLimit-Reset', entry.resetTime.toString())
        response.headers.set('Retry-After', Math.ceil((entry.resetTime - now) / 1000).toString())
      }
      
      return response
    }
    
    // Requisição permitida
    const response = NextResponse.next()
    
    // Adicionar headers informativos
    if (config.headers) {
      response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
      response.headers.set('X-RateLimit-Remaining', (config.maxRequests - entry.count).toString())
      response.headers.set('X-RateLimit-Reset', entry.resetTime.toString())
    }
    
    return response
  }
}

/**
 * Rate Limiter para APIs públicas (mais restritivo)
 */
export const publicApiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 100, // 100 requests por 15 min
  message: 'Muitas requisições. Tente novamente em alguns minutos.',
  headers: true
})

/**
 * Rate Limiter para autenticação (mais permissivo para desenvolvimento)
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 50, // 50 tentativas por 15 min (mais permissivo)
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  headers: true
})

/**
 * Rate Limiter para pedidos (permissivo)
 */
export const ordersRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutos
  maxRequests: 100, // 100 requests por 5 min (muito mais permissivo)
  message: 'Muitos pedidos. Aguarde um momento antes de fazer outro pedido.',
  headers: true
})

/**
 * Rate Limiter para uploads (restritivo)
 */
export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  maxRequests: 20, // 20 uploads por hora
  message: 'Muitos uploads. Tente novamente em uma hora.',
  headers: true
})

/**
 * Rate Limiter para webhooks (permissivo)
 */
export const webhookRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 1000, // 1000 webhooks por minuto
  headers: false
})

/**
 * Função para obter estatísticas de rate limiting
 */
export function getRateLimitStats() {
  const stats = {
    totalEntries: rateLimitCache.size,
    activeLimits: 0,
    blockedIPs: 0
  }
  
  const now = Date.now()
  const entries = Array.from(rateLimitCache.entries())
  
  for (const [key, entry] of entries) {
    if (now <= entry.resetTime) {
      stats.activeLimits++
      if (entry.count > 100) { // Considerar como bloqueado se > 100 requests
        stats.blockedIPs++
      }
    }
  }
  
  return stats
}

/**
 * Função para limpar rate limit de um IP específico
 */
export function clearRateLimit(ip: string) {
  const entries = Array.from(rateLimitCache.entries())
  for (const [key] of entries) {
    if (key.startsWith(ip)) {
      rateLimitCache.delete(key)
    }
  }
}

/**
 * Função para obter informações de rate limit de um IP
 */
export function getRateLimitInfo(ip: string) {
  const entries = []
  const cacheEntries = Array.from(rateLimitCache.entries())
  
  for (const [key, entry] of cacheEntries) {
    if (key.startsWith(ip)) {
      entries.push({
        key,
        count: entry.count,
        resetTime: entry.resetTime,
        remaining: Math.max(0, 100 - entry.count) // Assumindo limite de 100
      })
    }
  }
  
  return entries
} 