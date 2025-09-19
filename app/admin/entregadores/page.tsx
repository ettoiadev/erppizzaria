"use client"

import { AdminLayout } from "@/components/admin/layout/admin-layout"
import { DeliveryManagement } from "@/components/admin/delivery/delivery-management"

export default function AdminDeliveryPage() {
  return (
    <AdminLayout>
      <DeliveryManagement />
    </AdminLayout>
  )
}
