"use client"

import { AdminLayout } from "@/components/admin/layout/admin-layout"
import { PDVInterface } from "@/components/admin/pdv/pdv-interface"

export default function PDVPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">PDV - Point of Sale</h1>
            <p className="text-gray-600 mt-1">
              Interface rápida e simplificada para vendas no balcão
            </p>
          </div>
        </div>

        <PDVInterface />
      </div>
    </AdminLayout>
  )
}