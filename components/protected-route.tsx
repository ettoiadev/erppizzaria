"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireRole?: "CUSTOMER" | "ADMIN" | "KITCHEN" | "DELIVERY" | "customer" | "admin" | "kitchen" | "delivery"
  redirectTo?: string
  fallback?: React.ReactNode
}

export function ProtectedRoute({ 
  children, 
  requireRole, 
  redirectTo = '/login',
  fallback 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Se ainda está carregando, aguardar
        if (loading) return

        // Se não há usuário, redirecionar para login
        if (!user) {
          console.log('⚠️ Nenhuma sessão válida encontrada, redirecionando...')
          router.push(`${redirectTo}?error=session_required`)
          return
        }

        // Verificar se tem role necessário
        if (requireRole && user && user.role !== requireRole) {
          console.log(`⚠️ Role requerido: ${requireRole}, usuário tem: ${user.role}`)
          router.push(`${redirectTo}?error=insufficient_permissions`)
          return
        }

        setIsValidSession(true)
      } catch (error) {
        console.error('Erro na verificação de acesso:', error)
        router.push(`${redirectTo}?error=validation_failed`)
      }
    }

    checkAccess()
  }, [user, loading, requireRole, redirectTo, router])

  // Mostrar loading enquanto valida
  if (loading || isValidSession === null) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    )
  }

  // Se chegou até aqui e a sessão é válida, renderizar children
  if (isValidSession && user) {
    return <>{children}</>
  }

  // Fallback enquanto redireciona
  return fallback || (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner />
    </div>
  )
}