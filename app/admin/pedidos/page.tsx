"use client"

import { AdminLayout } from "@/components/admin/layout/admin-layout"
import { OrdersManagement } from "@/components/admin/orders/orders-management"

export default function AdminOrdersPage() {
  return (
    <AdminLayout>
      <OrdersManagement />
    </AdminLayout>
  )
}
