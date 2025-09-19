"use client"

import { AdminLayout } from "@/components/admin/layout/admin-layout"
import { SettingsManagement } from "@/components/admin/settings/settings-management"

export default function AdminSettingsPage() {
  return (
    <AdminLayout>
      <SettingsManagement />
    </AdminLayout>
  )
}
