import { NextRequest, NextResponse } from 'next/server'
import { sanitizeRequestData } from './validation-utils'

// Configurações de sanitização por preset
const SANITIZATION_PRESETS = {
  userForm: {
    sanitizeHtml: true,
    trimStrings: true,
    removeScripts: true,
    maxStringLength: 1000
  },
  adminForm: {
    sanitizeHtml: true,
    trimStrings: true,
    removeScripts: true,
    maxStringLength: 5000
  },
  search: {
    sanitizeHtml: true,
    trimStrings: true,
    removeScripts: true,
    maxStringLength: 200
  },
  basic: {
    sanitizeHtml: false,
    trimStrings: true,
    removeScripts: false,
    maxStringLength: 500
  }
}

type SanitizationPreset = keyof typeof SANITIZATION_PRESETS

// Função para sanitizar dados baseado no preset
function sanitizeWithPreset(data: any, preset: SanitizationPreset): any {
  const config = SANITIZATION_PRESETS[preset]
  
  if (typeof data === 'string') {
    let sanitized = data
    
    if (config.trimStrings) {
      sanitized = sanitized.trim()
    }
    
    if (config.maxStringLength && sanitized.length > config.maxStringLength) {
      sanitized = sanitized.substring(0, config.maxStringLength)
    }
    
    if (config.removeScripts) {
      sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '')
    }
    
    if (config.sanitizeHtml) {
      // Sanitização básica de HTML
      sanitized = sanitized
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
    }
    
    return sanitized
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeWithPreset(item, preset))
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeWithPreset(value, preset)
    }
    return sanitized
  }
  
  return data
}

// Higher-order function para sanitização
export function withPresetSanitization<T extends any[]>(
  preset: SanitizationPreset,
  options: { skipSanitization?: boolean } = {},
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    if (options.skipSanitization) {
      return handler(request, ...args)
    }
    
    try {
      // Sanitizar dados do corpo da requisição
      if (request.method !== 'GET' && request.method !== 'DELETE') {
        const contentType = request.headers.get('content-type')
        
        if (contentType?.includes('application/json')) {
          const body = await request.json()
          const sanitizedBody = sanitizeWithPreset(body, preset)
          
          // Criar nova requisição com dados sanitizados
          const sanitizedRequest = new NextRequest(request.url, {
            method: request.method,
            headers: request.headers,
            body: JSON.stringify(sanitizedBody)
          })
          
          return handler(sanitizedRequest, ...args)
        }
      }
      
      return handler(request, ...args)
    } catch (error) {
      console.error('Erro na sanitização:', error)
      return handler(request, ...args)
    }
  }
}

// Função para sanitização manual
export function sanitizeData(data: any, preset: SanitizationPreset = 'basic'): any {
  return sanitizeWithPreset(data, preset)
}