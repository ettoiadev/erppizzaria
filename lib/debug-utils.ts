// Debug utilities for conditional logging in production
import { appLogger } from './logging'
import { frontendLogger } from './frontend-logger'

const isProduction = process.env.NODE_ENV === 'production'

export const logger = {
  log: (...args: any[]) => {
    const message = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ')
    appLogger.debug('general', message, { args })
    if (typeof window !== 'undefined') {
      frontendLogger.debug(message, 'ui', { args })
    }
  },
  
  error: (...args: any[]) => {
    const message = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ')
    const error = args.find(arg => arg instanceof Error) || new Error(message)
    
    appLogger.error('general', message, undefined, { args })
    if (typeof window !== 'undefined') {
      frontendLogger.logError(message, { args }, error, 'ui')
    }
  },
  
  warn: (...args: any[]) => {
    const message = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ')
    appLogger.warn('general', message, { args })
    if (typeof window !== 'undefined') {
      frontendLogger.warn(message, 'ui', { args })
    }
  },
  
  info: (...args: any[]) => {
    const message = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ')
    appLogger.info('general', message, { args })
    if (typeof window !== 'undefined') {
      frontendLogger.info(message, 'ui', { args })
    }
  }
}

// Safe localStorage access with error handling
export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return typeof window !== 'undefined' ? localStorage.getItem(key) : null
    } catch (error) {
      logger.error('Error accessing localStorage:', error)
      return null
    }
  },
  
  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value)
        return true
      }
      return false
    } catch (error) {
      logger.error('Error setting localStorage:', error)
      return false
    }
  },
  
  removeItem: (key: string): boolean => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key)
        return true
      }
      return false
    } catch (error) {
      logger.error('Error removing from localStorage:', error)
      return false
    }
  }
}

// Error boundary helper
export const handleAsyncError = (error: any, context: string) => {
  const errorMessage = `Error in ${context}`
  const actualError = error instanceof Error ? error : new Error(String(error))
  
  appLogger.error('general', errorMessage, actualError, { context })
  if (typeof window !== 'undefined') {
    frontendLogger.logError(errorMessage, { context }, actualError, 'ui')
  }
  
  // In production, return user-friendly messages
  if (isProduction) {
    return {
      message: 'Ocorreu um erro. Tente novamente.',
      code: 'GENERIC_ERROR'
    }
  }
  
  return {
    message: actualError.message || 'Unknown error',
    code: (actualError as any).code || 'UNKNOWN',
    stack: actualError.stack
  }
}
