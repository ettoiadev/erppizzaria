'use client'

import { useCallback, useEffect, useState } from 'react'
import { errorHandler, AppError, useErrorHandler } from '../lib/error-handler'
import { appLogger } from '../lib/logging'
import { frontendLogger, useFrontendLogger } from '../lib/frontend-logger'

// Interface para configuração do hook
interface UseErrorHandlingOptions {
  context?: string
  enableGlobalErrorCapture?: boolean
  onError?: (error: AppError) => void
  maxRecentErrors?: number
}

// Interface para o retorno do hook
interface UseErrorHandlingReturn {
  // Funções para tratar erros
  handleError: (error: any, context?: string) => AppError
  handleAsyncError: <T>(promise: Promise<T>, context?: string) => Promise<T>
  handleCriticalError: (error: any, context?: string, additionalData?: any) => AppError
  
  // Estado dos erros
  recentErrors: AppError[]
  hasErrors: boolean
  lastError?: AppError
  
  // Funções de controle
  clearErrors: () => void
  clearLastError: () => void
  
  // Logging específico
  logInfo: (message: string, data?: any) => void
  logWarning: (message: string, data?: any) => void
  logDebug: (message: string, data?: any) => void
  
  // Métodos específicos do frontend logger
  logUserAction: (action: string, data?: any) => void
  logPerformance: (operation: string, duration: number, data?: any) => void
  setUserId: (userId: string) => void
  clearUserId: () => void
  getErrorMessage: (error: Error) => import('../lib/frontend-logger').UserFriendlyError
}

// Hook principal
export function useErrorHandling(options: UseErrorHandlingOptions = {}): UseErrorHandlingReturn {
  const {
    context = 'React Component',
    enableGlobalErrorCapture = false,
    onError,
    maxRecentErrors = 5
  } = options
  
  const [recentErrors, setRecentErrors] = useState<AppError[]>([])
  const [lastError, setLastError] = useState<AppError | undefined>()
  
  const { handleError: baseHandleError, handleCriticalError: baseHandleCriticalError } = useErrorHandler()
  const logger = useFrontendLogger()
  
  // Função para tratar erros com estado local
  const handleError = useCallback((error: any, errorContext?: string) => {
    const fullContext = errorContext ? `${context} - ${errorContext}` : context
    
    // Log no sistema de frontend
    logger.logError(
      `Erro tratado: ${error.message || error}`,
      { context: fullContext, timestamp: new Date().toISOString() },
      error instanceof Error ? error : new Error(String(error)),
      'ui'
    )
    
    const appError = baseHandleError(error, fullContext)
    
    // Atualizar estado local
    setLastError(appError)
    setRecentErrors(prev => {
      const updated = [...prev, appError].slice(-maxRecentErrors)
      return updated
    })
    
    // Callback personalizado
    if (onError) {
      onError(appError)
    }
    
    return appError
  }, [context, baseHandleError, onError, maxRecentErrors, logger])
  
  // Função para tratar erros críticos
  const handleCriticalError = useCallback((error: any, errorContext?: string, additionalData?: any) => {
    const fullContext = errorContext ? `${context} - ${errorContext}` : context
    
    // Log crítico no sistema de frontend
    logger.logCritical(
      `Erro crítico: ${error.message || error}`,
      { context: fullContext, additionalData, timestamp: new Date().toISOString() },
      error instanceof Error ? error : new Error(String(error)),
      'ui'
    )
    
    const appError = baseHandleCriticalError(error, fullContext, additionalData)
    
    // Atualizar estado local
    setLastError(appError)
    setRecentErrors(prev => {
      const updated = [...prev, appError].slice(-maxRecentErrors)
      return updated
    })
    
    // Callback personalizado
    if (onError) {
      onError(appError)
    }
    
    return appError
  }, [context, baseHandleCriticalError, onError, maxRecentErrors, logger])
  
  // Função para tratar promises com erro
  const handleAsyncError = useCallback(async <T>(promise: Promise<T>, errorContext?: string): Promise<T> => {
    try {
      const result = await promise
      logger.debug(`Operação assíncrona concluída: ${errorContext || 'unknown'}`, 'api')
      return result
    } catch (error) {
      logger.logError(
        `Erro em operação assíncrona: ${errorContext || 'unknown'}`,
        { context: errorContext, timestamp: new Date().toISOString() },
        error as Error,
        'api'
      )
      
      const appError = handleError(error, errorContext)
      throw appError
    }
  }, [handleError, logger])
  
  // Funções de logging específicas
  const logInfo = useCallback((message: string, data?: any) => {
    logger.info(`${context}: ${message}`, 'ui', data)
    appLogger.info('general', `${context}: ${message}`, data)
  }, [context, logger])
  
  const logWarning = useCallback((message: string, data?: any) => {
    logger.warn(`${context}: ${message}`, 'ui', data)
    appLogger.warn('general', `${context}: ${message}`, data)
  }, [context, logger])
  
  const logDebug = useCallback((message: string, data?: any) => {
    logger.debug(`${context}: ${message}`, 'ui', data)
    appLogger.debug('general', `${context}: ${message}`, data)
  }, [context, logger])
  
  // Funções de controle
  const clearErrors = useCallback(() => {
    logger.logUserAction('clear_errors', { errorCount: recentErrors.length })
    setRecentErrors([])
    setLastError(undefined)
  }, [logger, recentErrors.length])
  
  const clearLastError = useCallback(() => {
    setLastError(undefined)
  }, [])
  
  // Captura global de erros (opcional)
  useEffect(() => {
    if (!enableGlobalErrorCapture) return
    
    const handleGlobalError = (event: ErrorEvent) => {
      handleError(event.error, 'Global Error')
    }
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      handleError(event.reason, 'Unhandled Promise Rejection')
    }
    
    window.addEventListener('error', handleGlobalError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    
    return () => {
      window.removeEventListener('error', handleGlobalError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [enableGlobalErrorCapture, handleError])
  
  return {
    handleError,
    handleAsyncError,
    handleCriticalError,
    recentErrors,
    hasErrors: recentErrors.length > 0,
    lastError,
    clearErrors,
    clearLastError,
    logInfo,
    logWarning,
    logDebug,
    // Métodos específicos do frontend logger
    logUserAction: logger.logUserAction,
    logPerformance: logger.logPerformance,
    setUserId: logger.setUserId,
    clearUserId: logger.clearUserId,
    getErrorMessage: logger.getErrorMessage
  }
}

// Hook específico para formulários
export function useFormErrorHandling(formName: string) {
  const { handleError, logInfo, logWarning, logUserAction } = useErrorHandling({
    context: `Form: ${formName}`
  })
  
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleFieldError = useCallback((fieldName: string, error: any) => {
    const appError = handleError(error, `Field: ${fieldName}`)
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: appError.userMessage
    }))
    return appError
  }, [handleError])
  
  const clearFieldError = useCallback((fieldName: string) => {
    setFieldErrors(prev => {
      const updated = { ...prev }
      delete updated[fieldName]
      return updated
    })
  }, [])
  
  const clearAllFieldErrors = useCallback(() => {
    setFieldErrors({})
  }, [])
  
  const handleSubmit = useCallback(async <T>(
    submitFn: () => Promise<T>,
    onSuccess?: (result: T) => void,
    onError?: (error: AppError) => void
  ) => {
    setIsSubmitting(true)
    clearAllFieldErrors()
    
    logUserAction('form_submit_attempt')
    
    try {
      logInfo('Iniciando submissão do formulário')
      const result = await submitFn()
      logInfo('Formulário submetido com sucesso')
      
      logUserAction('form_submit_success')
      
      if (onSuccess) {
        onSuccess(result)
      }
      
      return result
    } catch (error) {
      const appError = handleError(error, 'Form Submission')
      logWarning('Erro na submissão do formulário', { error: appError })
      
      logUserAction('form_submit_error', { errorType: appError.type, errorCode: appError.code })
      
      if (onError) {
        onError(appError)
      }
      
      throw appError
    } finally {
      setIsSubmitting(false)
    }
  }, [handleError, logInfo, logWarning, clearAllFieldErrors, logUserAction])
  
  return {
    fieldErrors,
    isSubmitting,
    handleFieldError,
    clearFieldError,
    clearAllFieldErrors,
    handleSubmit
  }
}

// Hook específico para requisições API
export function useApiErrorHandling(apiName: string) {
  const { handleError, handleAsyncError, logInfo, logDebug, logUserAction, logPerformance } = useErrorHandling({
    context: `API: ${apiName}`
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [lastResponse, setLastResponse] = useState<any>(null)
  
  const makeRequest = useCallback(async <T>(
    requestFn: () => Promise<T>,
    options: {
      onSuccess?: (data: T) => void
      onError?: (error: AppError) => void
      logRequest?: boolean
      logResponse?: boolean
      endpoint?: string
    } = {}
  ) => {
    const { onSuccess, onError, logRequest = true, logResponse = true, endpoint } = options
    const startTime = Date.now()
    
    setIsLoading(true)
    
    logUserAction('api_call_start', { endpoint: endpoint || apiName })
    
    try {
      if (logRequest) {
        logInfo('Iniciando requisição')
      }
      
      const result = await handleAsyncError(requestFn(), 'API Request')
      
      const duration = Date.now() - startTime
      
      if (logResponse) {
        logDebug('Requisição concluída com sucesso')
      }
      
      logPerformance(`API Success: ${endpoint || apiName}`, duration)
      logUserAction('api_call_success', { endpoint: endpoint || apiName, duration })
      
      setLastResponse(result)
      
      if (onSuccess) {
        onSuccess(result)
      }
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      const appError = handleError(error, 'API Request')
      
      logPerformance(`API Error: ${endpoint || apiName}`, duration)
      logUserAction('api_call_error', { endpoint: endpoint || apiName, duration, errorType: appError.type })
      
      if (onError) {
        onError(appError)
      }
      
      throw appError
    } finally {
      setIsLoading(false)
    }
  }, [handleError, handleAsyncError, logInfo, logDebug, logUserAction, logPerformance, apiName])
  
  return {
    isLoading,
    lastResponse,
    makeRequest
  }
}

export default useErrorHandling