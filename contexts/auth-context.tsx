"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

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
  isLoading: boolean
  isValidating: boolean
  getValidToken: () => Promise<string | null>
  validateSession: () => Promise<boolean>
  login: (email: string, password: string, requiredRole?: string) => Promise<void>
  logout: () => void
  register: (userData: any) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isValidating, setIsValidating] = useState(false)
  const router = useRouter()

  // Função para verificar se o token JWT é válido
  const verifyToken = async (token: string): Promise<User | null> => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      return {
        id: data.user.id,
        name: data.user.full_name || data.user.email.split("@")[0],
        email: data.user.email,
        role: data.user.role.toUpperCase() as "CUSTOMER" | "ADMIN" | "KITCHEN" | "DELIVERY",
        phone: data.user.phone
      }
    } catch (error) {
      console.error('Erro ao verificar token:', error)
      return null
    }
  }

  // Função para obter token válido
  const getValidToken = async (): Promise<string | null> => {
    try {
      const storedToken = localStorage.getItem("auth-token")
      if (!storedToken) {
        return null
      }

      // Verificar se o token ainda é válido
      const userData = await verifyToken(storedToken)
      if (!userData) {
        // Token inválido, limpar dados
        localStorage.removeItem("auth-token")
        localStorage.removeItem("user-data")
        setUser(null)
        return null
      }

      return storedToken
    } catch (error) {
      console.error('Erro ao obter token válido:', error)
      return null
    }
  }

  // Função para validar sessão atual
  const validateSession = async (): Promise<boolean> => {
    try {
      setIsValidating(true)
      const token = await getValidToken()
      
      if (!token) {
        return false
      }

      const userData = await verifyToken(token)
      if (!userData) {
        return false
      }

      setUser(userData)
      return true
    } catch (error) {
      console.error('Erro ao validar sessão:', error)
      return false
    } finally {
      setIsValidating(false)
    }
  }

  // Inicialização - verificar localStorage e validar token
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔄 Inicializando autenticação...')
        
        const token = localStorage.getItem("auth-token")
        const userData = localStorage.getItem("user-data")

        if (token && userData) {
          try {
            const parsedUser = JSON.parse(userData)
            console.log('✅ Dados encontrados no localStorage:', parsedUser.email)
            
            // Verificar se o token ainda é válido
            const validUser = await verifyToken(token)
            if (validUser) {
              setUser(validUser)
              console.log('✅ Token válido, usuário autenticado')
            } else {
              console.log('❌ Token inválido, limpando dados')
              localStorage.removeItem("auth-token")
              localStorage.removeItem("user-data")
            }
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
  }, [])

  // Função de login usando PostgreSQL
  const login = async (email: string, password: string, requiredRole?: string) => {
    try {
      setIsLoading(true)

      console.log('🔄 Fazendo login para:', email)

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
        phone: responseData.user.phone
      }

      setUser(authenticatedUser)
      localStorage.setItem("auth-token", responseData.token)
      localStorage.setItem("user-data", JSON.stringify(authenticatedUser))

      console.log('✅ Login realizado com sucesso')
    } catch (error: any) {
      console.error('❌ Erro no login:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
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
        isLoading,
        isValidating,
        getValidToken,
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
