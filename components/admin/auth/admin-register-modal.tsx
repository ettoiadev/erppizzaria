"use client"



import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, UserPlus } from "lucide-react"

interface AdminRegisterModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AdminRegisterModal({ isOpen, onClose, onSuccess }: AdminRegisterModalProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [registrationAllowed, setRegistrationAllowed] = useState<boolean | null>(null)

  // Check if admin registration is allowed when modal opens
  useEffect(() => {
    if (isOpen) {
      checkRegistrationStatus()
    }
  }, [isOpen])

  const checkRegistrationStatus = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      if (response.ok) {
        const settings = await response.json()
        setRegistrationAllowed(settings.allowAdminRegistration === true || settings.allowAdminRegistration === "true")
      } else {
        // If settings can't be loaded, assume registration is allowed (default behavior)
        setRegistrationAllowed(true)
      }
    } catch (error) {
      console.error("Error checking registration status:", error)
      // On error, assume registration is allowed (default behavior)
      setRegistrationAllowed(true)
    }
  }

  // Rest of the existing component code remains the same...
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
    setSuccess("")
  }

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      setError("Nome é obrigatório")
      return false
    }

    if (!formData.email.trim()) {
      setError("Email é obrigatório")
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Email inválido")
      return false
    }

    if (!formData.password) {
      setError("Senha é obrigatória")
      return false
    }

    if (formData.password.length < 6) {
      setError("Senha deve ter pelo menos 6 caracteres")
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Senhas não coincidem")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!registrationAllowed) {
      setError("O cadastro de administradores está desabilitado")
      return
    }

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/admin/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: formData.full_name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao criar conta de administrador")
        return
      }

      setSuccess("Conta de administrador criada com sucesso!")

      // Reset form
      setFormData({
        full_name: "",
        email: "",
        password: "",
        confirmPassword: "",
      })

      // Close modal after a short delay
      setTimeout(() => {
        onSuccess()
        setSuccess("")
      }, 2000)
    } catch (error) {
      console.error("Registration error:", error)
      setError("Erro interno do servidor")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        full_name: "",
        email: "",
        password: "",
        confirmPassword: "",
      })
      setError("")
      setSuccess("")
      setRegistrationAllowed(null)
      onClose()
    }
  }

  // Show loading while checking registration status
  if (registrationAllowed === null) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Criar Conta de Administrador
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Criar Conta de Administrador
          </DialogTitle>
        </DialogHeader>

        {!registrationAllowed ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                O cadastro de administradores está desabilitado. Entre em contato com um administrador existente para
                habilitar esta funcionalidade.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end">
              <Button onClick={handleClose} variant="outline">
                Fechar
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription className="text-green-600">{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => handleInputChange("full_name", e.target.value)}
                placeholder="Digite seu nome completo"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Digite seu email"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="Digite sua senha"
                  disabled={isLoading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  placeholder="Confirme sua senha"
                  disabled={isLoading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Criando..." : "Criar Conta"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
