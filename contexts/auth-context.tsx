'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { appLogger } from '@/lib/logging'

interface AuthUser {
  id: string
  email: string
  full_name?: string
  role?: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  isAdmin: boolean
  login: (email: string, password: string, isAdminLogin?: boolean) => Promise<{ success: boolean; error?: string }>
  logout: (revokeAll?: boolean) => Promise<void>
  checkAuth: () => Promise<void>
  refreshToken: () => Promise<boolean>
  register: (userData: any) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Garantir que o componente foi montado no cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  // Verificar autenticação ao carregar
  useEffect(() => {
    if (!mounted) return // Aguardar montagem no cliente
    
    // Não verificar autenticação em páginas de login, cadastro ou recuperação de senha
    const isAuthPage = window.location.pathname.includes('/login') || 
                      window.location.pathname.includes('/cadastro') ||
                      window.location.pathname.includes('/esqueci-senha')
    if (!isAuthPage) {
      checkAuth()
    } else {
      setLoading(false) // Não mostrar loading em páginas de autenticação
    }
  }, [mounted])

  const checkAuth = async () => {
    try {
      setLoading(true)
      
      // Verificar se existe cookie de autenticação
      const cookies = document.cookie.split(';')
      const authToken = cookies.find(c => c.trim().startsWith('auth-token='))
      
      if (!authToken) {
        setUser(null)
        // Não logar se não houver token - é um estado normal em páginas públicas
        return
      }
      
      appLogger.info('auth', 'Verificando autenticação do usuário')
      
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          setUser(data.user)
          appLogger.info('auth', 'Usuário autenticado', {
            email: data.user.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
            role: data.user.role
          })
        }
      } else if (response.status === 401) {
        // Token expirado, tentar refresh apenas se houver refresh token
        const refreshTokenCookie = cookies.find(c => c.trim().startsWith('refresh-token='))
        if (refreshTokenCookie) {
          const refreshed = await refreshToken()
          if (!refreshed) {
            setUser(null)
            appLogger.info('auth', 'Usuário não autenticado - sessão expirada')
          }
        } else {
          setUser(null)
          appLogger.info('auth', 'Usuário não autenticado - sem refresh token')
        }
      } else {
        setUser(null)
        appLogger.info('auth', 'Usuário não autenticado')
      }
    } catch (error: any) {
      appLogger.error('auth', 'Erro ao verificar autenticação', error instanceof Error ? error : new Error(String(error)), {
         error: error.message
       })
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const refreshToken = async (): Promise<boolean> => {
    try {
      // Verificar se existe cookie de refresh token
      const cookies = document.cookie.split(';')
      const refreshToken = cookies.find(c => c.trim().startsWith('refresh-token='))
      
      if (!refreshToken) {
        // Não logar se não houver refresh token - é um estado normal
        return false
      }
      
      appLogger.info('auth', 'Tentando renovar token')
      
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
            appLogger.info('auth', 'Token renovado e usuário autenticado', {
              email: data.user.email.replace(/(.{2}).*(@.*)/, '$1***$2')
            })
            return true
          }
        }
      }
      
      appLogger.warn('auth', 'Falha na renovação do token')
      return false
    } catch (error: any) {
      appLogger.error('auth', 'Erro ao renovar token', error instanceof Error ? error : new Error(String(error)), {
         error: error.message
       })
      return false
    }
  }

  const login = async (email: string, password: string, isAdminLogin: boolean = false) => {
    try {
      setLoading(true)
      
      // Verificar se já existe cookie de autenticação
      const cookies = document.cookie.split(';')
      const authToken = cookies.find(c => c.trim().startsWith('auth-token='))
      
      if (authToken) {
        appLogger.warn('auth', 'Tentativa de login com sessão ativa', {
          email: email.replace(/(.{2}).*(@.*)/, '$1***$2')
        })
      }

      appLogger.info('auth', 'Tentativa de login', {
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        isAdminLogin
      })

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(isAdminLogin && { 'x-admin-login': 'true' })
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Verificar se é um login administrativo e se o usuário tem a role correta
        if (isAdminLogin && data.user.role !== 'admin') {
          appLogger.warn('auth', 'Tentativa de login administrativo com usuário não autorizado', {
            email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
            role: data.user.role
          })
          return { success: false, error: 'Acesso não autorizado' }
        }

        setUser(data.user)
        appLogger.info('auth', 'Login realizado com sucesso', {
          email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
          role: data.user.role,
          tokenExpiry: data.expiresIn ? `${data.expiresIn}s` : 'unknown',
          isAdminLogin
        })
        return { success: true }
      } else {
        appLogger.warn('auth', 'Falha no login', {
          email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
          error: data.error,
          isAdminLogin
        })
        return { success: false, error: data.error || 'Erro no login' }
      }
    } catch (error: any) {
      appLogger.error('auth', 'Erro durante o login', error instanceof Error ? error : new Error(String(error)), {
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        error: error.message,
        isAdminLogin
      })
      return { success: false, error: 'Erro de conexão' }
    } finally {
      setLoading(false)
    }
  }

  const logout = async (revokeAll: boolean = false) => {
    try {
      // Verificar se existe cookie de autenticação antes de tentar logout
      const cookies = document.cookie.split(';')
      const authToken = cookies.find(c => c.trim().startsWith('auth-token='))
      
      if (!authToken) {
        appLogger.warn('auth', 'Tentativa de logout sem sessão ativa')
        setUser(null)
        return
      }

      appLogger.info('auth', 'Realizando logout', {
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
      appLogger.info('auth', 'Logout realizado com sucesso')
    } catch (error: any) {
      appLogger.error('auth', 'Erro durante o logout', error instanceof Error ? error : new Error(String(error)), {
        error: error.message
      })
      // Mesmo com erro, limpar o estado local
      setUser(null)
    }
  }

  const register = async (userData: any) => {
    try {
      setLoading(true)
      
      // Verificar se já existe cookie de autenticação
      const cookies = document.cookie.split(';')
      const authToken = cookies.find(c => c.trim().startsWith('auth-token='))
      
      if (authToken) {
        appLogger.warn('auth', 'Tentativa de registro com sessão ativa', {
          email: userData.email?.replace(/(.{2}).*(@.*)/, '$1***$2')
        })
      }

      appLogger.info('auth', 'Tentativa de registro', {
        email: userData.email?.replace(/(.{2}).*(@.*)/, '$1***$2')
      })

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok && data.user) {
        setUser(data.user)
        appLogger.info('auth', 'Registro realizado com sucesso', {
          email: userData.email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
          role: data.user.role
        })
      } else {
        appLogger.warn('auth', 'Falha no registro', {
          email: userData.email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
          error: data.error
        })
        throw new Error(data.error || 'Erro no registro')
      }
    } catch (error: any) {
      appLogger.error('auth', 'Erro durante o registro', error instanceof Error ? error : new Error(String(error)), {
        email: userData.email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
        error: error.message
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAdmin,
      login,
      logout,
      checkAuth,
      refreshToken,
      register
    }}>
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
