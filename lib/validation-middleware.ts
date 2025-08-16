// Middleware de validação para APIs usando Zod
import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema, ZodError } from 'zod'
import { appLogger } from './logging'
import { frontendLogger } from './frontend-logger'

// Tipo para handler validado
type ValidatedHandler<T> = (
  req: NextRequest,
  data: T,
  context?: any
) => Promise<NextResponse> | NextResponse

// Tipo para configuração do middleware
interface ValidationOptions {
  logValidationErrors?: boolean
  sanitizeErrors?: boolean
  customErrorMessage?: string
}

// Configuração padrão
const defaultOptions: ValidationOptions = {
  logValidationErrors: true,
  sanitizeErrors: process.env.NODE_ENV === 'production',
  customErrorMessage: 'Dados inválidos'
}

/**
 * Middleware para validação de dados de entrada usando Zod
 * @param schema Schema Zod para validação
 * @param handler Handler que recebe os dados validados
 * @param options Opções de configuração
 */
export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: ValidatedHandler<T>,
  options: ValidationOptions = {}
) {
  const config = { ...defaultOptions, ...options }
  
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      // Extrair dados do request
      let requestData: unknown
      
      if (req.method === 'GET') {
        // Para GET, usar query parameters
        const url = new URL(req.url)
        requestData = Object.fromEntries(url.searchParams.entries())
      } else {
        // Para outros métodos, usar body JSON
        try {
          requestData = await req.json()
        } catch (error) {
          if (config.logValidationErrors) {
            frontendLogger.warn('Erro ao parsear JSON do request', 'api', {
              method: req.method,
              url: req.url,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
          
          return NextResponse.json({
            error: 'Formato de dados inválido',
            details: 'Request body deve ser um JSON válido'
          }, { status: 400 })
        }
      }
      
      // Validar dados usando o schema
      const validatedData = schema.parse(requestData)
      
      if (config.logValidationErrors) {
        frontendLogger.debug('Dados validados com sucesso', 'api', {
          method: req.method,
          url: req.url,
          dataKeys: Object.keys(requestData as object || {})
        })
      }
      
      // Chamar handler com dados validados
      return handler(req, validatedData, context)
      
    } catch (error) {
      if (error instanceof ZodError) {
        // Erro de validação
        const validationErrors = error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code
        }))
        
        if (config.logValidationErrors) {
          frontendLogger.warn('Erro de validação', 'api', {
            method: req.method,
            url: req.url,
            errors: validationErrors,
            requestData: config.sanitizeErrors ? '[SANITIZED]' : 'data'
          })
        }
        
        return NextResponse.json({
          error: config.customErrorMessage,
          details: config.sanitizeErrors 
            ? 'Verifique os dados enviados'
            : validationErrors
        }, { status: 400 })
        
      } else {
        // Erro inesperado
        if (config.logValidationErrors) {
          frontendLogger.logError('Erro inesperado na validação', {
            method: req.method,
            url: req.url
          }, error as Error, 'api')
        }
        
        throw error
      }
    }
  }
}

/**
 * Middleware para validação de query parameters
 * @param schema Schema Zod para validação
 * @param handler Handler que recebe os dados validados
 * @param options Opções de configuração
 */
export function withQueryValidation<T>(
  schema: ZodSchema<T>,
  handler: ValidatedHandler<T>,
  options: ValidationOptions = {}
) {
  const config = { ...defaultOptions, ...options }
  
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      // Extrair query parameters
      const url = new URL(req.url)
      const queryData = Object.fromEntries(url.searchParams.entries())
      
      // Converter strings para tipos apropriados quando possível
      const processedData = processQueryData(queryData)
      
      // Validar dados
      const validatedData = schema.parse(processedData)
      
      if (config.logValidationErrors) {
        frontendLogger.debug('Query parameters validados', 'api', {
          method: req.method,
          url: req.url,
          queryKeys: Object.keys(queryData)
        })
      }
      
      return handler(req, validatedData, context)
      
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code
        }))
        
        if (config.logValidationErrors) {
          frontendLogger.warn('Erro de validação em query parameters', 'api', {
            method: req.method,
            url: req.url,
            errors: validationErrors
          })
        }
        
        return NextResponse.json({
          error: 'Parâmetros de consulta inválidos',
          details: config.sanitizeErrors 
            ? 'Verifique os parâmetros da URL'
            : validationErrors
        }, { status: 400 })
        
      } else {
        if (config.logValidationErrors) {
          frontendLogger.logError('Erro inesperado na validação de query', {
            method: req.method,
            url: req.url
          }, error as Error, 'api')
        }
        
        throw error
      }
    }
  }
}

/**
 * Middleware para validação de parâmetros de rota
 * @param schema Schema Zod para validação
 * @param handler Handler que recebe os dados validados
 * @param options Opções de configuração
 */
export function withParamsValidation<T>(
  schema: ZodSchema<T>,
  handler: (req: NextRequest, params: T, context?: any) => Promise<NextResponse> | NextResponse,
  options: ValidationOptions = {}
) {
  const config = { ...defaultOptions, ...options }
  
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      // Extrair parâmetros da rota do context
      const params = context?.params || {}
      
      // Validar parâmetros
      const validatedParams = schema.parse(params)
      
      if (config.logValidationErrors) {
        frontendLogger.debug('Parâmetros de rota validados', 'api', {
          method: req.method,
          url: req.url,
          paramKeys: Object.keys(params)
        })
      }
      
      return handler(req, validatedParams, context)
      
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code
        }))
        
        if (config.logValidationErrors) {
          frontendLogger.warn('Erro de validação em parâmetros de rota', 'api', {
            method: req.method,
            url: req.url,
            errors: validationErrors
          })
        }
        
        return NextResponse.json({
          error: 'Parâmetros de rota inválidos',
          details: config.sanitizeErrors 
            ? 'Verifique a URL da requisição'
            : validationErrors
        }, { status: 400 })
        
      } else {
        if (config.logValidationErrors) {
          frontendLogger.logError('Erro inesperado na validação de parâmetros', {
            method: req.method,
            url: req.url
          }, error as Error, 'api')
        }
        
        throw error
      }
    }
  }
}

/**
 * Função utilitária para processar dados de query parameters
 * Converte strings para tipos apropriados quando possível
 */
function processQueryData(queryData: Record<string, string>): Record<string, any> {
  const processed: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(queryData)) {
    // Tentar converter para número
    if (/^\d+$/.test(value)) {
      processed[key] = parseInt(value, 10)
    }
    // Tentar converter para float
    else if (/^\d+\.\d+$/.test(value)) {
      processed[key] = parseFloat(value)
    }
    // Converter para boolean
    else if (value === 'true' || value === 'false') {
      processed[key] = value === 'true'
    }
    // Manter como string
    else {
      processed[key] = value
    }
  }
  
  return processed
}

/**
 * Middleware combinado que valida body, query e params
 * @param schemas Schemas para cada tipo de validação
 * @param handler Handler que recebe todos os dados validados
 * @param options Opções de configuração
 */
export function withFullValidation<TBody, TQuery, TParams>(
  schemas: {
    body?: ZodSchema<TBody>
    query?: ZodSchema<TQuery>
    params?: ZodSchema<TParams>
  },
  handler: (
    req: NextRequest,
    data: {
      body?: TBody
      query?: TQuery
      params?: TParams
    },
    context?: any
  ) => Promise<NextResponse> | NextResponse,
  options: ValidationOptions = {}
) {
  const config = { ...defaultOptions, ...options }
  
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      const validatedData: {
        body?: TBody
        query?: TQuery
        params?: TParams
      } = {}
      
      // Validar body se schema fornecido
      if (schemas.body && req.method !== 'GET') {
        try {
          const requestData = await req.json()
          validatedData.body = schemas.body.parse(requestData)
        } catch (error) {
          if (error instanceof ZodError) {
            throw error
          }
          throw new Error('Formato de dados inválido no body')
        }
      }
      
      // Validar query se schema fornecido
      if (schemas.query) {
        const url = new URL(req.url)
        const queryData = Object.fromEntries(url.searchParams.entries())
        const processedData = processQueryData(queryData)
        validatedData.query = schemas.query.parse(processedData)
      }
      
      // Validar params se schema fornecido
      if (schemas.params) {
        const params = context?.params || {}
        validatedData.params = schemas.params.parse(params)
      }
      
      if (config.logValidationErrors) {
        frontendLogger.debug('Validação completa realizada', 'api', {
          method: req.method,
          url: req.url,
          hasBody: !!validatedData.body,
          hasQuery: !!validatedData.query,
          hasParams: !!validatedData.params
        })
      }
      
      return handler(req, validatedData, context)
      
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code
        }))
        
        if (config.logValidationErrors) {
          frontendLogger.warn('Erro na validação completa', 'api', {
            method: req.method,
            url: req.url,
            errors: validationErrors
          })
        }
        
        return NextResponse.json({
          error: config.customErrorMessage,
          details: config.sanitizeErrors 
            ? 'Verifique os dados enviados'
            : validationErrors
        }, { status: 400 })
        
      } else {
        if (config.logValidationErrors) {
          frontendLogger.logError('Erro inesperado na validação completa', {
            method: req.method,
            url: req.url
          }, error as Error, 'api')
        }
        
        throw error
      }
    }
  }
}

export default withValidation
