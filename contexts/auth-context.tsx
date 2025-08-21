'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { frontendLogger } from '@/lib/frontend-logger'

interface User {
  id: string
  email: string
  role: string
  full_name?: string
  name?: string
  phone?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  is_loading?: boolean // Compatibilidade
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: (revokeAll?: boolean) => Promise<void>
  log_out?: (revokeAll?: boolean) => Promise<void> // Compatibilidade
  checkAuth: () => Promise<void>
  check_auth?: () => Promise<void> // Compatibilidade
  refreshToken: () => Promise<boolean>
  refresh_token?: () => Promise<boolean> // Compatibilidade
  register: (userData: any) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Verificar autenticação ao carregar
  useEffect(() => {
    // Não verificar autenticação em páginas de login, cadastro ou recuperação de senha
    const isAuthPage = window.location.pathname.includes('/login') || 
                      window.location.pathname.includes('/cadastro') ||
                      window.location.pathname.includes('/esqueci-senha')
    if (!isAuthPage) {
      checkAuth()
    } else {
      setLoading(false) // Não mostrar loading em páginas de autenticação
    }
  }, [])

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
      
      frontendLogger.info('Verificando autenticação do usuário', 'auth')
      
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          setUser(data.user)
          frontendLogger.info('Usuário autenticado', 'auth', {
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
            frontendLogger.info('Usuário não autenticado - sessão expirada', 'auth')
          }
        } else {
          setUser(null)
          frontendLogger.info('Usuário não autenticado - sem refresh token', 'auth')
        }
      } else {
        setUser(null)
        frontendLogger.info('Usuário não autenticado', 'auth')
      }
    } catch (error: any) {
      frontendLogger.logError('Erro ao verificar autenticação', {
         error: error.message
       }, error, 'auth')
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
      
      frontendLogger.info('Tentando renovar token', 'auth')
      
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
            frontendLogger.info('Token renovado e usuário autenticado', 'auth', {
              email: data.user.email.replace(/(.{2}).*(@.*)/, '$1***$2')
            })
            return true
          }
        }
      }
      
      frontendLogger.warn('Falha na renovação do token', 'auth')
      return false
    } catch (error: any) {
      frontendLogger.logError('Erro ao renovar token', {
         error: error.message
       }, error, 'auth')
      return false
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      
      frontendLogger.info('Tentativa de login', 'auth', {
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2')
      })

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setUser(data.user)
        frontendLogger.info('Login realizado com sucesso', 'auth', {
          email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
          role: data.user.role,
          tokenExpiry: data.expiresIn ? `${data.expiresIn}s` : 'unknown'
        })
        return { success: true }
      } else {
        frontendLogger.warn('Falha no login', 'auth', {
          email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
          error: data.error
        })
        return { success: false, error: data.error || 'Erro no login' }
      }
    } catch (error: any) {
      frontendLogger.logError('Erro durante o login', {
         email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
         error: error.message
       }, error, 'auth')
      return { success: false, error: 'Erro de conexão' }
    } finally {
      setLoading(false)
    }
  }

  const logout = async (revokeAll: boolean = false) => {
    try {
      frontendLogger.info('Realizando logout', 'auth', {
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
      frontendLogger.info('Logout realizado com sucesso', 'auth')
    } catch (error: any) {
      frontendLogger.logError('Erro durante o logout', {
         error: error.message
       }, error, 'auth')
      // Mesmo com erro, limpar o estado local
      setUser(null)
    }
  }

  const register = async (userData: any) => {
    try {
      setLoading(true)
      
      frontendLogger.info('Tentativa de registro', 'auth', {
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
        frontendLogger.info('Registro realizado com sucesso', 'auth', {
          email: userData.email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
          role: data.user.role
        })
      } else {
        frontendLogger.warn('Falha no registro', 'auth', {
          email: userData.email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
          error: data.error
        })
        throw new Error(data.error || 'Erro no registro')
      }
    } catch (error: any) {
      frontendLogger.logError('Erro durante o registro', {
         email: userData.email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
         error: error.message
       }, error, 'auth')
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      is_loading: loading, // Compatibilidade
      login,
      logout,
      log_out: logout, // Compatibilidade
      checkAuth,
      check_auth: checkAuth, // Compatibilidade
      refreshToken,
      refresh_token: refreshToken, // Compatibilidade
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
