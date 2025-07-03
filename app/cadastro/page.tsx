"use client"

import React from "react"
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
import { AddressInput } from "@/components/ui/address-input"
import { Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    address: {
      zipCode: "",
      street: "",
      neighborhood: "",
      city: "",
      state: "",
      number: "",
      complement: "",
    },
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { register, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (user) {
      router.push("/cardapio")
    }
  }, [user, router])

  // Mostrar mensagem de sucesso se vier da URL
  React.useEffect(() => {
    const message = searchParams.get("message")
    if (message) {
      setSuccess(message)
    }
  }, [searchParams])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError("")
    if (success) setSuccess("")
  }

  const handleAddressChange = (address: any) => {
    setFormData((prev) => ({ ...prev, address }))
    if (error) setError("")
  }

  const validateForm = () => {
    // Validação de nome
    if (!formData.name.trim()) {
      setError("Nome é obrigatório")
      return false
    }
    if (formData.name.trim().length < 2) {
      setError("Nome deve ter pelo menos 2 caracteres")
      return false
    }

    // Validação de email
    if (!formData.email.trim()) {
      setError("Email é obrigatório")
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Email inválido")
      return false
    }

    // Validação de telefone
    if (!formData.phone.trim()) {
      setError("Telefone é obrigatório")
      return false
    }
    const phoneNumbers = formData.phone.replace(/\D/g, "")
    if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
      setError("Telefone deve ter 10 ou 11 dígitos")
      return false
    }

    // Validação de senha
    if (formData.password.length < 6) {
      setError("Senha deve ter pelo menos 6 caracteres")
      return false
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])|(?=.*\d)/.test(formData.password)) {
      setError("Senha deve conter pelo menos uma letra maiúscula e uma minúscula, ou um número")
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Senhas não coincidem")
      return false
    }

    // Validação de endereço
    if (!formData.address.zipCode.trim()) {
      setError("CEP é obrigatório")
      return false
    }
    if (!formData.address.street.trim()) {
      setError("Rua é obrigatória")
      return false
    }
    if (!formData.address.neighborhood.trim()) {
      setError("Bairro é obrigatório")
      return false
    }
    if (!formData.address.city.trim()) {
      setError("Cidade é obrigatória")
      return false
    }
    if (!formData.address.state.trim()) {
      setError("Estado é obrigatório")
      return false
    }
    if (!formData.address.number.trim()) {
      setError("Número é obrigatório")
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
      // Prepare payload for registration
      const payload = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        full_name: formData.name.trim(),
      }

      console.log("Registering user with payload:", { ...payload, password: "[HIDDEN]" })

      // Use AuthContext register method for automatic login and redirect
      await register(payload)

      setSuccess("Conta criada com sucesso! Redirecionando para o cardápio...")

      // Wait a bit to show success message, then redirect
      setTimeout(() => {
        router.push("/cardapio")
      }, 1500)
    } catch (error: any) {
      console.error("Registration error:", error)
      setError(error.message || "Erro ao criar conta. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 text-center">Criar Conta</h1>
            <p className="text-gray-600 text-center mt-2">Cadastre-se para fazer seus pedidos</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
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

                {/* Personal Information */}
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo *</Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Seu nome completo"
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", formatPhone(e.target.value))}
                        placeholder="(11) 99999-9999"
                        required
                        disabled={isLoading}
                        maxLength={15}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="seu@email.com"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          required
                          disabled={isLoading}
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

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                          placeholder="Confirme sua senha"
                          required
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={isLoading}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Endereço de Entrega</h3>
                  <AddressInput value={formData.address} onChange={handleAddressChange} required />
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? "Criando conta..." : "Criar Conta"}
                </Button>

                <div className="text-center text-sm text-gray-600">
                  Já tem uma conta?{" "}
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    Faça login
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
