// Tratamento avançado de erros de banco de dados
import { NextResponse } from 'next/server'
import { frontendLogger } from './frontend-logger'
import { createAppError } from './error-handler'

// Tipos de erro de banco de dados
export enum DatabaseErrorType {
  UNIQUE_VIOLATION = 'unique_violation',
  FOREIGN_KEY_VIOLATION = 'foreign_key_violation',
  NOT_NULL_VIOLATION = 'not_null_violation',
  CHECK_VIOLATION = 'check_violation',
  CONNECTION_ERROR = 'connection_error',
  TIMEOUT_ERROR = 'timeout_error',
  PERMISSION_DENIED = 'permission_denied',
  UNKNOWN_ERROR = 'unknown_error'
}

// Interface para erro de banco estruturado
export interface DatabaseError {
  type: DatabaseErrorType
  message: string
  field?: string
  table?: string
  constraint?: string
  originalError: any
}

// Mapeamento de códigos de erro PostgreSQL
const POSTGRES_ERROR_CODES: Record<string, DatabaseErrorType> = {
  '23505': DatabaseErrorType.UNIQUE_VIOLATION,
  '23503': DatabaseErrorType.FOREIGN_KEY_VIOLATION,
  '23502': DatabaseErrorType.NOT_NULL_VIOLATION,
  '23514': DatabaseErrorType.CHECK_VIOLATION,
  '08000': DatabaseErrorType.CONNECTION_ERROR,
  '08003': DatabaseErrorType.CONNECTION_ERROR,
  '08006': DatabaseErrorType.CONNECTION_ERROR,
  '57014': DatabaseErrorType.TIMEOUT_ERROR,
  '42501': DatabaseErrorType.PERMISSION_DENIED
}

// Mensagens amigáveis para usuários
const USER_FRIENDLY_MESSAGES: Record<DatabaseErrorType, string> = {
  [DatabaseErrorType.UNIQUE_VIOLATION]: 'Este registro já existe no sistema',
  [DatabaseErrorType.FOREIGN_KEY_VIOLATION]: 'Não é possível realizar esta operação devido a dependências',
  [DatabaseErrorType.NOT_NULL_VIOLATION]: 'Campo obrigatório não foi preenchido',
  [DatabaseErrorType.CHECK_VIOLATION]: 'Dados não atendem aos critérios de validação',
  [DatabaseErrorType.CONNECTION_ERROR]: 'Erro de conexão com o banco de dados',
  [DatabaseErrorType.TIMEOUT_ERROR]: 'Operação demorou muito para ser concluída',
  [DatabaseErrorType.PERMISSION_DENIED]: 'Permissão negada para esta operação',
  [DatabaseErrorType.UNKNOWN_ERROR]: 'Erro interno do servidor'
}

// Mensagens específicas para campos conhecidos
const FIELD_SPECIFIC_MESSAGES: Record<string, Record<string, string>> = {
  email: {
    [DatabaseErrorType.UNIQUE_VIOLATION]: 'Este email já está cadastrado no sistema'
  },
  cpf: {
    [DatabaseErrorType.UNIQUE_VIOLATION]: 'Este CPF já está cadastrado no sistema'
  },
  cnpj: {
    [DatabaseErrorType.UNIQUE_VIOLATION]: 'Este CNPJ já está cadastrado no sistema'
  },
  telefone: {
    [DatabaseErrorType.UNIQUE_VIOLATION]: 'Este telefone já está cadastrado no sistema'
  },
  nome: {
    [DatabaseErrorType.UNIQUE_VIOLATION]: 'Já existe um registro com este nome'
  },
  codigo: {
    [DatabaseErrorType.UNIQUE_VIOLATION]: 'Este código já está em uso'
  }
}

/**
 * Analisa um erro de banco de dados e retorna informações estruturadas
 * @param error Erro original do banco de dados
 * @returns Objeto DatabaseError estruturado
 */
export function analyzeDatabaseError(error: any): DatabaseError {
  // Verificar se é erro do PostgreSQL
  if (error?.code && POSTGRES_ERROR_CODES[error.code]) {
    const errorType = POSTGRES_ERROR_CODES[error.code]
    
    // Extrair informações específicas do erro
    let field: string | undefined
    let table: string | undefined
    let constraint: string | undefined
    
    if (error.details) {
      // Tentar extrair nome do campo do detalhe do erro
      const fieldMatch = error.details.match(/Key \(([^)]+)\)/)
      if (fieldMatch) {
        field = fieldMatch[1]
      }
      
      // Tentar extrair nome da tabela
      const tableMatch = error.details.match(/relation "([^"]+)"/)
      if (tableMatch) {
        table = tableMatch[1]
      }
    }
    
    if (error.constraint) {
      constraint = error.constraint
    }
    
    return {
      type: errorType,
      message: error.message || 'Erro de banco de dados',
      field,
      table,
      constraint,
      originalError: error
    }
  }
  
  // Verificar se é erro de conexão
  if (error?.message?.includes('connection') || 
      error?.message?.includes('timeout') ||
      error?.code === 'ECONNREFUSED') {
    return {
      type: DatabaseErrorType.CONNECTION_ERROR,
      message: error.message || 'Erro de conexão',
      originalError: error
    }
  }
  
  // Erro desconhecido
  return {
    type: DatabaseErrorType.UNKNOWN_ERROR,
    message: error?.message || 'Erro desconhecido',
    originalError: error
  }
}

/**
 * Gera uma mensagem amigável para o usuário baseada no erro de banco
 * @param dbError Erro de banco estruturado
 * @returns Mensagem amigável para o usuário
 */
export function generateUserFriendlyMessage(dbError: DatabaseError): string {
  // Verificar se há mensagem específica para o campo
  if (dbError.field && FIELD_SPECIFIC_MESSAGES[dbError.field]?.[dbError.type]) {
    return FIELD_SPECIFIC_MESSAGES[dbError.field][dbError.type]
  }
  
  // Usar mensagem padrão para o tipo de erro
  return USER_FRIENDLY_MESSAGES[dbError.type] || USER_FRIENDLY_MESSAGES[DatabaseErrorType.UNKNOWN_ERROR]
}

/**
 * Middleware para tratamento de erros de banco de dados
 * @param handler Função que pode gerar erros de banco
 * @param options Opções de configuração
 */
export function withDatabaseErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  options: {
    logErrors?: boolean
    sanitizeErrors?: boolean
    customErrorMessages?: Record<string, string>
  } = {}
) {
  const {
    logErrors = true,
    sanitizeErrors = process.env.NODE_ENV === 'production',
    customErrorMessages = {}
  } = options
  
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args)
    } catch (error) {
      const dbError = analyzeDatabaseError(error)
      
      if (logErrors) {
        frontendLogger.logError('Erro de banco de dados', {
          type: dbError.type,
          field: dbError.field,
          table: dbError.table,
          constraint: dbError.constraint,
          sanitized: sanitizeErrors
        }, dbError.originalError, 'api')
      }
      
      // Usar mensagem customizada se disponível
      const customMessage = customErrorMessages[dbError.type]
      const userMessage = customMessage || generateUserFriendlyMessage(dbError)
      
      // Criar AppError para consistência com o sistema existente
      const appError = createAppError(
        {
          message: userMessage,
          code: 'DATABASE_ERROR',
          status: 500,
          details: {
            type: dbError.type,
            field: dbError.field,
            table: dbError.table,
            constraint: dbError.constraint
          }
        },
        'Database Operation'
      )
      
      throw appError
    }
  }
}

/**
 * Middleware específico para APIs que retorna NextResponse
 * @param handler Handler da API
 * @param options Opções de configuração
 */
export function withApiDatabaseErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>,
  options: {
    logErrors?: boolean
    sanitizeErrors?: boolean
    customErrorMessages?: Record<string, string>
  } = {}
) {
  const {
    logErrors = true,
    sanitizeErrors = process.env.NODE_ENV === 'production',
    customErrorMessages = {}
  } = options
  
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      const dbError = analyzeDatabaseError(error)
      
      if (logErrors) {
        frontendLogger.logError('Erro de banco de dados na API', {
          type: dbError.type,
          field: dbError.field,
          table: dbError.table,
          constraint: dbError.constraint,
          sanitized: sanitizeErrors
        }, dbError.originalError, 'api')
      }
      
      // Usar mensagem customizada se disponível
      const customMessage = customErrorMessages[dbError.type]
      const userMessage = customMessage || generateUserFriendlyMessage(dbError)
      
      // Determinar status HTTP baseado no tipo de erro
      let statusCode = 500
      switch (dbError.type) {
        case DatabaseErrorType.UNIQUE_VIOLATION:
        case DatabaseErrorType.CHECK_VIOLATION:
        case DatabaseErrorType.NOT_NULL_VIOLATION:
          statusCode = 400
          break
        case DatabaseErrorType.FOREIGN_KEY_VIOLATION:
          statusCode = 409
          break
        case DatabaseErrorType.PERMISSION_DENIED:
          statusCode = 403
          break
        case DatabaseErrorType.CONNECTION_ERROR:
        case DatabaseErrorType.TIMEOUT_ERROR:
          statusCode = 503
          break
        default:
          statusCode = 500
      }
      
      return NextResponse.json({
        error: userMessage,
        type: dbError.type,
        details: sanitizeErrors ? undefined : {
          field: dbError.field,
          table: dbError.table,
          constraint: dbError.constraint
        }
      }, { status: statusCode })
    }
  }
}

/**
 * Função utilitária para verificar se um erro é de banco de dados
 * @param error Erro a ser verificado
 * @returns true se for erro de banco de dados
 */
export function isDatabaseError(error: any): boolean {
  return !!(error?.code && POSTGRES_ERROR_CODES[error.code]) ||
         error?.message?.includes('connection') ||
         error?.message?.includes('timeout') ||
         error?.code === 'ECONNREFUSED'
}

/**
 * Função para criar mensagens de erro específicas para operações
 * @param operation Tipo de operação (create, update, delete)
 * @param entity Nome da entidade (user, product, etc.)
 * @param dbError Erro de banco estruturado
 * @returns Mensagem específica para a operação
 */
export function generateOperationSpecificMessage(
  operation: 'create' | 'update' | 'delete',
  entity: string,
  dbError: DatabaseError
): string {
  const operationMessages: Record<string, Partial<Record<DatabaseErrorType, string>>> = {
    create: {
      [DatabaseErrorType.UNIQUE_VIOLATION]: `Não foi possível criar ${entity} - dados já existem`,
      [DatabaseErrorType.NOT_NULL_VIOLATION]: `Não foi possível criar ${entity} - campo obrigatório não preenchido`,
      [DatabaseErrorType.CHECK_VIOLATION]: `Não foi possível criar ${entity} - dados inválidos`
    },
    update: {
      [DatabaseErrorType.UNIQUE_VIOLATION]: `Não foi possível atualizar ${entity} - dados já existem`,
      [DatabaseErrorType.FOREIGN_KEY_VIOLATION]: `Não foi possível atualizar ${entity} - existem dependências`,
      [DatabaseErrorType.NOT_NULL_VIOLATION]: `Não foi possível atualizar ${entity} - campo obrigatório não pode ser vazio`
    },
    delete: {
      [DatabaseErrorType.FOREIGN_KEY_VIOLATION]: `Não foi possível excluir ${entity} - existem registros dependentes`,
      [DatabaseErrorType.PERMISSION_DENIED]: `Não foi possível excluir ${entity} - permissão negada`
    }
  }
  
  return operationMessages[operation]?.[dbError.type] || generateUserFriendlyMessage(dbError)
}

export default {
  analyzeDatabaseError,
  generateUserFriendlyMessage,
  withDatabaseErrorHandling,
  withApiDatabaseErrorHandling,
  isDatabaseError,
  generateOperationSpecificMessage,
  DatabaseErrorType
}
