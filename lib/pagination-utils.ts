import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { appLogger } from '@/lib/logging'

// Interface para parâmetros de paginação
export interface PaginationParams {
  page: number
  limit: number
  offset: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  search?: string
}

// Interface para resultado paginado
export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPreviousPage: boolean
    nextPage: number | null
    previousPage: number | null
  }
  meta?: {
    executionTime: number
    cacheHit?: boolean
  }
}

// Configuração padrão de paginação
const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100
const MIN_LIMIT = 1

// Função para extrair parâmetros de paginação da request
export function extractPaginationParams(request: NextRequest): PaginationParams {
  const { searchParams } = new URL(request.url)
  
  // Extrair e validar página
  const pageParam = searchParams.get('page')
  const page = Math.max(parseInt(pageParam || '1', 10) || DEFAULT_PAGE, 1)
  
  // Extrair e validar limite
  const limitParam = searchParams.get('limit')
  let limit = parseInt(limitParam || DEFAULT_LIMIT.toString(), 10) || DEFAULT_LIMIT
  limit = Math.min(Math.max(limit, MIN_LIMIT), MAX_LIMIT)
  
  // Calcular offset
  const offset = (page - 1) * limit
  
  // Extrair ordenação
  const sortBy = searchParams.get('sortBy') || undefined
  const sortOrderParam = searchParams.get('sortOrder')?.toUpperCase()
  const sortOrder = (sortOrderParam === 'ASC' || sortOrderParam === 'DESC') ? sortOrderParam : 'ASC'
  
  // Extrair busca
  const search = searchParams.get('search') || undefined
  
  return {
    page,
    limit,
    offset,
    sortBy,
    sortOrder,
    search
  }
}

// Função para construir cláusula ORDER BY
export function buildOrderByClause(sortBy?: string, sortOrder: 'ASC' | 'DESC' = 'ASC', allowedFields: string[] = []): string {
  if (!sortBy || !allowedFields.includes(sortBy)) {
    return ''
  }
  
  // Sanitizar campo para evitar SQL injection
  const sanitizedField = sortBy.replace(/[^a-zA-Z0-9_]/g, '')
  return `ORDER BY ${sanitizedField} ${sortOrder}`
}

// Função para construir cláusula WHERE para busca
export function buildSearchClause(search?: string, searchFields: string[] = []): { clause: string; params: any[] } {
  if (!search || searchFields.length === 0) {
    return { clause: '', params: [] }
  }
  
  const searchTerm = `%${search.toLowerCase()}%`
  const conditions = searchFields.map((field, index) => `LOWER(${field}) LIKE $${index + 1}`)
  const clause = `AND (${conditions.join(' OR ')})`
  const params = searchFields.map(() => searchTerm)
  
  return { clause, params }
}

// Função genérica para paginação de queries
export async function paginateQuery<T>(
  baseQuery: string,
  countQuery: string,
  params: PaginationParams,
  queryParams: any[] = [],
  searchFields: string[] = []
): Promise<PaginatedResult<T>> {
  const startTime = Date.now()
  
  try {
    // Construir cláusula de busca
    const { clause: searchClause, params: searchParams } = buildSearchClause(params.search, searchFields)
    
    // Construir query de contagem
    const finalCountQuery = countQuery + (searchClause ? ` ${searchClause}` : '')
    const countParams = [...queryParams, ...searchParams]
    
    // Executar query de contagem
    const countResult = await query(finalCountQuery, countParams)
    const totalItems = parseInt(countResult.rows[0]?.count || '0', 10)
    
    // Calcular informações de paginação
    const totalPages = Math.ceil(totalItems / params.limit)
    const hasNextPage = params.page < totalPages
    const hasPreviousPage = params.page > 1
    const nextPage = hasNextPage ? params.page + 1 : null
    const previousPage = hasPreviousPage ? params.page - 1 : null
    
    // Construir query principal com paginação
    let finalQuery = baseQuery
    if (searchClause) {
      finalQuery += ` ${searchClause}`
    }
    
    // Adicionar ordenação se especificada
    if (params.sortBy) {
      finalQuery += ` ORDER BY ${params.sortBy} ${params.sortOrder}`
    }
    
    // Adicionar LIMIT e OFFSET
    finalQuery += ` LIMIT $${countParams.length + 1} OFFSET $${countParams.length + 2}`
    
    const finalParams = [...countParams, params.limit, params.offset]
    
    // Executar query principal
    const dataResult = await query(finalQuery, finalParams)
    
    const executionTime = Date.now() - startTime
    
    appLogger.info('general', `Query executed in ${executionTime}ms`, {
      page: params.page,
      limit: params.limit,
      totalItems,
      totalPages
    })
    
    return {
      data: dataResult.rows as T[],
      pagination: {
        currentPage: params.page,
        totalPages,
        totalItems,
        itemsPerPage: params.limit,
        hasNextPage,
        hasPreviousPage,
        nextPage,
        previousPage
      },
      meta: {
        executionTime
      }
    }
  } catch (error) {
    appLogger.error('general', 'Erro na paginação', error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}

// Função específica para paginação de produtos
export async function paginateProducts(params: PaginationParams, categoryId?: string): Promise<PaginatedResult<any>> {
  const baseQuery = `
    SELECT p.id, p.name, p.description, p.price, p.category_id, p.image, p.active as available,
           c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.active = true
    ${categoryId ? 'AND p.category_id = $1' : ''}
  `
  
  const countQuery = `
    SELECT COUNT(*) as count
    FROM products p
    WHERE p.active = true
    ${categoryId ? 'AND p.category_id = $1' : ''}
  `
  
  const queryParams = categoryId ? [categoryId] : []
  const searchFields = ['p.name', 'p.description']
  
  return paginateQuery(
    baseQuery,
    countQuery,
    params,
    queryParams,
    searchFields
  )
}

// Função específica para paginação de pedidos
export async function paginateOrders(params: PaginationParams, status?: string): Promise<PaginatedResult<any>> {
  const baseQuery = `
    SELECT o.id, o.status, o.total_amount, o.created_at, o.updated_at,
           c.name as customer_name, c.phone as customer_phone, c.email as customer_email
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE 1=1
    ${status ? 'AND o.status = $1' : ''}
  `
  
  const countQuery = `
    SELECT COUNT(*) as count
    FROM orders o
    WHERE 1=1
    ${status ? 'AND o.status = $1' : ''}
  `
  
  const queryParams = status ? [status] : []
  const searchFields = ['c.name', 'c.phone', 'c.email']
  
  return paginateQuery(
    baseQuery,
    countQuery,
    params,
    queryParams,
    searchFields
  )
}

// Função específica para paginação de clientes
export async function paginateCustomers(params: PaginationParams): Promise<PaginatedResult<any>> {
  const baseQuery = `
    SELECT id, name, email, phone, created_at, active
    FROM customers
    WHERE active = true
  `
  
  const countQuery = `
    SELECT COUNT(*) as count
    FROM customers
    WHERE active = true
  `
  
  const searchFields = ['name', 'email', 'phone']
  
  return paginateQuery(
    baseQuery,
    countQuery,
    params,
    [],
    searchFields
  )
}

// Middleware para adicionar paginação automática
export function withPagination<T>(
  queryFunction: (params: PaginationParams, ...args: any[]) => Promise<PaginatedResult<T>>
) {
  return async (request: NextRequest, ...args: any[]): Promise<PaginatedResult<T>> => {
    const paginationParams = extractPaginationParams(request)
    return queryFunction(paginationParams, ...args)
  }
}

// Função para validar parâmetros de ordenação
export function validateSortParams(sortBy?: string, allowedFields: string[] = []): boolean {
  if (!sortBy) return true
  return allowedFields.includes(sortBy)
}

// Função para criar links de navegação
export function createNavigationLinks(baseUrl: string, pagination: PaginatedResult<any>['pagination']): {
  first: string
  last: string
  next: string | null
  previous: string | null
} {
  const { currentPage, totalPages, itemsPerPage } = pagination
  
  return {
    first: `${baseUrl}?page=1&limit=${itemsPerPage}`,
    last: `${baseUrl}?page=${totalPages}&limit=${itemsPerPage}`,
    next: pagination.hasNextPage ? `${baseUrl}?page=${currentPage + 1}&limit=${itemsPerPage}` : null,
    previous: pagination.hasPreviousPage ? `${baseUrl}?page=${currentPage - 1}&limit=${itemsPerPage}` : null
  }
}

// Função para otimizar queries com cursor-based pagination (para listas muito grandes)
export async function paginateWithCursor<T>(
  baseQuery: string,
  cursorField: string,
  cursor?: string,
  limit: number = DEFAULT_LIMIT
): Promise<{ data: T[]; nextCursor: string | null; hasMore: boolean }> {
  try {
    let finalQuery = baseQuery
    const queryParams: any[] = []
    
    if (cursor) {
      finalQuery += ` AND ${cursorField} > $1`
      queryParams.push(cursor)
    }
    
    finalQuery += ` ORDER BY ${cursorField} ASC LIMIT $${queryParams.length + 1}`
    queryParams.push(limit + 1) // Buscar um item a mais para verificar se há próxima página
    
    const result = await query(finalQuery, queryParams)
    const rows = result.rows as T[]
    
    const hasMore = rows.length > limit
    const data = hasMore ? rows.slice(0, limit) : rows
    const nextCursor = hasMore && data.length > 0 ? (data[data.length - 1] as any)[cursorField] : null
    
    return {
      data,
      nextCursor,
      hasMore
    }
  } catch (error) {
    appLogger.error('general', 'Erro na paginação por cursor', error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}