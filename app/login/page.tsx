"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Header } from "@/components/layout/header"
import { Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Mostrar mensagem de sucesso se vier da URL
  useEffect(() => {
    const message = searchParams.get("message")
    if (message) {
      setSuccess(message)
    }
  }, [searchParams])

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (user) {
      const redirectUrl = searchParams.get("redirect")
      const targetUrl = redirectUrl ? decodeURIComponent(redirectUrl) : "/cardapio"
      router.push(targetUrl)
    }
  }, [user, router, searchParams])

  const validateForm = () => {
    if (!email.trim()) {
      setError("Email é obrigatório")
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Email inválido")
      return false
    }
    if (!password) {
      setError("Senha é obrigatória")
      return false
    }
    if (password.length < 6) {
      setError("Senha deve ter pelo menos 6 caracteres")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      console.log("Attempting login for:", email)
      await login(email.trim().toLowerCase(), password)

      setSuccess("Login realizado com sucesso! Redirecionando...")

      // Pequeno delay para mostrar mensagem de sucesso, depois redirecionar
      setTimeout(() => {
        const redirectUrl = searchParams.get("redirect")
        const targetUrl = redirectUrl ? decodeURIComponent(redirectUrl) : "/cardapio"
        console.log("Redirecionando após login para:", targetUrl)
        router.push(targetUrl)
      }, 1000)
    } catch (error: any) {
      console.error("Login error:", error)
      setError(error.message || "Email ou senha inválidos")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: "email" | "password", value: string) => {
    if (field === "email") {
      setEmail(value)
    } else {
      setPassword(value)
    }

    // Limpar mensagens ao digitar
    if (error) setError("")
    if (success) setSuccess("")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 text-center">Entrar</h1>
            <p className="text-gray-600 text-center mt-2">Acesse sua conta para fazer pedidos</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">Login</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="seu@email.com"
                    required
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      placeholder="Sua senha"
                      required
                      disabled={isLoading}
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="text-right">
                  <Link href="/esqueci-senha" className="text-sm text-primary hover:underline">
                    Esqueci minha senha
                  </Link>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>

                <div className="text-center text-sm text-gray-600">
                  Não tem uma conta?{" "}
                  <Link href="/cadastro" className="text-primary hover:underline font-medium">
                    Cadastre-se
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
