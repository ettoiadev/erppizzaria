"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { AuthenticatedHeader } from "./authenticated-header"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface AuthenticatedLayoutProps {
  children: React.ReactNode
  onCartClick?: () => void
}

export function AuthenticatedLayout({ children, onCartClick }: AuthenticatedLayoutProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Redirect non-authenticated users to login with redirect parameter
    if (!user && !isLoading) {
      console.log("AuthenticatedLayout: User not authenticated, redirecting to login")
      router.push("/login?redirect=" + encodeURIComponent(pathname))
    }
  }, [user, isLoading, router, pathname])

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // Don't render if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Redirecionando para login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthenticatedHeader onCartClick={onCartClick} />
      <main>{children}</main>
    </div>
  )
}
