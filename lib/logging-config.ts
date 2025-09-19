// Configurações centralizadas para o sistema de logging

// Tipos de configuração
export interface LoggingConfig {
  // Configurações gerais
  enabled: boolean
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical'
  
  // Configurações de console
  console: {
    enabled: boolean
    colorize: boolean
    timestamp: boolean
    detailed: boolean
  }
  
  // Configurações de produção
  production: {
    hideStackTraces: boolean
    sanitizeData: boolean
    maxLogLength: number
    enableErrorReporting: boolean
  }
  
  // Configurações específicas por contexto
  contexts: {
    api: {
      logRequests: boolean
      logResponses: boolean
      logQueries: boolean
      sensitiveRoutes: string[]
    }
    postgresql: {
      logConnections: boolean
      logQueries: boolean
      logSlowQueries: boolean
      slowQueryThreshold: number
    }
    auth: {
      logAttempts: boolean
      logSuccesses: boolean
      logFailures: boolean
      maskSensitiveData: boolean
    }
    frontend: {
      logErrors: boolean
      logWarnings: boolean
      logUserActions: boolean
      enableGlobalErrorCapture: boolean
    }
    payment: {
      logAttempts: boolean
      logSuccesses: boolean
      logFailures: boolean
      maskCardData: boolean
    }
  }
  
  // Configurações de rate limiting para logs
  rateLimiting: {
    enabled: boolean
    maxLogsPerMinute: number
    burstLimit: number
  }
  
  // Configurações de retenção
  retention: {
    maxRecentErrors: number
    maxLogHistory: number
    cleanupInterval: number
  }
}

// Configuração padrão para desenvolvimento
const developmentConfig: LoggingConfig = {
  enabled: true,
  level: 'debug',
  
  console: {
    enabled: true,
    colorize: true,
    timestamp: true,
    detailed: true
  },
  
  production: {
    hideStackTraces: false,
    sanitizeData: false,
    maxLogLength: 10000,
    enableErrorReporting: false
  },
  
  contexts: {
    api: {
      logRequests: true,
      logResponses: true,
      logQueries: true,
      sensitiveRoutes: ['/api/auth', '/api/payments']
    },
    postgresql: {
      logConnections: true,
      logQueries: true,
      logSlowQueries: true,
      slowQueryThreshold: 1000
    },
    auth: {
      logAttempts: true,
      logSuccesses: true,
      logFailures: true,
      maskSensitiveData: false
    },
    frontend: {
      logErrors: true,
      logWarnings: true,
      logUserActions: true,
      enableGlobalErrorCapture: true
    },
    payment: {
      logAttempts: true,
      logSuccesses: true,
      logFailures: true,
      maskCardData: true
    }
  },
  
  rateLimiting: {
    enabled: false,
    maxLogsPerMinute: 1000,
    burstLimit: 100
  },
  
  retention: {
    maxRecentErrors: 50,
    maxLogHistory: 1000,
    cleanupInterval: 300000 // 5 minutos
  }
}

// Configuração para produção
const productionConfig: LoggingConfig = {
  enabled: true,
  level: 'info',
  
  console: {
    enabled: true,
    colorize: false,
    timestamp: true,
    detailed: false
  },
  
  production: {
    hideStackTraces: true,
    sanitizeData: true,
    maxLogLength: 2000,
    enableErrorReporting: true
  },
  
  contexts: {
    api: {
      logRequests: true,
      logResponses: false, // Não logar responses em produção por padrão
      logQueries: false,   // Não logar queries em produção por padrão
      sensitiveRoutes: ['/api/auth', '/api/payments', '/api/admin']
    },
    postgresql: {
      logConnections: false,
      logQueries: false,
      logSlowQueries: true,
      slowQueryThreshold: 2000
    },
    auth: {
      logAttempts: true,
      logSuccesses: false, // Não logar sucessos em produção
      logFailures: true,
      maskSensitiveData: true
    },
    frontend: {
      logErrors: true,
      logWarnings: false,
      logUserActions: false,
      enableGlobalErrorCapture: true
    },
    payment: {
      logAttempts: true,
      logSuccesses: true,
      logFailures: true,
      maskCardData: true
    }
  },
  
  rateLimiting: {
    enabled: true,
    maxLogsPerMinute: 100,
    burstLimit: 20
  },
  
  retention: {
    maxRecentErrors: 20,
    maxLogHistory: 100,
    cleanupInterval: 600000 // 10 minutos
  }
}

// Configuração para testes
const testConfig: LoggingConfig = {
  enabled: false, // Desabilitar logging em testes por padrão
  level: 'error',
  
  console: {
    enabled: false,
    colorize: false,
    timestamp: false,
    detailed: false
  },
  
  production: {
    hideStackTraces: false,
    sanitizeData: false,
    maxLogLength: 1000,
    enableErrorReporting: false
  },
  
  contexts: {
    api: {
      logRequests: false,
      logResponses: false,
      logQueries: false,
      sensitiveRoutes: []
    },
    postgresql: {
      logConnections: false,
      logQueries: false,
      logSlowQueries: false,
      slowQueryThreshold: 5000
    },
    auth: {
      logAttempts: false,
      logSuccesses: false,
      logFailures: true, // Apenas falhas em testes
      maskSensitiveData: false
    },
    frontend: {
      logErrors: true,
      logWarnings: false,
      logUserActions: false,
      enableGlobalErrorCapture: false
    },
    payment: {
      logAttempts: false,
      logSuccesses: false,
      logFailures: true,
      maskCardData: true
    }
  },
  
  rateLimiting: {
    enabled: false,
    maxLogsPerMinute: 1000,
    burstLimit: 100
  },
  
  retention: {
    maxRecentErrors: 10,
    maxLogHistory: 50,
    cleanupInterval: 60000 // 1 minuto
  }
}

// Função para obter configuração baseada no ambiente
export function getLoggingConfig(): LoggingConfig {
  const env = process.env.NODE_ENV || 'development'
  
  let baseConfig: LoggingConfig
  
  switch (env) {
    case 'production':
      baseConfig = productionConfig
      break
    case 'test':
      baseConfig = testConfig
      break
    default:
      baseConfig = developmentConfig
  }
  
  // Aplicar overrides das variáveis de ambiente
  const config = { ...baseConfig }
  
  // Override geral
  if (process.env.ENABLE_CONSOLE_LOGS !== undefined) {
    config.console.enabled = process.env.ENABLE_CONSOLE_LOGS === 'true'
  }
  
  if (process.env.ENABLE_DETAILED_LOGS !== undefined) {
    config.console.detailed = process.env.ENABLE_DETAILED_LOGS === 'true'
  }
  
  if (process.env.LOG_LEVEL) {
    const level = process.env.LOG_LEVEL as LoggingConfig['level']
    if (['debug', 'info', 'warn', 'error', 'critical'].includes(level)) {
      config.level = level
    }
  }
  
  if (process.env.MAX_LOG_LENGTH) {
    const maxLength = parseInt(process.env.MAX_LOG_LENGTH)
    if (!isNaN(maxLength) && maxLength > 0) {
      config.production.maxLogLength = maxLength
    }
  }
  
  // Configurações específicas de query logs para PostgreSQL
  
  // Override de error reporting
  if (process.env.ENABLE_ERROR_REPORTING !== undefined) {
    config.production.enableErrorReporting = process.env.ENABLE_ERROR_REPORTING === 'true'
  }
  
  return config
}

// Configuração global (singleton)
let globalConfig: LoggingConfig | null = null

export function getGlobalLoggingConfig(): LoggingConfig {
  if (!globalConfig) {
    globalConfig = getLoggingConfig()
  }
  return globalConfig
}

// Função para recarregar configuração (útil para testes)
export function reloadLoggingConfig(): LoggingConfig {
  globalConfig = null
  return getGlobalLoggingConfig()
}

// Função para verificar se um nível de log está habilitado
export function isLogLevelEnabled(level: LoggingConfig['level']): boolean {
  const config = getGlobalLoggingConfig()
  
  if (!config.enabled) return false
  
  const levels = ['debug', 'info', 'warn', 'error', 'critical']
  const currentLevelIndex = levels.indexOf(config.level)
  const requestedLevelIndex = levels.indexOf(level)
  
  return requestedLevelIndex >= currentLevelIndex
}

// Função para verificar se um contexto está habilitado
export function isContextEnabled(context: keyof LoggingConfig['contexts'], action: string): boolean {
  const config = getGlobalLoggingConfig()
  
  if (!config.enabled) return false
  
  const contextConfig = config.contexts[context]
  if (!contextConfig) return false
  
  // Verificar ação específica
  switch (action) {
    case 'requests':
      return (contextConfig as any).logRequests ?? true
    case 'responses':
      return (contextConfig as any).logResponses ?? true
    case 'queries':
      return (contextConfig as any).logQueries ?? true
    case 'attempts':
      return (contextConfig as any).logAttempts ?? true
    case 'successes':
      return (contextConfig as any).logSuccesses ?? true
    case 'failures':
      return (contextConfig as any).logFailures ?? true
    case 'errors':
      return (contextConfig as any).logErrors ?? true
    case 'warnings':
      return (contextConfig as any).logWarnings ?? true
    default:
      return true
  }
}

export default getGlobalLoggingConfig