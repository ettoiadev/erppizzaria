"use client"

import { useState, useEffect } from "react"
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { User, Mail, Phone, MapPin, Edit, Save, X, CheckCircle, AlertCircle, Shield } from "lucide-react"

export default function AccountPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  })

  // Carregar dados do usuário
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: formatPhone(user.phone || ""), // Formatar telefone ao carregar
      })
    }
  }, [user])

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Nome é obrigatório")
      return false
    }
    if (formData.name.trim().length < 2) {
      setError("Nome deve ter pelo menos 2 caracteres")
      return false
    }
    if (!formData.email.trim()) {
      setError("Email é obrigatório")
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Email inválido")
      return false
    }
    if (!formData.phone.trim()) {
      setError("Telefone é obrigatório")
      return false
    }
    const phoneNumbers = formData.phone.replace(/\D/g, "")
    if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
      setError("Telefone deve ter 10 ou 11 dígitos")
      return false
    }
    return true
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      if (!user?.id) {
        throw new Error("Usuário não identificado")
      }

      // Enviar telefone apenas com números para o backend
      const cleanPhone = formData.phone.replace(/\D/g, "")
      
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: cleanPhone, // Enviar apenas números
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erro ao atualizar dados")
      }

      console.log("Dados atualizados com sucesso:", result)

      // Atualizar formData com telefone formatado
      setFormData(prev => ({
        ...prev,
        phone: formatPhone(cleanPhone)
      }))

      setSuccess("Dados atualizados com sucesso!")
      setIsEditing(false)

      toast({
        title: "Dados atualizados",
        description: "Suas informações foram atualizadas com sucesso.",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Não foi possível atualizar os dados. Tente novamente."
      setError(errorMessage)
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: formatPhone(user.phone || ""), // Formatar telefone ao cancelar
      })
    }
    setIsEditing(false)
    setError("")
    setSuccess("")
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError("")
    if (success) setSuccess("")
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length === 0) return ""
    if (numbers.length <= 2) return `(${numbers}`
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dados da Conta</h1>
          <p className="text-gray-600">Gerencie suas informações pessoais</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informações Pessoais
              </CardTitle>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} disabled={isLoading}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              ) : (
                <div className="space-x-2">
                  <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={isLoading}>
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nome Completo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  disabled={!isEditing || isLoading}
                  placeholder="Seu nome completo"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  E-mail <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  disabled={!isEditing || isLoading}
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Telefone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value)
                  handleInputChange("phone", formatted)
                }}
                disabled={!isEditing || isLoading}
                placeholder="(11) 99999-9999"
                maxLength={15}
                required
              />
            </div>

            {/* Informações adicionais somente leitura */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Informações da Conta
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-600">ID da Conta</Label>
                  <p className="font-mono text-xs bg-gray-100 p-2 rounded">{user?.id}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Tipo de Conta</Label>
                  <p className="capitalize">
                    {user?.role?.toLowerCase() === 'customer' ? 'Cliente' : 
                     user?.role?.toLowerCase() === 'admin' ? 'Administrador' :
                     user?.role?.toLowerCase() === 'kitchen' ? 'Cozinha' :
                     user?.role?.toLowerCase() === 'delivery' ? 'Entregador' :
                     user?.role?.toLowerCase()}
                  </p>
                </div>
              </div>
            </div>

            {/* Links para outras seções */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações Relacionadas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" asChild className="justify-start">
                  <a href="/seguranca">
                    <Shield className="w-4 h-4 mr-2" />
                    Alterar Senha
                  </a>
                </Button>
                <Button variant="outline" asChild className="justify-start">
                  <a href="/conta/enderecos">
                    <MapPin className="w-4 h-4 mr-2" />
                    Gerenciar Endereços
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  )
}
