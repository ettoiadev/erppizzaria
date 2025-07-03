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
  login: (email: string, password: string, requiredRole?: string) => Promise<void>
  logout: () => void
  register: (userData: any) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for stored auth token
    const token = localStorage.getItem("auth-token")
    const userData = localStorage.getItem("user-data")

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (error) {
        localStorage.removeItem("auth-token")
        localStorage.removeItem("user-data")
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string, requiredRole?: string) => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to login")
      }

      // Check if required role matches
      if (requiredRole === "admin" && data.user.role !== "admin") {
        throw new Error("Acesso negado. Apenas administradores podem acessar esta área.")
      }

      // Create user object matching our interface
      const authenticatedUser = {
        id: data.user.id,
        name: data.user.full_name || data.user.email.split("@")[0],
        email: data.user.email,
        role: data.user.role.toUpperCase() as "CUSTOMER" | "ADMIN" | "KITCHEN" | "DELIVERY",
      }

      setUser(authenticatedUser)
      localStorage.setItem("auth-token", data.token)
      localStorage.setItem("user-data", JSON.stringify(authenticatedUser))
    } catch (error) {
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
