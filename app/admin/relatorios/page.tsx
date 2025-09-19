"use client"

import { AdminLayout } from "@/components/admin/layout/admin-layout"
import { ReportsManagement } from "@/components/admin/reports/reports-management"

export default function AdminReportsPage() {
  return (
    <AdminLayout>
      <ReportsManagement />
    </AdminLayout>
  )
}
