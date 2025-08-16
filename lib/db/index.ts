/**
 * Índice centralizado para operações de banco de dados
 * Mantém compatibilidade com o arquivo original db-supabase.ts
 */

// Re-exportar todas as funções dos módulos específicos
export * from './users'
export * from './products'
export * from './categories'
export * from './orders'
export * from './customers'
export * from './addresses'
export * from './settings'

// Aliases para compatibilidade com código existente
export { listOrders as getOrders } from './orders'