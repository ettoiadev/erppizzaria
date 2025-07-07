"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'

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

interface SupabaseAuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  isValidating: boolean
  getValidToken: () => Promise<string | null>
  refreshSession: () => Promise<boolean>
  validateSession: () => Promise<boolean>
  login: (email: string, password: string, requiredRole?: string) => Promise<void>
  logout: () => Promise<void>
  register: (userData: any) => Promise<void>
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined)

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isValidating, setIsValidating] = useState(false)
  const router = useRouter()

  // Função para carregar perfil do usuário
  const loadUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, phone, user_id')
        .eq('user_id', supabaseUser.id)
        .single()

      if (error || !data) {
        console.error('Erro ao carregar perfil:', error)
        return null
      }

      return {
        id: data.id,
        name: data.full_name || data.email.split("@")[0],
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
        const userProfile = await loadUserProfile(currentSession.user)
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
        return false
      }

      console.log('✅ Sessão renovada com sucesso')
      setSession(data.session)
      
      // Atualizar perfil se necessário
      if (data.session.user) {
        const userProfile = await loadUserProfile(data.session.user)
        setUser(userProfile)
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
        console.log('Sessão inválida, redirecionando para login...')
        return null
      }

      const { data: { session: currentSession } } = await supabase.auth.getSession()
      return currentSession?.access_token || null
    } catch (error) {
      console.error('Erro ao obter token válido:', error)
      return null
    }
  }

  // Inicialização da sessão
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Verificar sessão inicial
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        
        if (initialSession) {
          setSession(initialSession)
          const userProfile = await loadUserProfile(initialSession.user)
          setUser(userProfile)
        }
      } catch (error) {
        console.error('Erro na inicialização da autenticação:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event)
        
        setSession(session)
        
        if (session?.user) {
          const userProfile = await loadUserProfile(session.user)
          setUser(userProfile)
        } else {
          setUser(null)
        }
        
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Função de login usando Supabase Auth
  const login = async (email: string, password: string, requiredRole?: string) => {
    try {
      setIsLoading(true)

      console.log('🔄 Fazendo login para:', email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (error || !data.user) {
        console.error('❌ Erro no login:', error?.message)
        throw new Error(error?.message || "Credenciais inválidas")
      }

      console.log('✅ Login no Supabase Auth realizado com sucesso')

      // Carregar perfil do usuário
      const userProfile = await loadUserProfile(data.user)
      
      if (!userProfile) {
        throw new Error("Perfil de usuário não encontrado")
      }

      // Verificar role se necessário
      if (requiredRole === "admin" && userProfile.role !== "ADMIN") {
        throw new Error("Acesso negado. Apenas administradores podem acessar esta área.")
      }

      setSession(data.session)
      setUser(userProfile)

      // Manter compatibilidade com localStorage para outras partes da aplicação
      if (data.session?.access_token) {
        localStorage.setItem("auth-token", data.session.access_token)
        localStorage.setItem("user-data", JSON.stringify(userProfile))
      }

    } catch (error: any) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      
      // Limpar localStorage
      localStorage.removeItem("auth-token")
      localStorage.removeItem("user-data")
      
      // Redirecionar para a página inicial
      router.push("/")
    } catch (error) {
      console.error('Erro no logout:', error)
    }
  }

  const register = async (userData: any) => {
    try {
      setIsLoading(true)
      
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            phone: userData.phone
          }
        }
      })

      if (error) {
        throw new Error(error.message || "Erro ao criar conta")
      }

      // Se o usuário foi criado, fazer login automaticamente
      if (data.user && data.session) {
        await login(userData.email, userData.password)
      }
    } catch (error: any) {
      throw new Error(error.message || "Erro ao criar conta")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SupabaseAuthContext.Provider
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
    </SupabaseAuthContext.Provider>
  )
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext)
  if (context === undefined) {
    throw new Error("useSupabaseAuth must be used within a SupabaseAuthProvider")
  }
  return context
} 