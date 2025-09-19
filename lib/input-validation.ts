import { NextResponse } from 'next/server'

// Tipos para validação
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  type?: 'email' | 'phone' | 'password' | 'string' | 'number'
  custom?: (value: any) => string | null
}

export interface ValidationSchema {
  [key: string]: ValidationRule
}

// Função para sanitizar strings
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove caracteres HTML básicos
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 1000) // Limita tamanho máximo
}

// Função para sanitizar email
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return ''
  
  return email
    .trim()
    .toLowerCase()
    .substring(0, 254) // RFC 5321 limit
}

// Função para sanitizar telefone
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') return ''
  
  return phone.replace(/\D/g, '') // Remove tudo que não é dígito
}

// Função para validar um campo individual
export function validateField(value: any, rule: ValidationRule, fieldName: string): string | null {
  // Verificar se é obrigatório
  if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
    return `${fieldName} é obrigatório`
  }

  // Se não é obrigatório e está vazio, passa na validação
  if (!rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
    return null
  }

  // Validações de tipo
  if (rule.type) {
    switch (rule.type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          return `${fieldName} deve ser um email válido`
        }
        break
      
      case 'phone':
        const phoneDigits = value.replace(/\D/g, '')
        if (phoneDigits.length < 10 || phoneDigits.length > 11) {
          return `${fieldName} deve ter 10 ou 11 dígitos`
        }
        break
      
      case 'password':
        if (typeof value !== 'string' || value.length < 6) {
          return `${fieldName} deve ter pelo menos 6 caracteres`
        }
        break
      
      case 'number':
        if (isNaN(Number(value))) {
          return `${fieldName} deve ser um número válido`
        }
        break
    }
  }

  // Validações de tamanho
  if (rule.minLength && value.length < rule.minLength) {
    return `${fieldName} deve ter pelo menos ${rule.minLength} caracteres`
  }

  if (rule.maxLength && value.length > rule.maxLength) {
    return `${fieldName} deve ter no máximo ${rule.maxLength} caracteres`
  }

  // Validação de padrão
  if (rule.pattern && !rule.pattern.test(value)) {
    return `${fieldName} tem formato inválido`
  }

  // Validação customizada
  if (rule.custom) {
    const customError = rule.custom(value)
    if (customError) {
      return customError
    }
  }

  return null
}

// Função principal de validação
export function validateInput(data: any, schema: ValidationSchema): { isValid: boolean; errors: string[]; sanitizedData: any } {
  const errors: string[] = []
  const sanitizedData: any = {}

  for (const [fieldName, rule] of Object.entries(schema)) {
    const value = data[fieldName]
    
    // Sanitizar o valor baseado no tipo
    let sanitizedValue = value
    if (rule.type === 'email' && value) {
      sanitizedValue = sanitizeEmail(value)
    } else if (rule.type === 'phone' && value) {
      sanitizedValue = sanitizePhone(value)
    } else if (typeof value === 'string') {
      sanitizedValue = sanitizeString(value)
    }

    // Validar o campo
    const error = validateField(sanitizedValue, rule, fieldName)
    if (error) {
      errors.push(error)
    }

    // Adicionar ao objeto sanitizado
    sanitizedData[fieldName] = sanitizedValue
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  }
}

// Função helper para criar resposta de erro de validação
export function createValidationErrorResponse(errors: string[]): NextResponse {
  return NextResponse.json(
    { 
      error: 'Dados inválidos', 
      details: errors 
    }, 
    { status: 400 }
  )
}

// Schemas de validação predefinidos
export const authValidationSchema: ValidationSchema = {
  email: {
    required: true,
    type: 'email',
    maxLength: 254
  },
  password: {
    required: true,
    type: 'password',
    minLength: 6,
    maxLength: 128
  },
  full_name: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100
  },
  phone: {
    required: false,
    type: 'phone'
  }
}

export const orderValidationSchema: ValidationSchema = {
  customer_name: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100
  },
  customer_phone: {
    required: true,
    type: 'phone'
  },
  delivery_address: {
    required: false,
    type: 'string',
    maxLength: 500
  },
  items: {
    required: true,
    custom: (value) => {
      if (!Array.isArray(value) || value.length === 0) {
        return 'Pelo menos um item deve ser selecionado'
      }
      return null
    }
  }
}