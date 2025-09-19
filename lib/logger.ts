// Alias para compatibilidade com imports existentes
export { appLogger, logger, createRequestLogger } from './logging'
export { appLogger as frontendLogger } from './logging'
export type { LogLevel, LogContext } from './logging'

// Export default para compatibilidade
export { appLogger as default } from './logging'