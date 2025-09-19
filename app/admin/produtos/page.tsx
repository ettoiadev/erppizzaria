"use client"

import { AdminLayout } from "@/components/admin/layout/admin-layout"
import { ProductsManagement } from "@/components/admin/products/products-management"

export default function AdminProductsPage() {
  return (
    <AdminLayout>
      <ProductsManagement />
    </AdminLayout>
  )
}
