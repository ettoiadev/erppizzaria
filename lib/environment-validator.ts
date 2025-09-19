/**
 * Validador de Configuração de Ambiente
 * Verifica se todas as variáveis necessárias estão configuradas
 */

import { appLogger } from './logging'

export interface EnvironmentConfig {


  // Autenticação (obrigatória)
  JWT_SECRET: string

  // Aplicação (obrigatórias)
  NEXT_PUBLIC_SITE_URL: string
  NODE_ENV: string

  // Mercado Pago (opcionais)
  MERCADOPAGO_ACCESS_TOKEN?: string
  MERCADOPAGO_WEBHOOK_SECRET?: string

  // Configurações opcionais
  ENABLE_QUERY_LOGS?: string
  LOG_LEVEL?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  config: Partial<EnvironmentConfig>
}

/**
 * Valida configuração de ambiente
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const config: Partial<EnvironmentConfig> = {}

  // Variáveis obrigatórias
  const requiredVars = [
  
    'JWT_SECRET',
    'NEXT_PUBLIC_SITE_URL',
    'NODE_ENV'
  ]

  // Verificar variáveis obrigatórias
  for (const varName of requiredVars) {
    const value = process.env[varName]
    if (!value) {
      errors.push(`Variável obrigatória ${varName} não configurada`)
    } else {
      config[varName as keyof EnvironmentConfig] = value
    }
  }

  // Validações específicas


  if (config.JWT_SECRET) {
    if (config.JWT_SECRET.length < 32) {
      warnings.push('JWT_SECRET deve ter pelo menos 32 caracteres para maior segurança')
    }
  }

  if (config.NODE_ENV === 'production') {
    // Validações específicas para produção
    if (config.JWT_SECRET === 'william-disk-pizza-dev-temp-key-2024') {
      errors.push('JWT_SECRET temporário não deve ser usado em produção')
    }
  }

  // Variáveis opcionais com avisos
  const optionalVars = [
    'MERCADOPAGO_ACCESS_TOKEN',
    'MERCADOPAGO_WEBHOOK_SECRET'
  ]

  for (const varName of optionalVars) {
    const value = process.env[varName]
    if (value) {
      config[varName as keyof EnvironmentConfig] = value
    } else {
      warnings.push(`Variável opcional ${varName} não configurada - funcionalidade limitada`)
    }
  }

  const isValid = errors.length === 0

  return {
    isValid,
    errors,
    warnings,
    config
  }
}

/**
 * Valida e registra resultado da configuração
 */
export function validateAndLogEnvironment(): boolean {
  const result = validateEnvironment()

  if (result.isValid) {
    appLogger.info('environment', 'Configuração de ambiente válida', {
      configuredVars: Object.keys(result.config).length,
      warnings: result.warnings.length
    })

    if (result.warnings.length > 0) {
      result.warnings.forEach(warning => {
        appLogger.warn('environment', warning)
      })
    }
  } else {
    appLogger.error('environment', 'Configuração de ambiente inválida', new Error('Environment validation failed'), {
      errors: result.errors,
      warnings: result.warnings
    })

    result.errors.forEach(error => {
      appLogger.critical('environment', error)
    })
  }

  return result.isValid
}

/**
 * Middleware para validar ambiente em rotas API
 */
export function withEnvironmentValidation<T extends (...args: any[]) => any>(
  handler: T
): T {
  return ((...args: any[]) => {
    const result = validateEnvironment()

    if (!result.isValid) {
      throw new Error(`Environment configuration invalid: ${result.errors.join(', ')}`)
    }

    return handler(...args)
  }) as T
}

/**
 * Utilitário para verificar se está em produção
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Utilitário para verificar se está em desenvolvimento
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Utilitário para obter URL base da aplicação
 */
export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}