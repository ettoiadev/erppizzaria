'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { frontendLogger } from '@/lib/logging'

interface User {
  id: string
  email: string
  role: string
  full_name?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: (revokeAll?: boolean) => Promise<void>
  checkAuth: () => Promise<void>
  refreshToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Verificar autenticação ao carregar
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      setLoading(true)
      
      frontendLogger.info('auth', 'Verificando autenticação do usuário')
      
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          setUser(data.user)
          frontendLogger.info('auth', 'Usuário autenticado', {
            email: data.user.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
            role: data.user.role
          })
        }
      } else if (response.status === 401) {
        // Token expirado, tentar refresh
        const refreshed = await refreshToken()
        if (!refreshed) {
          setUser(null)
          frontendLogger.info('auth', 'Usuário não autenticado - sessão expirada')
        }
      } else {
        setUser(null)
        frontendLogger.info('auth', 'Usuário não autenticado')
      }
    } catch (error: any) {
      frontendLogger.error('auth', 'Erro ao verificar autenticação', {
        error: error.message
      })
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const refreshToken = async (): Promise<boolean> => {
    try {
      frontendLogger.info('auth', 'Tentando renovar token')
      
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        // Token renovado, verificar autenticação novamente
        const verifyResponse = await fetch('/api/auth/verify', {
          method: 'POST',
          credentials: 'include'
        })

        if (verifyResponse.ok) {
          const data = await verifyResponse.json()
          if (data.user) {
            setUser(data.user)
            frontendLogger.info('auth', 'Token renovado e usuário autenticado', {
              email: data.user.email.replace(/(.{2}).*(@.*)/, '$1***$2')
            })
            return true
          }
        }
      }
      
      frontendLogger.warn('auth', 'Falha na renovação do token')
      return false
    } catch (error: any) {
      frontendLogger.error('auth', 'Erro ao renovar token', {
        error: error.message
      })
      return false
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      
      frontendLogger.info('auth', 'Tentativa de login', {
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2')
      })

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setUser(data.user)
        frontendLogger.info('auth', 'Login realizado com sucesso', {
          email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
          role: data.user.role,
          tokenExpiry: data.expiresIn ? `${data.expiresIn}s` : 'unknown'
        })
        return { success: true }
      } else {
        frontendLogger.warn('auth', 'Falha no login', {
          email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
          error: data.error
        })
        return { success: false, error: data.error || 'Erro no login' }
      }
    } catch (error: any) {
      frontendLogger.error('auth', 'Erro durante o login', {
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        error: error.message
      })
      return { success: false, error: 'Erro de conexão' }
    } finally {
      setLoading(false)
    }
  }

  const logout = async (revokeAll: boolean = false) => {
    try {
      frontendLogger.info('auth', 'Realizando logout', {
        revokeAll
      })
      
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ revokeAll }),
        credentials: 'include'
      })
      
      setUser(null)
      frontendLogger.info('auth', 'Logout realizado com sucesso')
    } catch (error: any) {
      frontendLogger.error('auth', 'Erro durante o logout', {
        error: error.message
      })
      // Mesmo com erro, limpar o estado local
      setUser(null)
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    checkAuth,
    refreshToken
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
