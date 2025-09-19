"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { AdminHeader } from "./admin-header"
import { AdminTabs } from "./admin-tabs"

interface AdminLayoutProps {
  children: any
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <ProtectedRoute requireRole="admin" redirectTo="/admin/login">
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <AdminTabs />
      <main className="container mx-auto px-6 py-6">{children}</main>
    </div>
    </ProtectedRoute>
  )
}
