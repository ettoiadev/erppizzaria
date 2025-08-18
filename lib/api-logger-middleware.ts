// Middleware de logging para rotas de API
import { NextRequest, NextResponse } from 'next/server'
import { appLogger, createRequestLogger } from './logging'

// Tipos para o middleware
type ApiHandler = (req: NextRequest, context?: any) => Promise<NextResponse>
type MiddlewareOptions = {
  logRequests?: boolean
  logResponses?: boolean
  logErrors?: boolean
  sensitiveRoutes?: string[]
  skipLogging?: string[]
}

// Configuração padrão
const defaultOptions: MiddlewareOptions = {
  logRequests: true,
  logResponses: true,
  logErrors: true,
  sensitiveRoutes: ['/api/auth', '/api/payments'],
  skipLogging: ['/api/health', '/api/debug']
}

// Função para extrair informações do request
function extractRequestInfo(req: NextRequest) {
  if (!req || !req.url) {
    throw new Error('Request ou URL está ausente')
  }
  
  let url: URL
  try {
    url = new URL(req.url)
  } catch (error) {
    // Fallback para URLs relativas
    try {
      url = new URL(req.url, 'http://localhost')
    } catch (fallbackError) {
      throw new Error(`URL inválida passada para extractRequestInfo: ${req.url}`)
    }
  }
  
  const method = req.method || 'UNKNOWN'
  const pathname = url.pathname
  const searchParams = Object.fromEntries(url.searchParams.entries())
  
  return {
    method,
    pathname,
    searchParams: Object.keys(searchParams).length > 0 ? searchParams : undefined,
    userAgent: req.headers.get('user-agent'),
    contentType: req.headers.get('content-type'),
    authorization: req.headers.get('authorization') ? '[PRESENT]' : '[ABSENT]'
  }
}

// Função para extrair informações do response
function extractResponseInfo(response: NextResponse) {
  if (!response) {
    throw new Error('Response está ausente')
  }
  
  return {
    status: response.status || 500,
    statusText: response.statusText || 'Unknown',
    contentType: response.headers?.get('content-type') || null,
    contentLength: response.headers?.get('content-length') || null
  }
}

// Função para determinar se a rota é sensível
function isSensitiveRoute(pathname: string, sensitiveRoutes: string[]): boolean {
  return sensitiveRoutes.some(route => pathname.startsWith(route))
}

// Função para determinar se deve pular o logging
function shouldSkipLogging(pathname: string, skipRoutes: string[]): boolean {
  return skipRoutes.some(route => pathname.startsWith(route))
}

// Middleware principal
export function withApiLogging(handler: ApiHandler, options: MiddlewareOptions = {}) {
  const config = { ...defaultOptions, ...options }
  
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const startTime = Date.now()
    const requestInfo = extractRequestInfo(req)
    const requestLogger = createRequestLogger(req)
    
    // Verificar se deve pular o logging
    if (shouldSkipLogging(requestInfo.pathname, config.skipLogging || [])) {
      return handler(req, context)
    }
    
    // Verificar se é rota sensível
    const isSensitive = isSensitiveRoute(requestInfo.pathname, config.sensitiveRoutes || [])
    
    // Log do request
    if (config.logRequests) {
      const logData = isSensitive 
        ? { method: requestInfo.method, pathname: requestInfo.pathname }
        : requestInfo
        
      requestLogger.info('api', `Incoming request: ${requestInfo.method} ${requestInfo.pathname}`, logData)
    }
    
    let response: NextResponse
    let error: Error | null = null
    
    try {
      // Executar o handler
      response = await handler(req, context)
      
      // Log do response
      if (config.logResponses) {
        const duration = Date.now() - startTime
        const responseInfo = extractResponseInfo(response)
        
        const logData = {
          ...responseInfo,
          duration: `${duration}ms`,
          ...(isSensitive ? {} : { request: requestInfo })
        }
        
        const level = response.status >= 400 ? 'error' : 'info'
        requestLogger.log(level, 'api', 
          `Response: ${requestInfo.method} ${requestInfo.pathname} - ${response.status}`, 
          logData
        )
      }
      
      return response
      
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err))
      
      // Log do erro
      if (config.logErrors) {
        const duration = Date.now() - startTime
        
        const errorData = {
          duration: `${duration}ms`,
          errorName: error.constructor.name,
          errorMessage: error.message,
          ...(isSensitive ? {} : { request: requestInfo }),
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
        
        requestLogger.error('api', 
          `Error in ${requestInfo.method} ${requestInfo.pathname}`, 
          error, 
          errorData
        )
      }
      
      // Retornar resposta de erro padronizada
      const isProduction = process.env.NODE_ENV === 'production'
      
      return NextResponse.json({
        error: isProduction ? 'Erro interno do servidor' : error.message,
        ...(isProduction ? {} : { 
          details: {
            name: error.constructor.name,
            message: error.message,
            stack: error.stack
          }
        })
      }, { status: 500 })
    }
  }
}

// Wrapper específico para diferentes tipos de erro
export function withErrorHandling(handler: ApiHandler) {
  return withApiLogging(handler, {
    logRequests: true,
    logResponses: true,
    logErrors: true
  })
}

// Wrapper para rotas sensíveis (menos logging)
export function withSensitiveLogging(handler: ApiHandler) {
  return withApiLogging(handler, {
    logRequests: true,
    logResponses: false,
    logErrors: true,
    sensitiveRoutes: [''] // Tratar toda rota como sensível
  })
}

// Wrapper para rotas de debug (logging detalhado)
export function withDebugLogging(handler: ApiHandler) {
  return withApiLogging(handler, {
    logRequests: true,
    logResponses: true,
    logErrors: true,
    sensitiveRoutes: [] // Nenhuma rota é sensível
  })
}

// Helper para logging manual em handlers
export function createApiLogger(req: NextRequest) {
  const requestLogger = createRequestLogger(req)
  const requestInfo = extractRequestInfo(req)
  
  return {
    ...requestLogger,
    requestInfo,
    
    // Métodos específicos para API
    logQuery: (query: string, params?: any) => {
      appLogger.supabase.query(`${requestInfo.method} ${requestInfo.pathname} - ${query}`, params, {
        requestId: requestLogger.requestId
      })
    },
    
    logAuth: (action: string, userId?: string, success?: boolean) => {
      appLogger.auth.login(userId || 'unknown', success ?? true, {
        requestId: requestLogger.requestId
      })
    },
    
    logPayment: (orderId: string, amount: number, method: string) => {
      appLogger.payment.attempt(orderId, amount, method, {
        requestId: requestLogger.requestId
      })
    }
  }
}

export default withApiLogging