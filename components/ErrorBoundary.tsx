'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { errorHandler, AppError } from '../lib/error-handler'
import { frontendLogger } from '../lib/frontend-logger'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
  context?: string
}

interface State {
  hasError: boolean
  appError?: AppError
  errorId?: string
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Atualiza o state para mostrar a UI de erro
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const context = this.props.context || 'React Error Boundary'
    
    // Gerar ID único para este erro
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Log no sistema de frontend
    frontendLogger.logCritical(
      'Erro capturado pelo Error Boundary',
      {
        errorId,
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        context,
        timestamp: new Date().toISOString()
      },
      error,
      'ui'
    )
    
    // Usar o sistema de tratamento de erros (mantido para compatibilidade)
    const appError = errorHandler.reportCritical(error, context, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    })
    
    this.setState({ 
      appError,
      errorId
    })
    
    // Callback personalizado se fornecido
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = () => {
    frontendLogger.logUserAction('error_boundary_retry', { errorId: this.state.errorId })
    this.setState({ hasError: false, appError: undefined, errorId: undefined })
  }

  handleGoHome = () => {
    frontendLogger.logUserAction('error_boundary_go_home', { errorId: this.state.errorId })
    window.location.href = '/'
  }

  handleReload = () => {
    frontendLogger.logUserAction('error_boundary_reload', { errorId: this.state.errorId })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Usar fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { appError, errorId } = this.state
      const isProduction = process.env.NODE_ENV === 'production'
      const showDetails = this.props.showDetails && !isProduction

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            {/* Ícone de erro */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            {/* Título */}
            <h1 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Oops! Algo deu errado
            </h1>

            {/* Mensagem do usuário */}
            <p className="text-gray-600 text-center mb-6">
              {appError?.userMessage || 'Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.'}
            </p>

            {/* ID do erro (para suporte) */}
            {errorId && (
              <div className="bg-gray-100 rounded p-3 mb-6">
                <p className="text-sm text-gray-600 text-center">
                  ID do erro: <code className="font-mono text-xs">{errorId}</code>
                </p>
                <p className="text-xs text-gray-500 text-center mt-1">
                  Informe este código ao suporte se precisar de ajuda
                </p>
              </div>
            )}

            {/* Detalhes técnicos (apenas em desenvolvimento) */}
            {showDetails && appError && (
              <details className="mb-6">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  Detalhes técnicos
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono">
                  <div><strong>Tipo:</strong> {appError.type}</div>
                  <div><strong>Mensagem:</strong> {appError.message}</div>
                  {appError.code && <div><strong>Código:</strong> {appError.code}</div>}
                  <div><strong>Timestamp:</strong> {appError.timestamp}</div>
                  {appError.details && (
                    <div>
                      <strong>Detalhes:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">
                        {JSON.stringify(appError.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Botões de ação */}
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar novamente
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                Ir para página inicial
              </button>
              
              <button
                onClick={this.handleReload}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Recarregar página
              </button>
            </div>

            {/* Link para suporte */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Problema persistindo?{' '}
                <a 
                  href="mailto:suporte@pizzaria.com" 
                  className="text-blue-600 hover:text-blue-800"
                >
                  Entre em contato com o suporte
                </a>
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Componente funcional para casos simples
export function SimpleErrorBoundary({ 
  children, 
  message = 'Algo deu errado neste componente' 
}: { 
  children: ReactNode
  message?: string 
}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 border border-red-300 rounded bg-red-50">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800">{message}</p>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

// HOC para envolver componentes automaticamente
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

export default ErrorBoundary