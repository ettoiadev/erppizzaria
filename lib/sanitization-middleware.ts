// Middleware de sanitização avançada para proteção contra ataques
import { NextRequest, NextResponse } from 'next/server'
import { frontendLogger } from './frontend-logger'

// Tipos de sanitização disponíveis
export enum SanitizationType {
  HTML = 'html',
  SQL = 'sql',
  XSS = 'xss',
  PATH_TRAVERSAL = 'path_traversal',
  COMMAND_INJECTION = 'command_injection',
  SCRIPT_INJECTION = 'script_injection',
  EMAIL = 'email',
  PHONE = 'phone',
  CPF = 'cpf',
  CNPJ = 'cnpj'
}

// Interface para configuração de sanitização
interface SanitizationConfig {
  fields?: Record<string, SanitizationType[]> // Campos específicos e seus tipos de sanitização
  globalTypes?: SanitizationType[] // Tipos aplicados a todos os campos
  strictMode?: boolean // Modo estrito (rejeita em vez de sanitizar)
  logSuspiciousActivity?: boolean // Log de atividades suspeitas
  allowedTags?: string[] // Tags HTML permitidas (para sanitização HTML)
  maxLength?: Record<string, number> // Comprimento máximo por campo
}

// Padrões maliciosos conhecidos
const MALICIOUS_PATTERNS = {
  [SanitizationType.SQL]: [
    /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
    /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i,
    /(script|javascript|vbscript|onload|onerror|onclick)/i
  ],
  
  [SanitizationType.XSS]: [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>.*?<\/embed>/gi
  ],
  
  [SanitizationType.PATH_TRAVERSAL]: [
    /\.\.\/|\.\.\\/g,
    /\.\.%2f|\.\.%5c/gi,
    /%2e%2e%2f|%2e%2e%5c/gi
  ],
  
  [SanitizationType.COMMAND_INJECTION]: [
    /[;&|`$(){}\[\]]/,
    /(rm|del|format|shutdown|reboot|kill)/i,
    /(cat|type|more|less|head|tail)/i
  ],
  
  [SanitizationType.SCRIPT_INJECTION]: [
    /<script/gi,
    /javascript:/gi,
    /data:text\/html/gi,
    /vbscript:/gi
  ]
}

// Tags HTML permitidas por padrão
const DEFAULT_ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li']

/**
 * Detecta padrões maliciosos em uma string
 * @param value Valor a ser verificado
 * @param type Tipo de sanitização
 * @returns true se padrão malicioso for encontrado
 */
function detectMaliciousPattern(value: string, type: SanitizationType): boolean {
  const patterns = MALICIOUS_PATTERNS[type]
  if (!patterns) return false
  
  return patterns.some(pattern => pattern.test(value))
}

/**
 * Sanitiza uma string baseada no tipo especificado
 * @param value Valor a ser sanitizado
 * @param type Tipo de sanitização
 * @param options Opções adicionais
 * @returns Valor sanitizado
 */
function sanitizeValue(
  value: string,
  type: SanitizationType,
  options: { allowedTags?: string[]; strictMode?: boolean } = {}
): string {
  const { allowedTags = DEFAULT_ALLOWED_TAGS, strictMode = false } = options
  
  switch (type) {
    case SanitizationType.HTML:
      // Remover tags não permitidas
      const allowedTagsRegex = new RegExp(`<(?!\/?(?:${allowedTags.join('|')})\b)[^>]+>`, 'gi')
      return value.replace(allowedTagsRegex, '')
    
    case SanitizationType.SQL:
      // Escapar caracteres perigosos para SQL
      return value
        .replace(/'/g, "''")
        .replace(/"/g, '""')
        .replace(/;/g, '')
        .replace(/--/g, '')
        .replace(/\/\*/g, '')
        .replace(/\*\//g, '')
    
    case SanitizationType.XSS:
      // Escapar caracteres HTML
      return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
    
    case SanitizationType.PATH_TRAVERSAL:
      // Remover tentativas de path traversal
      return value
        .replace(/\.\.\/|\.\.\\/g, '')
        .replace(/\.\.%2f|\.\.%5c/gi, '')
        .replace(/%2e%2e%2f|%2e%2e%5c/gi, '')
    
    case SanitizationType.COMMAND_INJECTION:
      // Remover caracteres perigosos para comandos
      return value.replace(/[;&|`$(){}\[\]]/g, '')
    
    case SanitizationType.SCRIPT_INJECTION:
      // Remover scripts e javascript
      return value
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/data:text\/html/gi, '')
        .replace(/vbscript:/gi, '')
    
    case SanitizationType.EMAIL:
      // Validar e limpar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value) ? value.toLowerCase().trim() : ''
    
    case SanitizationType.PHONE:
      // Limpar telefone (manter apenas números)
      return value.replace(/\D/g, '')
    
    case SanitizationType.CPF:
      // Limpar CPF (manter apenas números)
      const cpfClean = value.replace(/\D/g, '')
      return cpfClean.length === 11 ? cpfClean : ''
    
    case SanitizationType.CNPJ:
      // Limpar CNPJ (manter apenas números)
      const cnpjClean = value.replace(/\D/g, '')
      return cnpjClean.length === 14 ? cnpjClean : ''
    
    default:
      return value
  }
}

/**
 * Sanitiza um objeto recursivamente
 * @param obj Objeto a ser sanitizado
 * @param config Configuração de sanitização
 * @returns Objeto sanitizado e lista de campos suspeitos
 */
function sanitizeObject(
  obj: any,
  config: SanitizationConfig,
  path: string = ''
): { sanitized: any; suspicious: string[] } {
  const suspicious: string[] = []
  
  if (typeof obj !== 'object' || obj === null) {
    return { sanitized: obj, suspicious }
  }
  
  if (Array.isArray(obj)) {
    const sanitizedArray = obj.map((item, index) => {
      const result = sanitizeObject(item, config, `${path}[${index}]`)
      suspicious.push(...result.suspicious)
      return result.sanitized
    })
    return { sanitized: sanitizedArray, suspicious }
  }
  
  const sanitized: any = {}
  
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key
    
    if (typeof value === 'string') {
      // Verificar comprimento máximo
      if (config.maxLength?.[key] && value.length > config.maxLength[key]) {
        suspicious.push(`${currentPath}: Comprimento excedido (${value.length}/${config.maxLength[key]})`)
        if (config.strictMode) {
          throw new Error(`Campo ${key} excede o comprimento máximo permitido`)
        }
        sanitized[key] = value.substring(0, config.maxLength[key])
        continue
      }
      
      // Aplicar sanitização específica do campo
      const fieldTypes = config.fields?.[key] || []
      const allTypes = [...fieldTypes, ...(config.globalTypes || [])]
      
      let sanitizedValue = value
      
      for (const type of allTypes) {
        // Detectar padrões maliciosos
        if (detectMaliciousPattern(sanitizedValue, type)) {
          suspicious.push(`${currentPath}: Padrão suspeito detectado (${type})`)
          
          if (config.strictMode) {
            throw new Error(`Conteúdo suspeito detectado no campo ${key}`)
          }
        }
        
        // Aplicar sanitização
        sanitizedValue = sanitizeValue(sanitizedValue, type, {
          allowedTags: config.allowedTags,
          strictMode: config.strictMode
        })
      }
      
      sanitized[key] = sanitizedValue
      
    } else if (typeof value === 'object') {
      const result = sanitizeObject(value, config, currentPath)
      sanitized[key] = result.sanitized
      suspicious.push(...result.suspicious)
    } else {
      sanitized[key] = value
    }
  }
  
  return { sanitized, suspicious }
}

/**
 * Middleware de sanitização para APIs
 * @param config Configuração de sanitização
 * @param handler Handler da API
 */
export function withSanitization<T extends any[]>(
  config: SanitizationConfig,
  handler: (...args: T) => Promise<NextResponse>
) {
  const {
    logSuspiciousActivity = true,
    strictMode = false
  } = config
  
  return async (...args: T): Promise<NextResponse> => {
    const req = args[0] as NextRequest
    
    try {
      // Sanitizar apenas se não for GET
      if (req.method !== 'GET') {
        // Obter dados do request
        let requestData: any
        try {
          requestData = await req.json()
        } catch (error) {
          // Se não conseguir parsear JSON, continuar sem sanitização
          return handler(...args)
        }
        
        // Aplicar sanitização
        const { sanitized, suspicious } = sanitizeObject(requestData, config)
        
        // Log de atividades suspeitas
        if (suspicious.length > 0 && logSuspiciousActivity) {
          frontendLogger.warn('Atividade suspeita detectada', 'sanitization', {
            url: req.url,
            method: req.method,
            userAgent: req.headers.get('user-agent'),
            ip: req.headers.get('x-forwarded-for') || req.ip,
            suspicious,
            strictMode
          })
        }
        
        // Criar novo request com dados sanitizados
        const sanitizedRequest = new NextRequest(req.url, {
          method: req.method,
          headers: req.headers,
          body: JSON.stringify(sanitized)
        })
        
        // Substituir o request original
        const newArgs = [...args] as T
        newArgs[0] = sanitizedRequest as any
        
        return handler(...newArgs)
      }
      
      return handler(...args)
      
    } catch (error) {
      if (strictMode && error instanceof Error && error.message.includes('suspeito')) {
        // Em modo estrito, retornar erro 400 para conteúdo suspeito
        return NextResponse.json({
          error: 'Conteúdo não permitido detectado',
          details: error.message
        }, { status: 400 })
      }
      
      // Log do erro de sanitização
      if (logSuspiciousActivity) {
        frontendLogger.logError('Erro na sanitização', {
          url: req.url,
          method: req.method
        }, error as Error, 'sanitization')
      }
      
      throw error
    }
  }
}

/**
 * Configurações pré-definidas para diferentes tipos de endpoint
 */
export const SANITIZATION_PRESETS = {
  // Formulários de usuário (registro, perfil)
  userForm: {
    fields: {
      email: [SanitizationType.EMAIL, SanitizationType.XSS],
      nome: [SanitizationType.HTML, SanitizationType.XSS],
      telefone: [SanitizationType.PHONE],
      cpf: [SanitizationType.CPF],
      cnpj: [SanitizationType.CNPJ]
    },
    globalTypes: [SanitizationType.SQL, SanitizationType.SCRIPT_INJECTION],
    maxLength: {
      nome: 100,
      email: 255,
      telefone: 15
    },
    strictMode: false,
    logSuspiciousActivity: true
  },
  
  // Conteúdo administrativo
  adminContent: {
    globalTypes: [
      SanitizationType.SQL,
      SanitizationType.XSS,
      SanitizationType.COMMAND_INJECTION,
      SanitizationType.PATH_TRAVERSAL
    ],
    strictMode: true,
    logSuspiciousActivity: true,
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br']
  },
  
  // APIs de busca
  search: {
    globalTypes: [SanitizationType.SQL, SanitizationType.XSS],
    maxLength: {
      query: 200,
      filter: 100
    },
    strictMode: false,
    logSuspiciousActivity: true
  },
  
  // Upload de arquivos
  fileUpload: {
    fields: {
      filename: [SanitizationType.PATH_TRAVERSAL, SanitizationType.COMMAND_INJECTION],
      description: [SanitizationType.HTML, SanitizationType.XSS]
    },
    strictMode: true,
    logSuspiciousActivity: true
  }
} as const

/**
 * Middleware com configuração pré-definida
 * @param preset Tipo de preset
 * @param customConfig Configurações adicionais
 * @param handler Handler da API
 */
export function withPresetSanitization<T extends any[]>(
  preset: keyof typeof SANITIZATION_PRESETS,
  customConfig: Partial<SanitizationConfig> = {},
  handler: (...args: T) => Promise<NextResponse>
) {
  const baseConfig = SANITIZATION_PRESETS[preset]
  const finalConfig = {
    ...baseConfig,
    ...customConfig,
    fields: { ...baseConfig.fields, ...customConfig.fields },
    maxLength: { ...baseConfig.maxLength, ...customConfig.maxLength }
  }
  
  return withSanitization(finalConfig, handler)
}

/**
 * Função utilitária para sanitizar dados manualmente
 * @param data Dados a serem sanitizados
 * @param config Configuração de sanitização
 * @returns Dados sanitizados e relatório de atividades suspeitas
 */
export function sanitizeData(
  data: any,
  config: SanitizationConfig
): { sanitized: any; suspicious: string[] } {
  return sanitizeObject(data, config)
}

export default {
  withSanitization,
  withPresetSanitization,
  sanitizeData,
  SanitizationType,
  SANITIZATION_PRESETS
}