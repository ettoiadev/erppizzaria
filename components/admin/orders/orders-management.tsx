import { OrdersManagementRefactored } from "./orders-management-refactored"

// Re-exportar o componente refatorado mantendo o nome original
export function OrdersManagement() {
  return <OrdersManagementRefactored />
}

// Exportar também como default para compatibilidade
export default OrdersManagement
