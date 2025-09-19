import { z } from 'zod'
import { frontendLogger } from './frontend-logger'
import { logSuspiciousActivity } from './security-utils'
import { NextRequest } from 'next/server'

// Configurações de validação
const VALIDATION_CONFIG = {
  maxStringLength: 1000,
  maxNumberValue: 999999999,
  maxArrayLength: 100,
  maxObjectDepth: 5,
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  maxFileSize: 5 * 1024 * 1024, // 5MB
  suspiciousPatterns: [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>.*?<\/embed>/gi
  ]
}

// Interface para resultado de validação
interface ValidationResult<T = any> {
  success: boolean
  data?: T
  errors?: string[]
  warnings?: string[]
  sanitized?: boolean
}

/**
 * Detecta padrões suspeitos em strings
 */
function detectSuspiciousPatterns(input: string): string[] {
  const detected: string[] = []
  
  for (const pattern of VALIDATION_CONFIG.suspiciousPatterns) {
    if (pattern.test(input)) {
      detected.push(pattern.source)
    }
  }
  
  return detected
}

/**
 * Sanitiza string removendo conteúdo perigoso
 */
function sanitizeString(input: string): { value: string; sanitized: boolean } {
  let sanitized = false
  let value = input
  
  // Remover scripts e conteúdo perigoso
  for (const pattern of VALIDATION_CONFIG.suspiciousPatterns) {
    const original = value
    value = value.replace(pattern, '')
    if (value !== original) {
      sanitized = true
    }
  }
  
  // Escapar caracteres HTML básicos
  const htmlEscaped = value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
  
  if (htmlEscaped !== value) {
    sanitized = true
    value = htmlEscaped
  }
  
  // Limitar tamanho
  if (value.length > VALIDATION_CONFIG.maxStringLength) {
    value = value.substring(0, VALIDATION_CONFIG.maxStringLength)
    sanitized = true
  }
  
  return { value: value.trim(), sanitized }
}

/**
 * Valida e sanitiza objeto recursivamente
 */
function validateAndSanitizeObject(
  obj: any, 
  depth: number = 0,
  request?: NextRequest
): { value: any; sanitized: boolean; warnings: string[] } {
  const warnings: string[] = []
  let sanitized = false
  
  if (depth > VALIDATION_CONFIG.maxObjectDepth) {
    warnings.push(`Objeto muito profundo (máximo ${VALIDATION_CONFIG.maxObjectDepth} níveis)`)
    return { value: null, sanitized: true, warnings }
  }
  
  if (obj === null || obj === undefined) {
    return { value: obj, sanitized: false, warnings }
  }
  
  if (typeof obj === 'string') {
    const suspicious = detectSuspiciousPatterns(obj)
    if (suspicious.length > 0 && request) {
      logSuspiciousActivity(request, 'Suspicious patterns detected in input', {
        patterns: suspicious,
        inputLength: obj.length
      })
      warnings.push(`Padrões suspeitos detectados: ${suspicious.join(', ')}`)
    }
    
    const result = sanitizeString(obj)
    return { value: result.value, sanitized: result.sanitized, warnings }
  }
  
  if (typeof obj === 'number') {
    if (obj > VALIDATION_CONFIG.maxNumberValue) {
      warnings.push(`Número muito grande (máximo ${VALIDATION_CONFIG.maxNumberValue})`)
      return { value: VALIDATION_CONFIG.maxNumberValue, sanitized: true, warnings }
    }
    return { value: obj, sanitized: false, warnings }
  }
  
  if (typeof obj === 'boolean') {
    return { value: obj, sanitized: false, warnings }
  }
  
  if (Array.isArray(obj)) {
    if (obj.length > VALIDATION_CONFIG.maxArrayLength) {
      warnings.push(`Array muito grande (máximo ${VALIDATION_CONFIG.maxArrayLength} itens)`)
      obj = obj.slice(0, VALIDATION_CONFIG.maxArrayLength)
      sanitized = true
    }
    
    const sanitizedArray = obj.map((item: any) => {
      const result = validateAndSanitizeObject(item, depth + 1, request)
      if (result.sanitized) sanitized = true
      warnings.push(...result.warnings)
      return result.value
    })
    
    return { value: sanitizedArray, sanitized, warnings }
  }
  
  if (typeof obj === 'object') {
    const sanitizedObj: any = {}
    
    for (const [key, value] of Object.entries(obj)) {
      // Sanitizar chave
      const keyResult = sanitizeString(key)
      if (keyResult.sanitized) {
        sanitized = true
        warnings.push(`Chave sanitizada: ${key} -> ${keyResult.value}`)
      }
      
      // Sanitizar valor
      const valueResult = validateAndSanitizeObject(value, depth + 1, request)
      if (valueResult.sanitized) sanitized = true
      warnings.push(...valueResult.warnings)
      
      sanitizedObj[keyResult.value] = valueResult.value
    }
    
    return { value: sanitizedObj, sanitized, warnings }
  }
  
  // Tipo não suportado
  warnings.push(`Tipo não suportado: ${typeof obj}`)
  return { value: null, sanitized: true, warnings }
}

/**
 * Valida entrada usando schema Zod com sanitização
 */
export function validateAndSanitizeWithSchema<T>(
  data: any,
  schema: z.ZodSchema<T>,
  request?: NextRequest
): ValidationResult<T> {
  try {
    // Primeiro, sanitizar dados
    const sanitizationResult = validateAndSanitizeObject(data, 0, request)
    
    // Depois, validar com schema
    const validationResult = schema.safeParse(sanitizationResult.value)
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      )
      
      if (request) {
        frontendLogger.warn('Validação de schema falhou', 'api', {
          errors,
          warnings: sanitizationResult.warnings,
          sanitized: sanitizationResult.sanitized
        })
      }
      
      return {
        success: false,
        errors,
        warnings: sanitizationResult.warnings,
        sanitized: sanitizationResult.sanitized
      }
    }
    
    return {
      success: true,
      data: validationResult.data,
      warnings: sanitizationResult.warnings,
      sanitized: sanitizationResult.sanitized
    }
    
  } catch (error) {
    if (request) {
      frontendLogger.logError('Erro na validação de entrada', {
        error: error instanceof Error ? error.message : String(error)
      }, error instanceof Error ? error : new Error(String(error)), 'api')
    }
    
    return {
      success: false,
      errors: ['Erro interno na validação']
    }
  }
}

/**
 * Valida arquivo upload
 */
export function validateFileUpload(
  file: File,
  request?: NextRequest
): ValidationResult<File> {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Validar tipo de arquivo
  if (!VALIDATION_CONFIG.allowedFileTypes.includes(file.type)) {
    errors.push(`Tipo de arquivo não permitido: ${file.type}`)
    
    if (request) {
      logSuspiciousActivity(request, 'Invalid file type upload attempt', {
        fileType: file.type,
        fileName: file.name,
        fileSize: file.size
      })
    }
  }
  
  // Validar tamanho
  if (file.size > VALIDATION_CONFIG.maxFileSize) {
    errors.push(`Arquivo muito grande: ${file.size} bytes (máximo ${VALIDATION_CONFIG.maxFileSize})`)
  }
  
  // Validar nome do arquivo
  const nameResult = sanitizeString(file.name)
  if (nameResult.sanitized) {
    warnings.push(`Nome do arquivo sanitizado: ${file.name} -> ${nameResult.value}`)
  }
  
  if (errors.length > 0) {
    return { success: false, errors, warnings }
  }
  
  return { success: true, data: file, warnings }
}

/**
 * Valida parâmetros de URL
 */
export function validateUrlParams(
  params: Record<string, string>,
  request?: NextRequest
): ValidationResult<Record<string, string>> {
  const sanitizationResult = validateAndSanitizeObject(params, 0, request)
  
  return {
    success: true,
    data: sanitizationResult.value,
    warnings: sanitizationResult.warnings,
    sanitized: sanitizationResult.sanitized
  }
}

/**
 * Valida headers de requisição
 */
export function validateRequestHeaders(
  headers: Headers,
  request?: NextRequest
): ValidationResult<Record<string, string>> {
  const headerObj: Record<string, string> = {}
  const warnings: string[] = []
  
  // Converter headers para objeto
  headers.forEach((value, key) => {
    headerObj[key.toLowerCase()] = value
  })
  
  // Verificar headers suspeitos
  const suspiciousHeaders = ['x-forwarded-host', 'x-original-url', 'x-rewrite-url']
  for (const header of suspiciousHeaders) {
    if (headerObj[header]) {
      warnings.push(`Header suspeito detectado: ${header}`)
      if (request) {
        logSuspiciousActivity(request, 'Suspicious header detected', {
          header,
          value: headerObj[header]
        })
      }
    }
  }
  
  return {
    success: true,
    data: headerObj,
    warnings
  }
}

/**
 * Middleware de validação de entrada completa
 */
export function enhancedInputValidation<T>(
  data: any,
  schema: z.ZodSchema<T>,
  request?: NextRequest
): ValidationResult<T> {
  // Log da tentativa de validação
  if (request) {
    frontendLogger.info('Iniciando validação de entrada', 'api', {
      dataType: typeof data,
      hasSchema: !!schema,
      ip: request.ip || 'unknown'
    })
  }
  
  // Validar headers
  if (request) {
    const headerValidation = validateRequestHeaders(request.headers, request)
    if (headerValidation.warnings && headerValidation.warnings.length > 0) {
      frontendLogger.warn('Headers suspeitos detectados', 'api', {
        warnings: headerValidation.warnings
      })
    }
  }
  
  // Validar e sanitizar dados
  return validateAndSanitizeWithSchema(data, schema, request)
}