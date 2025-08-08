"use client"

import { AdminLayout } from "@/components/admin/layout/admin-layout"
import { NotificationTest } from "@/components/admin/notifications/notification-test"

export default function AdminNotificationsPage() {
  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">🔔 Teste de Notificações</h1>
          <p className="text-gray-600 mt-2">
            Teste o sistema de notificações push e em tempo real
          </p>
        </div>
        
        <NotificationTest />
      </div>
    </AdminLayout>
  )
} 