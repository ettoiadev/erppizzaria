import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number // Janela de tempo em ms
  maxRequests: number // Máximo de requisições na janela
  keyGenerator?: (request: NextRequest) => string // Gerador de chave personalizado
}

interface RateLimitResult {
  success: boolean
  error?: string
  remaining?: number
  resetTime?: number
}

// Store em memória para rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Configurações predefinidas
export const RATE_LIMIT_CONFIGS = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 5 // 5 tentativas por 15 minutos
  },
  api: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 100 // 100 requisições por minuto
  },
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 10 // 10 uploads por hora
  },
  general: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 60 // 60 requisições por minuto
  }
}

/**
 * Gera chave padrão baseada no IP
 */
function getDefaultKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'
  return `rate_limit:${ip}`
}

/**
 * Gera chave baseada no usuário (para usuários autenticados)
 */
function getUserKey(request: NextRequest, userId?: string): string {
  if (userId) {
    return `rate_limit:user:${userId}`
  }
  return getDefaultKey(request)
}

/**
 * Limpa entradas expiradas do store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Verifica rate limit para uma requisição
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  userId?: string
): RateLimitResult {
  // Limpa entradas expiradas periodicamente
  if (Math.random() < 0.1) { // 10% de chance
    cleanupExpiredEntries()
  }

  const key = config.keyGenerator 
    ? config.keyGenerator(request)
    : userId 
      ? getUserKey(request, userId)
      : getDefaultKey(request)

  const now = Date.now()
  const resetTime = now + config.windowMs
  
  const existing = rateLimitStore.get(key)
  
  if (!existing || now > existing.resetTime) {
    // Nova janela de tempo
    rateLimitStore.set(key, { count: 1, resetTime })
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime
    }
  }
  
  if (existing.count >= config.maxRequests) {
    // Limite excedido
    return {
      success: false,
      error: 'Rate limit excedido. Tente novamente mais tarde.',
      remaining: 0,
      resetTime: existing.resetTime
    }
  }
  
  // Incrementa contador
  existing.count++
  rateLimitStore.set(key, existing)
  
  return {
    success: true,
    remaining: config.maxRequests - existing.count,
    resetTime: existing.resetTime
  }
}

/**
 * Aplica rate limit com configuração predefinida
 */
export function applyRateLimit(
  request: NextRequest,
  preset: keyof typeof RATE_LIMIT_CONFIGS,
  userId?: string
): RateLimitResult {
  const config = RATE_LIMIT_CONFIGS[preset]
  return checkRateLimit(request, config, userId)
}

/**
 * Cria resposta de erro de rate limit
 */
export function createRateLimitErrorResponse(
  result: RateLimitResult
): NextResponse {
  const retryAfter = result.resetTime 
    ? Math.ceil((result.resetTime - Date.now()) / 1000)
    : 60
    
  return NextResponse.json(
    { 
      error: result.error || 'Rate limit excedido',
      success: false,
      retryAfter
    },
    { 
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Remaining': (result.remaining || 0).toString(),
        'X-RateLimit-Reset': result.resetTime?.toString() || ''
      }
    }
  )
}

/**
 * Adiciona headers de rate limit à resposta
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  if (result.remaining !== undefined) {
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  }
  if (result.resetTime) {
    response.headers.set('X-RateLimit-Reset', result.resetTime.toString())
  }
  return response
}

// Limpeza automática a cada 5 minutos
setInterval(cleanupExpiredEntries, 5 * 60 * 1000)