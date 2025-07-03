"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Save, User, Key, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ProfileData {
  id: string
  email: string
  full_name: string
  role: string
  phone?: string
  created_at: string
  email_confirmed?: boolean
}

export function AdminProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const { toast } = useToast()

  const [profileForm, setProfileForm] = useState({
    full_name: "",
    phone: "",
  })

  const [originalProfileForm, setOriginalProfileForm] = useState({
    full_name: "",
    phone: "",
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  // Estados para validação
  const [validationErrors, setValidationErrors] = useState({
    phone: "",
    password: "",
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const getAuthHeaders = () => {
    const token = localStorage.getItem("auth-token")
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` })
    }
  }

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/profile", {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
        const formData = {
          full_name: data.profile.full_name || "",
          phone: data.profile.phone || "",
        }
        setProfileForm(formData)
        setOriginalProfileForm(formData)
      } else {
        const errorData = await response.json()
        toast({
          title: "Erro",
          description: errorData.message || "Erro ao carregar perfil",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro de conexão ao carregar perfil",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Função para formatar telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4,5})(\d{4})$/, '$1-$2')
    }
    return value
  }

  // Validação de telefone
  const validatePhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '')
    if (phone && (numbers.length < 10 || numbers.length > 11)) {
      return "Telefone deve ter 10 ou 11 dígitos"
    }
    return ""
  }

  const updateProfile = async () => {
    // Validações antes de enviar
    const phoneError = validatePhone(profileForm.phone)
    
    if (phoneError) {
      setValidationErrors(prev => ({ ...prev, phone: phoneError }))
      return
    }

    if (!profileForm.full_name.trim()) {
      toast({
        title: "Erro",
        description: "Nome completo é obrigatório",
        variant: "destructive",
      })
      return
    }

    setValidationErrors(prev => ({ ...prev, phone: "" }))

    try {
      setIsSaving(true)
      // Limpar telefone antes de enviar (remover formatação)
      const cleanPhone = profileForm.phone.replace(/\D/g, '')
      
      const response = await fetch("/api/admin/profile", {
        method: "PUT", // Corrigido para usar PUT conforme definido na API
        headers: getAuthHeaders(),
        body: JSON.stringify({
          full_name: profileForm.full_name.trim(),
          phone: cleanPhone
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
        // Atualizar dados originais após salvamento bem-sucedido
        const newFormData = {
          full_name: data.profile.full_name || "",
          phone: data.profile.phone || "",
        }
        setOriginalProfileForm(newFormData)
        setProfileForm(newFormData)
        
        toast({
          title: "Sucesso",
          description: "Perfil atualizado com sucesso",
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Erro",
          description: errorData.message || "Erro ao atualizar perfil",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro de conexão ao atualizar perfil",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const updatePassword = async () => {
    // Validações da senha
    if (!passwordForm.currentPassword) {
      toast({
        title: "Erro",
        description: "Senha atual é obrigatória",
        variant: "destructive",
      })
      return
    }

    if (!passwordForm.newPassword) {
      toast({
        title: "Erro",
        description: "Nova senha é obrigatória",
        variant: "destructive",
      })
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      })
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUpdatingPassword(true)
      const response = await fetch("/api/admin/password", {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      if (response.ok) {
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
        toast({
          title: "Sucesso",
          description: "Senha atualizada com sucesso",
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Erro",
          description: errorData.message || "Erro ao atualizar senha",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro de conexão ao atualizar senha",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleProfileInputChange = (field: string, value: string) => {
    if (field === "phone") {
      const formattedPhone = formatPhone(value)
      setProfileForm(prev => ({ ...prev, [field]: formattedPhone }))
      // Limpar erro de validação ao digitar
      const error = validatePhone(formattedPhone)
      setValidationErrors(prev => ({ ...prev, phone: error }))
    } else {
      setProfileForm(prev => ({ ...prev, [field]: value }))
    }
  }

  const handlePasswordInputChange = (field: string, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }))
  }

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }

  // Verificar se houve mudanças nos dados do perfil
  const hasProfileChanges = () => {
    return (
      profileForm.full_name !== originalProfileForm.full_name ||
      profileForm.phone !== originalProfileForm.phone
    )
  }

  // Verificar se os dados da senha estão preenchidos
  const hasPasswordData = () => {
    return passwordForm.currentPassword && passwordForm.newPassword && passwordForm.confirmPassword
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Informações do Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                value={profileForm.full_name}
                onChange={(e) => handleProfileInputChange("full_name", e.target.value)}
                disabled={isSaving}
                className={!profileForm.full_name.trim() ? "border-red-300" : ""}
              />
              {!profileForm.full_name.trim() && (
                <p className="text-sm text-red-600">Nome completo é obrigatório</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile?.email || ""}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={profileForm.phone}
                onChange={(e) => handleProfileInputChange("phone", e.target.value)}
                disabled={isSaving}
                placeholder="(11) 99999-9999"
                className={validationErrors.phone ? "border-red-300" : ""}
              />
              {validationErrors.phone && (
                <p className="text-sm text-red-600">{validationErrors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Input
                id="role"
                value={profile?.role || ""}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={updateProfile} 
              disabled={isSaving || !hasProfileChanges() || !profileForm.full_name.trim() || !!validationErrors.phone}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Alterar Senha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha Atual *</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) => handlePasswordInputChange("currentPassword", e.target.value)}
                  disabled={isUpdatingPassword}
                  className={!passwordForm.currentPassword && hasPasswordData() ? "border-red-300" : ""}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility("current")}
                  disabled={isUpdatingPassword}
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha *</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => handlePasswordInputChange("newPassword", e.target.value)}
                  disabled={isUpdatingPassword}
                  className={passwordForm.newPassword && passwordForm.newPassword.length < 6 ? "border-red-300" : ""}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility("new")}
                  disabled={isUpdatingPassword}
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {passwordForm.newPassword && passwordForm.newPassword.length < 6 && (
                <p className="text-sm text-red-600">A senha deve ter pelo menos 6 caracteres</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => handlePasswordInputChange("confirmPassword", e.target.value)}
                  disabled={isUpdatingPassword}
                  className={passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword ? "border-red-300" : ""}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility("confirm")}
                  disabled={isUpdatingPassword}
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                <p className="text-sm text-red-600">As senhas não coincidem</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={updatePassword} 
              disabled={
                isUpdatingPassword || 
                !passwordForm.currentPassword || 
                !passwordForm.newPassword || 
                !passwordForm.confirmPassword ||
                passwordForm.newPassword !== passwordForm.confirmPassword ||
                passwordForm.newPassword.length < 6
              }
              className="flex items-center gap-2"
            >
              <Key className="w-4 h-4" />
              {isUpdatingPassword ? "Atualizando..." : "Atualizar Senha"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
