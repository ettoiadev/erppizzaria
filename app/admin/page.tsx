"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AdminLayout } from "@/components/admin/layout/admin-layout"
import { Dashboard } from "@/components/admin/dashboard/dashboard"

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.push("/admin/login")
    }
  }, [user, loading, router])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  }

  if (!user || user.role !== "ADMIN") {
    return null
  }

  return (
    <AdminLayout>
      <Dashboard />
    </AdminLayout>
  )
}
