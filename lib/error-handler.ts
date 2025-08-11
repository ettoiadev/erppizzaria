// Sistema de tratamento de erros para frontend
import React from 'react'
import { appLogger } from './logging'

// Tipos de erro
export type ErrorType = 
  | 'network'
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'server'
  | 'client'
  | 'unknown'

// Interface para erros padronizados
export interface AppError {
  type: ErrorType
  message: string
  userMessage: string
  code?: string
  details?: any
  originalError?: Error
  timestamp: string
  requestId?: string
}

// Mensagens amigáveis para usuários
const USER_FRIENDLY_MESSAGES: Record<ErrorType, string> = {
  network: 'Problema de conexão. Verifique sua internet e tente novamente.',
  authentication: 'Sessão expirada. Faça login novamente.',
  authorization: 'Você não tem permissão para realizar esta ação.',
  validation: 'Dados inválidos. Verifique as informações e tente novamente.',
  server: 'Erro interno do servidor. Tente novamente em alguns minutos.',
  client: 'Erro na aplicação. Recarregue a página e tente novamente.',
  unknown: 'Erro inesperado. Tente novamente ou entre em contato com o suporte.'
}

// Função para determinar o tipo de erro
function determineErrorType(error: any): ErrorType {
  if (!error) return 'unknown'
  
  // Erros de rede
  if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
    return 'network'
  }
  
  // Erros HTTP
  if (error.status || error.response?.status) {
    const status = error.status || error.response.status
    
    if (status === 401) return 'authentication'
    if (status === 403) return 'authorization'
    if (status >= 400 && status < 500) return 'validation'
    if (status >= 500) return 'server'
  }
  
  // Erros do Supabase
  if (error.message?.includes('JWT') || error.message?.includes('auth')) {
    return 'authentication'
  }
  
  // Erros de validação
  if (error.name === 'ValidationError' || error.code === 'VALIDATION_ERROR') {
    return 'validation'
  }
  
  // Erros do cliente
  if (error.name === 'TypeError' || error.name === 'ReferenceError') {
    return 'client'
  }
  
  return 'unknown'
}

// Função para extrair mensagem de erro
function extractErrorMessage(error: any): string {
  if (typeof error === 'string') return error
  if (error?.message) return error.message
  if (error?.error?.message) return error.error.message
  if (error?.data?.message) return error.data.message
  return 'Erro desconhecido'
}

// Função para extrair código de erro
function extractErrorCode(error: any): string | undefined {
  return error?.code || error?.error?.code || error?.data?.code
}

// Função principal para criar AppError
export function createAppError(
  error: any, 
  context?: string, 
  requestId?: string
): AppError {
  const type = determineErrorType(error)
  const message = extractErrorMessage(error)
  const code = extractErrorCode(error)
  const userMessage = USER_FRIENDLY_MESSAGES[type]
  
  const appError: AppError = {
    type,
    message,
    userMessage,
    code,
    details: {
      context,
      originalType: error?.constructor?.name,
      status: error?.status || error?.response?.status,
      url: error?.config?.url || error?.url
    },
    originalError: error instanceof Error ? error : undefined,
    timestamp: new Date().toISOString(),
    requestId
  }
  
  return appError
}

// Classe para gerenciar erros globalmente
export class ErrorHandler {
  private static instance: ErrorHandler
  private errorQueue: AppError[] = []
  private maxQueueSize = 50
  
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }
  
  // Método principal para tratar erros
  handle(error: any, context?: string, requestId?: string): AppError {
    const appError = createAppError(error, context, requestId)
    
    // Adicionar à fila de erros
    this.addToQueue(appError)
    
    // Log detalhado para desenvolvedores
    this.logError(appError)
    
    // Em produção, não mostrar detalhes no console do browser
    if (process.env.NODE_ENV === 'production') {
      // Apenas log básico no console do browser
      console.error(`[${appError.type.toUpperCase()}] ${appError.userMessage}`)
    } else {
      // Em desenvolvimento, mostrar detalhes
      console.group(`🚨 Error in ${context || 'Unknown Context'}`)
      console.error('User Message:', appError.userMessage)
      console.error('Technical Message:', appError.message)
      console.error('Error Type:', appError.type)
      console.error('Error Code:', appError.code)
      console.error('Details:', appError.details)
      if (appError.originalError) {
        console.error('Original Error:', appError.originalError)
      }
      console.groupEnd()
    }
    
    return appError
  }
  
  // Adicionar erro à fila
  private addToQueue(error: AppError) {
    this.errorQueue.push(error)
    
    // Manter apenas os últimos erros
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize)
    }
  }
  
  // Log detalhado usando o sistema de logging
  private logError(appError: AppError) {
    const logData = {
      type: appError.type,
      code: appError.code,
      details: appError.details,
      requestId: appError.requestId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    }
    
    // Usar nível apropriado baseado no tipo
    switch (appError.type) {
      case 'authentication':
        if (appError.originalError) {
          appLogger.auth.tokenError(appError.originalError, logData)
        } else {
          appLogger.error('auth', 'Erro de autenticação', undefined, logData)
        }
        break
      case 'network':
        appLogger.error('general', 'Erro de rede', appError.originalError, logData)
        break
      case 'server':
        appLogger.error('api', 'Erro do servidor', appError.originalError, logData)
        break
      default:
        appLogger.error('general', appError.message, appError.originalError, logData)
    }
  }
  
  // Obter erros recentes (para debug)
  getRecentErrors(count: number = 10): AppError[] {
    return this.errorQueue.slice(-count)
  }
  
  // Limpar fila de erros
  clearErrors() {
    this.errorQueue = []
  }
  
  // Método para reportar erro crítico
  reportCritical(error: any, context: string, additionalData?: any) {
    const appError = this.handle(error, context)
    
    // Log crítico
    appLogger.critical('general', `Erro crítico: ${appError.message}`, appError.originalError, {
      ...appError.details,
      ...additionalData,
      errorQueue: this.errorQueue.length
    })
    
    return appError
  }
}

// Instância global
export const errorHandler = ErrorHandler.getInstance()

// Hooks para React (se necessário)
export function useErrorHandler() {
  const handleError = (error: any, context?: string) => {
    return errorHandler.handle(error, context)
  }
  
  const handleCriticalError = (error: any, context: string, additionalData?: any) => {
    return errorHandler.reportCritical(error, context, additionalData)
  }
  
  return {
    handleError,
    handleCriticalError,
    getRecentErrors: () => errorHandler.getRecentErrors(),
    clearErrors: () => errorHandler.clearErrors()
  }
}

// Wrapper para funções assíncronas
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: string
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      const appError = errorHandler.handle(error, context)
      throw appError
    }
  }
}

// Wrapper para componentes React
export function withComponentErrorHandling<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function WrappedComponent(props: P) {
    try {
      return React.createElement(Component, props)
    } catch (error) {
      errorHandler.handle(error, `Component: ${componentName}`)
      
      // Componente de fallback
      return React.createElement('div', 
        { className: 'error-boundary p-4 border border-red-300 rounded bg-red-50' },
        React.createElement('h3', { className: 'text-red-800 font-semibold' }, 'Erro no componente'),
        React.createElement('p', { className: 'text-red-600' }, 'Ocorreu um erro inesperado. Tente recarregar a página.')
      )
    }
  }
}

// Configurar tratamento global de erros não capturados
if (typeof window !== 'undefined') {
  // Erros JavaScript não capturados
  window.addEventListener('error', (event) => {
    errorHandler.handle(event.error, 'Global Error Handler', event.filename)
  })
  
  // Promises rejeitadas não capturadas
  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handle(event.reason, 'Unhandled Promise Rejection')
  })
}

export default errorHandler