// Debug utilities for conditional logging in production
const isProduction = process.env.NODE_ENV === 'production'

export const logger = {
  log: (...args: any[]) => {
    if (!isProduction) {
      console.log(...args)
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors, but in production only show generic messages
    if (isProduction) {
      console.error('An error occurred:', args[0]?.message || 'Unknown error')
    } else {
      console.error(...args)
    }
  },
  
  warn: (...args: any[]) => {
    if (!isProduction) {
      console.warn(...args)
    }
  },
  
  info: (...args: any[]) => {
    if (!isProduction) {
      console.info(...args)
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
  logger.error(`Error in ${context}:`, error)
  
  // In production, return user-friendly messages
  if (isProduction) {
    return {
      message: 'Ocorreu um erro. Tente novamente.',
      code: 'GENERIC_ERROR'
    }
  }
  
  return {
    message: error.message || 'Unknown error',
    code: error.code || 'UNKNOWN',
    stack: error.stack
  }
}
