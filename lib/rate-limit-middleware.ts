import { NextRequest, NextResponse } from 'next/server'
import { addCorsHeaders } from './auth-utils'

// Configurações de rate limiting
const RATE_LIMITS = {
  public: { requests: 100, window: 60000 }, // 100 requests per minute
  authenticated: { requests: 200, window: 60000 }, // 200 requests per minute
  admin: { requests: 500, window: 60000 } // 500 requests per minute
}

// Store para controle de rate limiting (em produção usar Redis)
const requestStore = new Map<string, { count: number; resetTime: number }>()

// Função para obter identificador único do cliente
function getClientId(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'
  return ip
}

// Função para verificar rate limit
function checkRateLimit(clientId: string, preset: keyof typeof RATE_LIMITS): boolean {
  const now = Date.now()
  const limit = RATE_LIMITS[preset]
  const key = `${clientId}:${preset}`
  
  const existing = requestStore.get(key)
  
  if (!existing || now > existing.resetTime) {
    // Reset window
    requestStore.set(key, {
      count: 1,
      resetTime: now + limit.window
    })
    return true
  }
  
  if (existing.count >= limit.requests) {
    return false
  }
  
  existing.count++
  return true
}

// Higher-order function para rate limiting
export function withPresetRateLimit<T extends any[]>(
  preset: keyof typeof RATE_LIMITS,
  options: { skipRateLimit?: boolean } = {},
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    if (options.skipRateLimit) {
      return handler(request, ...args)
    }
    
    const clientId = getClientId(request)
    
    if (!checkRateLimit(clientId, preset)) {
      const response = NextResponse.json({
        error: 'Rate limit exceeded',
        message: 'Muitas requisições. Tente novamente em alguns minutos.'
      }, { status: 429 })
      
      return addCorsHeaders(response)
    }
    
    return handler(request, ...args)
  }
}

// Função para limpar registros expirados (executar periodicamente)
export function cleanupExpiredRecords(): void {
  const now = Date.now()
  for (const [key, value] of requestStore.entries()) {
    if (now > value.resetTime) {
      requestStore.delete(key)
    }
  }
}

// Limpar registros expirados a cada 5 minutos
setInterval(cleanupExpiredRecords, 5 * 60 * 1000)