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
  saveCustomerAddress,
  listAddresses
} from './db/addresses'

export {
  getAdminSettings,
  updateAdminSetting
} from './db/settings'

export {
  getUserByEmail,
  createUserProfile
} from './db/users'

export {
  getCategories,
  createCategory,
  updateCategorySortOrders
} from './db/categories'

export {
  getCustomerById,
  listCustomers,
  updateCustomerAndAddress,
  deleteCustomer
} from './db/customers'

export {
  getProductsActive,
  createProduct
} from './db/products'

export {
  listOrders,
  createOrder,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus
} from './db/orders'

// Funções utilitárias
export { getSupabaseServerClient } from './supabase'
export { query } from './db'