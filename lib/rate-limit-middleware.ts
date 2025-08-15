// Middleware de rate limiting para APIs
import { NextRequest, NextResponse } from 'next/server'
import { frontendLogger } from './frontend-logger'

// Interface para configuração de rate limiting
interface RateLimitConfig {
  windowMs: number // Janela de tempo em milissegundos
  maxRequests: number // Máximo de requests por janela
  keyGenerator?: (req: NextRequest) => string // Função para gerar chave única
  skipSuccessfulRequests?: boolean // Pular requests bem-sucedidos
  skipFailedRequests?: boolean // Pular requests com erro
  message?: string // Mensagem de erro customizada
  headers?: boolean // Incluir headers de rate limit na resposta
  onLimitReached?: (req: NextRequest, key: string) => void // Callback quando limite é atingido
}

// Configurações padrão para diferentes tipos de endpoint
export const RATE_LIMIT_CONFIGS = {
  // APIs públicas gerais
  public: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 100,
    message: 'Muitas requisições. Tente novamente em alguns minutos.'
  },
  
  // APIs de autenticação
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 5, // Limite baixo para login/registro
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  },
  
  // APIs de busca
  search: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    maxRequests: 30,
    message: 'Muitas buscas realizadas. Aguarde um momento.'
  },
  
  // APIs de upload
  upload: {
    windowMs: 10 * 60 * 1000, // 10 minutos
    maxRequests: 10,
    message: 'Limite de uploads atingido. Tente novamente em alguns minutos.'
  },
  
  // APIs administrativas
  admin: {
    windowMs: 5 * 60 * 1000, // 5 minutos
    maxRequests: 50,
    message: 'Limite de requisições administrativas atingido.'
  },
  
  // APIs críticas (pagamento, etc.)
  critical: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    maxRequests: 3,
    message: 'Operação crítica limitada. Aguarde antes de tentar novamente.'
  }
} as const

// Store em memória para contadores (em produção, usar Redis)
class MemoryStore {
  private store = new Map<string, { count: number; resetTime: number }>()
  
  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const data = this.store.get(key)
    if (!data) return null
    
    // Verificar se expirou
    if (Date.now() > data.resetTime) {
      this.store.delete(key)
      return null
    }
    
    return data
  }
  
  async set(key: string, count: number, windowMs: number): Promise<void> {
    this.store.set(key, {
      count,
      resetTime: Date.now() + windowMs
    })
  }
  
  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const existing = await this.get(key)
    
    if (existing) {
      existing.count++
      this.store.set(key, existing)
      return existing
    } else {
      const newData = {
        count: 1,
        resetTime: Date.now() + windowMs
      }
      this.store.set(key, newData)
      return newData
    }
  }
  
  // Limpeza periódica de chaves expiradas
  cleanup(): void {
    const now = Date.now()
    for (const [key, data] of this.store.entries()) {
      if (now > data.resetTime) {
        this.store.delete(key)
      }
    }
  }
}

// Instância global do store
const store = new MemoryStore()

// Limpeza automática a cada 5 minutos
setInterval(() => {
  store.cleanup()
}, 5 * 60 * 1000)

/**
 * Gera chave única para rate limiting baseada no IP e User-Agent
 * @param req Request object
 * @returns Chave única para o cliente
 */
function defaultKeyGenerator(req: NextRequest): string {
  // Tentar obter IP real (considerando proxies)
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || req.ip || 'unknown'
  
  // Incluir User-Agent para diferenciar clientes do mesmo IP
  const userAgent = req.headers.get('user-agent') || 'unknown'
  const userAgentHash = Buffer.from(userAgent).toString('base64').slice(0, 10)
  
  return `${ip}:${userAgentHash}`
}

/**
 * Middleware de rate limiting
 * @param config Configuração do rate limiting
 * @param handler Handler da API
 */
export function withRateLimit<T extends any[]>(
  config: RateLimitConfig,
  handler: (...args: T) => Promise<NextResponse>
) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = defaultKeyGenerator,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    message = 'Muitas requisições. Tente novamente mais tarde.',
    headers = true,
    onLimitReached
  } = config
  
  return async (...args: T): Promise<NextResponse> => {
    const req = args[0] as NextRequest
    const key = keyGenerator(req)
    
    try {
      // Obter contadores atuais
      const current = await store.get(key)
      const now = Date.now()
      
      let count = 0
      let resetTime = now + windowMs
      
      if (current && now < current.resetTime) {
        count = current.count
        resetTime = current.resetTime
      }
      
      // Verificar se excedeu o limite
      if (count >= maxRequests) {
        // Log do limite atingido
        frontendLogger.warn('Rate limit atingido', 'rate-limit', {
          key,
          count,
          maxRequests,
          windowMs,
          url: req.url,
          method: req.method,
          userAgent: req.headers.get('user-agent')
        })
        
        // Callback personalizado
        if (onLimitReached) {
          onLimitReached(req, key)
        }
        
        // Preparar headers de rate limit
        const rateLimitHeaders: Record<string, string> = {}
        if (headers) {
          rateLimitHeaders['X-RateLimit-Limit'] = maxRequests.toString()
          rateLimitHeaders['X-RateLimit-Remaining'] = '0'
          rateLimitHeaders['X-RateLimit-Reset'] = Math.ceil(resetTime / 1000).toString()
          rateLimitHeaders['Retry-After'] = Math.ceil((resetTime - now) / 1000).toString()
        }
        
        return NextResponse.json({
          error: message,
          retryAfter: Math.ceil((resetTime - now) / 1000)
        }, {
          status: 429,
          headers: rateLimitHeaders
        })
      }
      
      // Incrementar contador antes de executar o handler
      const updated = await store.increment(key, windowMs)
      
      // Executar handler
      const response = await handler(...args)
      
      // Verificar se deve pular a contagem baseado no resultado
      const shouldSkip = (
        (skipSuccessfulRequests && response.status < 400) ||
        (skipFailedRequests && response.status >= 400)
      )
      
      if (shouldSkip) {
        // Decrementar contador se deve pular
        if (updated.count > 0) {
          await store.set(key, updated.count - 1, windowMs)
        }
      }
      
      // Adicionar headers de rate limit na resposta
      if (headers) {
        const remaining = Math.max(0, maxRequests - updated.count)
        response.headers.set('X-RateLimit-Limit', maxRequests.toString())
        response.headers.set('X-RateLimit-Remaining', remaining.toString())
        response.headers.set('X-RateLimit-Reset', Math.ceil(updated.resetTime / 1000).toString())
      }
      
      return response
      
    } catch (error) {
      // Em caso de erro no rate limiting, permitir a requisição
      frontendLogger.logError('Erro no rate limiting', {
        key,
        url: req.url,
        method: req.method
      }, error as Error, 'rate-limit')
      
      return handler(...args)
    }
  }
}

/**
 * Middleware de rate limiting com configuração pré-definida
 * @param type Tipo de configuração pré-definida
 * @param customConfig Configurações adicionais ou sobrescritas
 * @param handler Handler da API
 */
export function withPresetRateLimit<T extends any[]>(
  type: keyof typeof RATE_LIMIT_CONFIGS,
  customConfig: Partial<RateLimitConfig> = {},
  handler: (...args: T) => Promise<NextResponse>
) {
  const baseConfig = RATE_LIMIT_CONFIGS[type]
  const finalConfig = { ...baseConfig, ...customConfig }
  
  return withRateLimit(finalConfig, handler)
}

/**
 * Middleware de rate limiting baseado em usuário autenticado
 * @param config Configuração do rate limiting
 * @param handler Handler da API
 */
export function withUserRateLimit<T extends any[]>(
  config: RateLimitConfig,
  handler: (...args: T) => Promise<NextResponse>
) {
  const userKeyGenerator = (req: NextRequest): string => {
    // Tentar extrair ID do usuário do token JWT
    const authHeader = req.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7)
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
        if (payload.sub || payload.user_id) {
          return `user:${payload.sub || payload.user_id}`
        }
      } catch (error) {
        // Fallback para IP se não conseguir extrair user ID
      }
    }
    
    // Fallback para gerador padrão baseado em IP
    return `ip:${defaultKeyGenerator(req)}`
  }
  
  return withRateLimit({
    ...config,
    keyGenerator: userKeyGenerator
  }, handler)
}

/**
 * Middleware de rate limiting adaptativo baseado na carga do sistema
 * @param baseConfig Configuração base
 * @param handler Handler da API
 */
export function withAdaptiveRateLimit<T extends any[]>(
  baseConfig: RateLimitConfig,
  handler: (...args: T) => Promise<NextResponse>
) {
  return withRateLimit({
    ...baseConfig,
    keyGenerator: (req: NextRequest) => {
      const key = baseConfig.keyGenerator?.(req) || defaultKeyGenerator(req)
      
      // Adicionar timestamp para janelas deslizantes
      const windowStart = Math.floor(Date.now() / baseConfig.windowMs) * baseConfig.windowMs
      return `${key}:${windowStart}`
    }
  }, handler)
}

/**
 * Função utilitária para verificar status do rate limit sem incrementar
 * @param req Request object
 * @param config Configuração do rate limiting
 * @returns Status atual do rate limit
 */
export async function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig
): Promise<{
  allowed: boolean
  count: number
  remaining: number
  resetTime: number
}> {
  const keyGenerator = config.keyGenerator || defaultKeyGenerator
  const key = keyGenerator(req)
  
  const current = await store.get(key)
  const count = current?.count || 0
  const remaining = Math.max(0, config.maxRequests - count)
  const resetTime = current?.resetTime || Date.now() + config.windowMs
  
  return {
    allowed: count < config.maxRequests,
    count,
    remaining,
    resetTime
  }
}

export default {
  withRateLimit,
  withPresetRateLimit,
  withUserRateLimit,
  withAdaptiveRateLimit,
  checkRateLimit,
  RATE_LIMIT_CONFIGS
}