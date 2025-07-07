"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireRole?: "CUSTOMER" | "ADMIN" | "KITCHEN" | "DELIVERY"
  redirectTo?: string
  fallback?: React.ReactNode
}

export function ProtectedRoute({ 
  children, 
  requireRole, 
  redirectTo = '/login',
  fallback 
}: ProtectedRouteProps) {
  const { user, isLoading, isValidating, validateSession, getValidToken } = useAuth()
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Se ainda está carregando, aguardar
        if (isLoading) return

        // Se não há usuário, verificar se há sessão válida
        if (!user) {
          const sessionValid = await validateSession()
          if (!sessionValid) {
            console.log('⚠️ Nenhuma sessão válida encontrada, redirecionando...')
            router.push(`${redirectTo}?error=session_required`)
            return
          }
        }

        // Verificar se tem role necessário
        if (requireRole && user && user.role !== requireRole) {
          console.log(`⚠️ Role requerido: ${requireRole}, usuário tem: ${user.role}`)
          router.push(`${redirectTo}?error=insufficient_permissions`)
          return
        }

        // Verificar se o token ainda é válido
        const token = await getValidToken()
        if (!token) {
          console.log('⚠️ Token inválido, redirecionando para login...')
          router.push(`${redirectTo}?error=session_expired`)
          return
        }

        setIsValidSession(true)
      } catch (error) {
        console.error('Erro na verificação de acesso:', error)
        router.push(`${redirectTo}?error=validation_failed`)
      }
    }

    checkAccess()
  }, [user, isLoading, requireRole, redirectTo, router, validateSession, getValidToken])

  // Mostrar loading enquanto valida
  if (isLoading || isValidating || isValidSession === null) {
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