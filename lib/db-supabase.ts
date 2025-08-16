/**
 * @deprecated Este arquivo foi refatorado em módulos menores.
 * Use as importações de '@/lib/db' em vez de '@/lib/db-supabase'
 * 
 * Mantido para compatibilidade com código existente.
 * Será removido em versões futuras.
 */

// Re-exportar tudo dos novos módulos para manter compatibilidade
export * from './db'

// Manter tipos para compatibilidade
export type { UserProfile } from './db/users'
export type { Product } from './db/products'
export type { OrderItemInput } from './db/orders'

// Re-exportar funções específicas que estão sendo importadas
export { 
  createAddress,
  getAddressById,
  updateAddress,
  deleteAddress,
  saveCustomerAddress
} from './db/addresses'

export {
  getAdminSettings,
  updateAdminSetting
} from './db/settings'

export {
  getUserByEmail
} from './db/users'

export {
  updateOrderStatus,
  updatePaymentStatus
} from './db/orders'

// Funções movidas para módulos específicos:
// - Usuários: '@/lib/db/users'
// - Produtos: '@/lib/db/products'  
// - Categorias: '@/lib/db/categories'
// - Pedidos: '@/lib/db/orders'
// - Clientes: '@/lib/db/customers'
// - Endereços: '@/lib/db/addresses'
// - Configurações: '@/lib/db/settings'
//
// Use '@/lib/db' para importar todas as funções de uma vez