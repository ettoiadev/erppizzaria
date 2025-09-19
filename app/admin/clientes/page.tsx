"use client"

import { AdminLayout } from "@/components/admin/layout/admin-layout"
import { CustomersManagement } from "@/components/admin/customers/customers-management"

export default function AdminCustomersPage() {
  return (
    <AdminLayout>
      <CustomersManagement />
    </AdminLayout>
  )
}
