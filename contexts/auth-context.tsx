"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { Session } from '@supabase/supabase-js'

interface User {
  id: string
  name: string
  email: string
  role: "CUSTOMER" | "ADMIN" | "KITCHEN" | "DELIVERY"
  phone?: string
  address?: string
  addressData?: {
    zipCode: string
    street: string
    neighborhood: string
    city: string
    state: string
    number: string
    complement: string
  }
}

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  isValidating: boolean
  getValidToken: () => Promise<string | null>
  refreshSession: () => Promise<boolean>
  validateSession: () => Promise<boolean>
  login: (email: string, password: string, requiredRole?: string) => Promise<void>
  logout: () => void
  register: (userData: any) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isValidating, setIsValidating] = useState(false)
  const router = useRouter()

  // Função para carregar perfil do usuário
  const loadUserProfile = async (userId: string, email: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, phone, user_id')
        .eq('user_id', userId)
        .single()

      if (error || !data) {
        console.error('Erro ao carregar perfil:', error)
        return null
      }

      return {
        id: data.id,
        name: data.full_name || email.split("@")[0],
        email: data.email,
        role: data.role.toUpperCase() as "CUSTOMER" | "ADMIN" | "KITCHEN" | "DELIVERY",
        phone: data.phone
      }
    } catch (error) {
      console.error('Erro ao carregar perfil do usuário:', error)
      return null
    }
  }

  // Função para validar se a sessão ainda é válida
  const validateSession = async (): Promise<boolean> => {
    try {
      setIsValidating(true)
      
      const { data: { session: currentSession }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Erro ao validar sessão:', error)
        return false
      }

      if (!currentSession) {
        console.log('Nenhuma sessão encontrada')
        setSession(null)
        setUser(null)
        return false
      }

      // Verificar se o token está próximo do vencimento (dentro de 5 minutos)
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = currentSession.expires_at || 0
      const isExpiring = (expiresAt - now) < 300 // 5 minutos

      if (isExpiring) {
        console.log('Token está expirando, tentando refresh...')
        return await refreshSession()
      }

      setSession(currentSession)
      
      // Carregar perfil se necessário
      if (currentSession.user && !user) {
        const userProfile = await loadUserProfile(currentSession.user.id, currentSession.user.email || '')
        setUser(userProfile)
      }

      return true
    } catch (error) {
      console.error('Erro na validação de sessão:', error)
      return false
    } finally {
      setIsValidating(false)
    }
  }

  // Função para fazer refresh da sessão
  const refreshSession = async (): Promise<boolean> => {
    try {
      console.log('🔄 Fazendo refresh da sessão...')
      
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error || !data.session) {
        console.error('❌ Erro no refresh da sessão:', error)
        setSession(null)
        setUser(null)
        // Limpar localStorage
        localStorage.removeItem("auth-token")
        localStorage.removeItem("user-data")
        return false
      }

      console.log('✅ Sessão renovada com sucesso')
      setSession(data.session)
      
      // Atualizar perfil se necessário
      if (data.session.user) {
        const userProfile = await loadUserProfile(data.session.user.id, data.session.user.email || '')
        setUser(userProfile)
        
        // Atualizar localStorage para compatibilidade
        if (userProfile) {
          localStorage.setItem("auth-token", data.session.access_token)
          localStorage.setItem("user-data", JSON.stringify(userProfile))
        }
      }

      return true
    } catch (error) {
      console.error('Erro no refresh da sessão:', error)
      return false
    }
  }

  // Função para obter token válido, fazendo refresh se necessário
  const getValidToken = async (): Promise<string | null> => {
    try {
      const isValid = await validateSession()
      
      if (!isValid) {
        console.log('Sessão inválida')
        return null
      }

      const { data: { session: currentSession } } = await supabase.auth.getSession()
      return currentSession?.access_token || null
    } catch (error) {
      console.error('Erro ao obter token válido:', error)
      return null
    }
  }

  // Inicialização - verificar localStorage primeiro
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔄 Inicializando autenticação...')
        
        // Verificar localStorage para compatibilidade com sistema atual
        const token = localStorage.getItem("auth-token")
        const userData = localStorage.getItem("user-data")

        if (token && userData) {
          try {
            const parsedUser = JSON.parse(userData)
            console.log('✅ Usuário encontrado no localStorage:', parsedUser.email)
            setUser(parsedUser)
          } catch (error) {
            console.log('❌ Erro ao parsear dados do localStorage')
            localStorage.removeItem("auth-token")
            localStorage.removeItem("user-data")
          }
        } else {
          console.log('🔍 Nenhum usuário encontrado no localStorage')
        }
        
      } catch (error) {
        console.error('Erro na inicialização da autenticação:', error)
      } finally {
        console.log('✅ Inicialização da autenticação concluída')
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Para compatibilidade futura com Supabase Auth, mas não obrigatório para admin
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event)
        
        // Só processar se realmente há uma mudança de sessão do Supabase
        if (session?.user) {
          console.log('✅ Sessão do Supabase detectada')
          setSession(session)
          
          const userProfile = await loadUserProfile(session.user.id, session.user.email || '')
          if (userProfile) {
            setUser(userProfile)
            localStorage.setItem("auth-token", session.access_token)
            localStorage.setItem("user-data", JSON.stringify(userProfile))
          }
        }
        // Não limpar o usuário automaticamente se não há sessão Supabase,
        // pois pode ser um admin logado via API legada
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Função de login melhorada - prioriza API legada para admin
  const login = async (email: string, password: string, requiredRole?: string) => {
    try {
      setIsLoading(true)

      console.log('🔄 Fazendo login para:', email)

      // Para admin, usar sempre a API legada
      if (requiredRole === "admin" || email.includes("admin")) {
        console.log('🔄 Usando API legada para admin...')

        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        })

        if (!response.ok) {
          const text = await response.text()
          let errorData
          try {
            errorData = JSON.parse(text)
          } catch (e) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          throw new Error(errorData.error || "Credenciais inválidas")
        }

        const responseData = await response.json()

        // Verificar role se necessário
        if (requiredRole === "admin" && responseData.user.role !== "admin") {
          throw new Error("Acesso negado. Apenas administradores podem acessar esta área.")
        }

        // Criar objeto do usuário matching nossa interface
        const authenticatedUser = {
          id: responseData.user.id,
          name: responseData.user.full_name || responseData.user.email.split("@")[0],
          email: responseData.user.email,
          role: responseData.user.role.toUpperCase() as "CUSTOMER" | "ADMIN" | "KITCHEN" | "DELIVERY",
        }

        setUser(authenticatedUser)
        localStorage.setItem("auth-token", responseData.token)
        localStorage.setItem("user-data", JSON.stringify(authenticatedUser))

        console.log('✅ Login admin realizado com sucesso')
        return
      }

      // Para outros usuários, tentar primeiro Supabase Auth
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (authData.user && authData.session) {
        console.log('✅ Login no Supabase Auth realizado com sucesso')
        
        const userProfile = await loadUserProfile(authData.user.id, authData.user.email || '')
        
        if (!userProfile) {
          throw new Error("Perfil de usuário não encontrado")
        }

        setSession(authData.session)
        setUser(userProfile)
        localStorage.setItem("auth-token", authData.session.access_token)
        localStorage.setItem("user-data", JSON.stringify(userProfile))

        return
      }

      // Se Supabase Auth falhou, tentar com API legada como fallback
      console.log('🔄 Tentando com API legada como fallback...')

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const text = await response.text()
        let errorData
        try {
          errorData = JSON.parse(text)
        } catch (e) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        throw new Error(errorData.error || "Credenciais inválidas")
      }

      const responseData = await response.json()

      const authenticatedUser = {
        id: responseData.user.id,
        name: responseData.user.full_name || responseData.user.email.split("@")[0],
        email: responseData.user.email,
        role: responseData.user.role.toUpperCase() as "CUSTOMER" | "ADMIN" | "KITCHEN" | "DELIVERY",
      }

      setUser(authenticatedUser)
      localStorage.setItem("auth-token", responseData.token)
      localStorage.setItem("user-data", JSON.stringify(authenticatedUser))

    } catch (error: any) {
      console.error('❌ Erro no login:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    // Logout do Supabase
    supabase.auth.signOut()
    
    setUser(null)
    setSession(null)
    localStorage.removeItem("auth-token")
    localStorage.removeItem("user-data")
    
    // Redirecionar para a página inicial após logout
    router.push("/")
  }

  const register = async (userData: any) => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar conta")
      }

      // Login automatically after registration
      await login(userData.email, userData.password)
    } catch (error) {
      throw new Error("Erro ao criar conta")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isValidating,
        getValidToken,
        refreshSession,
        validateSession,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
