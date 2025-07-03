"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { AdminHeader } from "./admin-header"
import { AdminTabs } from "./admin-tabs"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirecionar para login administrativo se não estiver logado
    if (!isLoading && !user) {
      router.push("/admin/login")
      return
    }

    // Redirecionar clientes normais para o cardápio
    if (!isLoading && user && user.role === "CUSTOMER") {
      router.push("/cardapio")
      return
    }

    // Apenas administradores podem acessar
    if (!isLoading && user && user.role !== "ADMIN") {
      router.push("/admin/login")
      return
    }
  }, [user, isLoading, router])

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    )
  }

  // Não renderizar se usuário não está logado ou não é admin
  if (!user || user.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <AdminTabs />

      <main className="container mx-auto px-6 py-6">{children}</main>
    </div>
  )
}
