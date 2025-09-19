"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AdminLayout } from "@/components/admin/layout/admin-layout"
import { Dashboard } from "@/components/admin/dashboard/dashboard"
import { NoSSR } from "@/components/no-ssr"

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        console.log('Usuário não encontrado, redirecionando para login')
        router.push("/admin/login")
      } else if (user.role !== "admin") {
        console.log('Usuário sem permissão admin, redirecionando para login')
        router.push("/admin/login")
      } else {
        console.log('Usuário admin autenticado:', user.email)
      }
    }
  }, [user, loading, router])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  }

  if (!user || user.role !== "admin") {
    return null
  }

  return (
    <NoSSR fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <AdminLayout>
        <Dashboard />
      </AdminLayout>
    </NoSSR>
  )
}
