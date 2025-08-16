// Arquivo de índice para middlewares
export {
  withValidation,
  withQueryValidation,
  withParamsValidation,
  withFullValidation
} from './validation-middleware'

export {
  withDatabaseErrorHandling,
  withApiDatabaseErrorHandling,
  analyzeDatabaseError,
  generateUserFriendlyMessage,
  DatabaseErrorType
} from './database-error-handler'

export {
  withRateLimit,
  withPresetRateLimit,
  withUserRateLimit,
  withAdaptiveRateLimit,
  checkRateLimit,
  RATE_LIMIT_CONFIGS
} from './rate-limit-middleware'

export type { RateLimitConfig } from './rate-limit-middleware'

export {
  withSanitization,
  withPresetSanitization,
  sanitizeData,
  SanitizationType,
  SANITIZATION_PRESETS
} from './sanitization-middleware'

export {
  withErrorMonitoring,
  ErrorMonitoring,
  errorMonitoring,
  ErrorMetricType
} from './error-monitoring'

export {
  withApiLogging,
  withErrorHandling,
  withSensitiveLogging,
  withDebugLogging,
  createApiLogger
} from './api-logger-middleware'

export {
  withAuth,
  withAdminAuth,
  withManagerAuth,
  withKitchenAuth,
  withDeliveryAuth,
  getUserFromToken,
  getUserFromRequest,
  hasPermission,
  createAuthResponse,
  clearAuthResponse
} from './auth-middleware'

// Middlewares pré-configurados para uso comum
import { withRateLimit, RATE_LIMIT_CONFIGS } from './rate-limit-middleware'
import { withSanitization, SANITIZATION_PRESETS } from './sanitization-middleware'

export const withPresetRateLimit = (handler: any) => 
  withRateLimit(RATE_LIMIT_CONFIGS.public, handler)

export const withPresetSanitization = (handler: any) => 
  withSanitization(SANITIZATION_PRESETS.userForm, handler)