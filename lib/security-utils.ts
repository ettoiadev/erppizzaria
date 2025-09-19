import { NextRequest, NextResponse } from 'next/server'
import { 
  CORS_CONFIG, 
  SECURITY_HEADERS, 
  generateCSP, 
  generateHSTS, 
  isAllowedOrigin,
  RATE_LIMIT_CONFIG 
} from './security-config'
import { frontendLogger } from './frontend-logger'
import { logSuspiciousActivity as logSuspiciousSecurityActivity, SecurityEventType, SecuritySeverity, securityLogger } from './security-logger'

/**
 * Aplica headers de segurança padronizados a uma resposta
 */
export function applySecurityHeaders(response: NextResponse, environment: 'development' | 'production' = process.env.NODE_ENV as 'development' | 'production'): NextResponse {
  // Headers básicos de segurança
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // Content Security Policy
  response.headers.set('Content-Security-Policy', generateCSP(environment))
  
  // HSTS apenas em produção
  if (environment === 'production') {
    response.headers.set('Strict-Transport-Security', generateHSTS())
  }
  
  return response
}

/**
 * Aplica configuração CORS padronizada e segura
 */
export function applyCorsHeaders(response: NextResponse, request?: NextRequest): NextResponse {
  const environment = (process.env.NODE_ENV as 'development' | 'production') || 'development'
  const config = CORS_CONFIG[environment]
  
  let allowedOrigin = 'null'
  
  if (request) {
    const requestOrigin = request.headers.get('origin')
    
    if (requestOrigin && isAllowedOrigin(requestOrigin, environment)) {
      allowedOrigin = requestOrigin
      
      // Log de origem permitida para monitoramento
      frontendLogger.info('CORS: Origem permitida', 'api', {
        origin: requestOrigin,
        environment
      })
    } else if (requestOrigin) {
      // Log de origem rejeitada para segurança
      frontendLogger.warn('CORS: Origem rejeitada', 'api', {
        origin: requestOrigin,
        environment,
        allowedOrigins: config.allowedOrigins
      })
    }
  } else if (environment === 'development') {
    // Fallback para desenvolvimento
    allowedOrigin = 'http://localhost:3000'
  }
  
  // Aplicar headers CORS
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token')
  response.headers.set('Access-Control-Allow-Credentials', config.allowCredentials.toString())
  response.headers.set('Access-Control-Max-Age', config.maxAge.toString())
  
  return response
}

/**
 * Cria uma resposta segura com CORS e headers de segurança
 */
export function createSecureResponse(data: any, status: number = 200, request?: NextRequest): NextResponse {
  const response = NextResponse.json(data, { status })
  
  // Aplicar CORS
  applyCorsHeaders(response, request)
  
  // Aplicar headers de segurança
  applySecurityHeaders(response)
  
  return response
}

/**
 * Cria handler OPTIONS seguro e padronizado
 */
export function createSecureOptionsHandler() {
  return function OPTIONS(request: NextRequest): NextResponse {
    const response = new NextResponse(null, { status: 200 })
    
    // Aplicar CORS
    applyCorsHeaders(response, request)
    
    // Aplicar headers de segurança
    applySecurityHeaders(response)
    
    return response
  }
}

/**
 * Cria resposta de erro segura com logs
 */
export function createSecureErrorResponse(
  error: string, 
  status: number = 400, 
  request?: NextRequest,
  logLevel: 'info' | 'warn' | 'error' = 'warn'
): NextResponse {
  // Log usando o novo sistema de segurança
  if (request) {
    const severity = status >= 500 ? SecuritySeverity.HIGH : 
                    status >= 400 ? SecuritySeverity.MEDIUM : 
                    SecuritySeverity.LOW
    
    securityLogger.logSecurityEvent(
      SecurityEventType.INVALID_INPUT,
      severity,
      `Erro na API: ${error}`,
      request,
      { status, error }
    )
  }
  
  // Log do erro para monitoramento (compatibilidade)
  if (logLevel === 'error') {
    frontendLogger.logError('Erro na API', {
      error,
      status,
      origin: request?.headers.get('origin'),
      userAgent: request?.headers.get('user-agent'),
      ip: request?.ip || request?.headers.get('x-forwarded-for')
    }, new Error(error), 'api')
  } else if (logLevel === 'warn') {
    frontendLogger.warn('Erro na API', 'api', {
      error,
      status,
      origin: request?.headers.get('origin'),
      userAgent: request?.headers.get('user-agent'),
      ip: request?.ip || request?.headers.get('x-forwarded-for')
    })
  } else {
    frontendLogger.info('Erro na API', 'api', {
    error,
    status,
      origin: request?.headers.get('origin'),
      userAgent: request?.headers.get('user-agent'),
      ip: request?.ip || request?.headers.get('x-forwarded-for')
    })
  }
  
  return createSecureResponse({ error, success: false }, status, request)
}

/**
 * Valida rate limiting com configuração centralizada
 */
export function validateRateLimit(
  request: NextRequest, 
  type: keyof typeof RATE_LIMIT_CONFIG = 'public'
): { allowed: boolean; message?: string; remaining?: number } {
  // Implementação básica - pode ser expandida com Redis ou banco
  const config = RATE_LIMIT_CONFIG[type]
  
  // Por enquanto, sempre permitir (implementação completa seria com cache/Redis)
  // Esta é uma estrutura para implementação futura
  return {
    allowed: true,
    remaining: config.requests
  }
}

/**
 * Sanitiza entrada de dados básica
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove scripts e tags HTML perigosas
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim()
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value)
    }
    return sanitized
  }
  
  return input
}

/**
 * Log de atividade suspeita
 */
export function logSuspiciousActivity(
  request: NextRequest, 
  activity: string, 
  details?: any
): void {
  // Usar o novo sistema de logs de segurança
  logSuspiciousSecurityActivity(request, activity, details)
  
  // Manter compatibilidade com o sistema antigo
  frontendLogger.warn('Atividade suspeita detectada', 'api', {
    activity,
    details,
    ip: request.ip || request.headers.get('x-forwarded-for'),
    userAgent: request.headers.get('user-agent'),
    origin: request.headers.get('origin'),
    timestamp: new Date().toISOString()
  })
}

/**
 * Valida se a requisição vem de uma origem confiável
 */
export function validateTrustedOrigin(request: NextRequest): boolean {
  const environment = (process.env.NODE_ENV as 'development' | 'production') || 'development'
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')
  
  // Em desenvolvimento, ser mais permissivo
  if (environment === 'development') {
    // Permitir requisições sem origin (same-origin, Postman, curl, formulários)
    if (!origin) {
      return true
    }
    
    // Permitir localhost em várias formas
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return true
    }
    
    // Verificar se é same-origin usando host header
    if (host && origin.includes(host)) {
      return true
    }
  }
  
  // Em produção, verificar se há referer do mesmo domínio quando não há origin
  if (!origin) {
    if (referer) {
      try {
        const refererUrl = new URL(referer)
        const requestUrl = new URL(request.url)
        return refererUrl.hostname === requestUrl.hostname
      } catch {
        return false
      }
    }
    // Em produção sem origin nem referer, rejeitar
    return environment === 'development'
  }
  
  return isAllowedOrigin(origin, environment)
}