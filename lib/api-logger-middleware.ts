import { NextRequest, NextResponse } from 'next/server'
import { frontendLogger } from './frontend-logger'

// Tipos para logging
interface ApiLogData {
  method: string
  url: string
  userAgent?: string
  ip?: string
  timestamp: string
  duration?: number
  status?: number
  error?: string
  userId?: string
}

// Função para obter IP do cliente
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'
}

// Função para extrair userId do token (se disponível)
function extractUserId(request: NextRequest): string | undefined {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) return undefined
    
    const token = authHeader.substring(7)
    // Decodificar JWT básico (apenas para logging, não para validação)
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.sub || payload.user_id
  } catch {
    return undefined
  }
}

// Função para sanitizar dados sensíveis do log
function sanitizeLogData(data: any): any {
  if (typeof data === 'string') {
    // Remover possíveis tokens, senhas, etc.
    return data.replace(/Bearer\s+[\w-]+\.[\w-]+\.[\w-]+/g, 'Bearer [REDACTED]')
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeLogData)
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(data)) {
      // Remover campos sensíveis
      if (['password', 'token', 'secret', 'key', 'authorization'].includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[key] = sanitizeLogData(value)
      }
    }
    return sanitized
  }
  
  return data
}

// Higher-order function para logging de API
export function withApiLogging<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  options: {
    logRequest?: boolean
    logResponse?: boolean
    logErrors?: boolean
    skipPaths?: string[]
  } = {}
) {
  const {
    logRequest = true,
    logResponse = true,
    logErrors = true,
    skipPaths = []
  } = options
  
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const startTime = Date.now()
    const timestamp = new Date().toISOString()
    const url = new URL(request.url)
    
    // Verificar se deve pular o logging para este path
    if (skipPaths.some(path => url.pathname.includes(path))) {
      return handler(request, ...args)
    }
    
    const logData: ApiLogData = {
      method: request.method,
      url: url.pathname + url.search,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: getClientIp(request),
      timestamp,
      userId: extractUserId(request)
    }
    
    // Log da requisição
    if (logRequest) {
      frontendLogger.info('API Request', sanitizeLogData({
        ...logData,
        headers: Object.fromEntries(request.headers.entries())
      }))
    }
    
    try {
      const response = await handler(request, ...args)
      const duration = Date.now() - startTime
      
      // Log da resposta
      if (logResponse) {
        frontendLogger.info('API Response', sanitizeLogData({
          ...logData,
          duration,
          status: response.status
        }))
      }
      
      return response
    } catch (error) {
      const duration = Date.now() - startTime
      
      // Log do erro
      if (logErrors) {
        frontendLogger.logError('API Error', sanitizeLogData({
          ...logData,
          duration,
          error: error instanceof Error ? error.message : String(error)
        }))
      }
      
      throw error
    }
  }
}

// Função para logging manual
export function logApiEvent(event: string, data: any): void {
  frontendLogger.info(`API Event: ${event}`, sanitizeLogData(data))
}

// Função para logging de performance
export function logPerformance(operation: string, duration: number, metadata?: any): void {
  frontendLogger.info('Performance', sanitizeLogData({
    operation,
    duration,
    timestamp: new Date().toISOString(),
    ...metadata
  }))
}