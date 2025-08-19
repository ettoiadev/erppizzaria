import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema, ZodError } from 'zod'
import DOMPurify from 'isomorphic-dompurify'
import { validateAuthToken, validateAdminAuth } from './auth-utils'

interface ValidationResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Valida dados usando schema Zod
 */
export async function validateRequestData<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json()
    const validatedData = schema.parse(body)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessage = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ')
      return { success: false, error: errorMessage }
    }
    return { success: false, error: 'Dados inválidos' }
  }
}

/**
 * Valida query parameters usando schema Zod
 */
export function validateQueryParams<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): ValidationResult<T> {
  try {
    const { searchParams } = new URL(request.url)
    const queryObject = Object.fromEntries(searchParams.entries())
    const validatedData = schema.parse(queryObject)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessage = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ')
      return { success: false, error: errorMessage }
    }
    return { success: false, error: 'Parâmetros inválidos' }
  }
}

/**
 * Padrões maliciosos para detecção
 */
const MALICIOUS_PATTERNS = {
  sql: [
    /(union\s+select|insert\s+into|delete\s+from|update\s+set|drop\s+table|create\s+table|alter\s+table|exec\s+|execute\s+)/i,
    /(script|javascript|vbscript|onload|onerror|onclick)/i
  ],
  xss: [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi
  ],
  pathTraversal: [
    /\.\.\/|\.\.\\/gi,
    /%2e%2e%2f|%2e%2e%5c/gi,
    /\.\.%2f|\.\.%5c/gi
  ],
  commandInjection: [
    /[;&|`]\s*[;&|`]/,
    /(cat|ls|pwd|whoami|id|uname|ps|netstat|ifconfig)\s+/i
  ]
}

/**
 * Detecta padrões maliciosos em string
 */
function detectMaliciousPattern(value: string): boolean {
  const allPatterns = Object.values(MALICIOUS_PATTERNS).flat()
  return allPatterns.some(pattern => pattern.test(value))
}

/**
 * Sanitiza uma string removendo conteúdo malicioso
 */
function sanitizeString(value: string): string {
  // Remove scripts e tags perigosas
  let sanitized = DOMPurify.sanitize(value, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  })
  
  // Remove caracteres de controle
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '')
  
  // Escape caracteres SQL perigosos
  sanitized = sanitized.replace(/'/g, "''")
  
  return sanitized.trim()
}

/**
 * Sanitiza objeto recursivamente
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject)
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value)
    }
    return sanitized
  }
  
  return obj
}

/**
 * Sanitiza dados da requisição
 */
export async function sanitizeRequestData(request: NextRequest): Promise<any> {
  try {
    const body = await request.json()
    return sanitizeObject(body)
  } catch {
    return {}
  }
}

/**
 * Valida e sanitiza dados da requisição
 */
export async function validateAndSanitizeData<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    // Primeiro sanitiza os dados
    const sanitizedData = await sanitizeRequestData(request)
    
    // Depois valida com o schema
    const validatedData = schema.parse(sanitizedData)
    
    // Verifica padrões maliciosos
    const jsonString = JSON.stringify(validatedData)
    if (detectMaliciousPattern(jsonString)) {
      return { success: false, error: 'Dados contêm conteúdo suspeito' }
    }
    
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessage = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ')
      return { success: false, error: errorMessage }
    }
    return { success: false, error: 'Dados inválidos' }
  }
}

/**
 * Valida e sanitiza dados diretamente (sem ler request)
 */
export async function validateAndSanitizeDataDirect<T>(
  data: any,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    // Primeiro sanitiza os dados
    const sanitizedData = sanitizeObject(data)
    
    // Depois valida com o schema
    const validatedData = schema.parse(sanitizedData)
    
    // Verifica padrões maliciosos
    const jsonString = JSON.stringify(validatedData)
    if (detectMaliciousPattern(jsonString)) {
      return { success: false, error: 'Dados contêm conteúdo suspeito' }
    }
    
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessage = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ')
      return { success: false, error: errorMessage }
    }
    return { success: false, error: 'Dados inválidos' }
  }
}

/**
 * Cria resposta de erro de validação
 */
export function createValidationErrorResponse(error: string): NextResponse {
  return NextResponse.json(
    { error: 'Dados inválidos', details: error },
    { status: 400 }
  )
}

/**
 * Higher-order function para validação de dados com Zod
 */
export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: (request: NextRequest, validatedData: T) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const validationResult = await validateAndSanitizeData(request, schema)
    
    if (!validationResult.success) {
      return createValidationErrorResponse(validationResult.error || 'Dados inválidos')
    }
    
    return await handler(request, validationResult.data!)
   }
 }

/**
 * Higher-order function para autenticação básica
 */
export function withAuth(
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await validateAuthToken(request)
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Acesso negado' },
        { status: 401 }
      )
    }
    
    return await handler(request, authResult.user)
  }
}

/**
 * Higher-order function para autenticação de administrador
 */
export function withAdminAuth(
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await validateAdminAuth(request)
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Acesso negado' },
        { status: 401 }
      )
    }
    
    return await handler(request, authResult.user)
  }
}