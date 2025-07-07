"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GeneralSettings } from "./general-settings"
import { AppearanceSettings } from "./appearance-settings"
import { DeliverySettings } from "./delivery-settings"
import { PaymentSettings } from "./payment-settings"
import { NotificationSettings } from "./notification-settings"
import { SecuritySettings } from "./security-settings"
import { AdminProfile } from "./admin-profile"
import { Settings, Palette, Bike, CreditCard, Bell, Shield, User, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function SettingsManagement() {
  const [activeTab, setActiveTab] = useState("profile")
  const [settings, setSettings] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [showDiagnostic, setShowDiagnostic] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    loadSettings()
  }, [])

  // Aviso antes de sair se houver mudanças não salvas
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const getAuthHeaders = () => {
    const token = localStorage.getItem("auth-token")
    console.log("🔑 Token encontrado:", !!token)
    console.log("👤 Usuário atual:", user)
    
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` })
    }
  }

  const runDiagnostic = async () => {
    try {
      const response = await fetch("/api/admin/debug", {
        headers: getAuthHeaders()
      })
      
      const data = await response.json()
      console.log("🔍 Diagnóstico completo:", data)
      
      toast({
        title: "Diagnóstico",
        description: "Verifique o console para detalhes completos",
      })
    } catch (error) {
      console.error("❌ Erro no diagnóstico:", error)
    }
  }

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      setAuthError(null)
      
      console.log("🔄 Carregando configurações...")
      console.log("👤 Usuário logado:", user)
      
      const headers = getAuthHeaders()
      console.log("📤 Headers enviados:", headers)
      
      const response = await fetch("/api/admin/settings", {
        headers
      })

      console.log("📥 Response status:", response.status)
      console.log("📥 Response ok:", response.ok)

      if (response.status === 401) {
        setAuthError("Token de autenticação inválido ou expirado. Faça login novamente.")
        toast({
          title: "Erro de Autenticação",
          description: "Token inválido ou expirado. Redirecionando para login...",
          variant: "destructive",
        })
        setTimeout(() => window.location.href = "/admin/login", 2000)
        return
      }

      if (response.status === 403) {
        setAuthError("Acesso negado. Você não tem permissão de administrador.")
        toast({
          title: "Acesso Negado",
          description: "Você não tem permissão para acessar esta área",
          variant: "destructive",
        })
        return
      }

      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings || {})
        console.log("✅ Configurações carregadas:", data.settings)
      } else {
        const errorText = await response.text()
        console.error("❌ Erro na resposta:", errorText)
        
        toast({
          title: "Erro",
          description: `Erro ${response.status}: Não foi possível carregar as configurações`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Erro ao carregar configurações:", error)
      setAuthError("Erro de conexão com o servidor")
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível conectar ao servidor",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async (newSettings: Record<string, any>): Promise<boolean> => {
    try {
      const mergedSettings = { ...settings, ...newSettings }

      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(mergedSettings),
      })

      if (response.ok) {
        setSettings(mergedSettings)
        setHasUnsavedChanges(false) // Limpar flag de mudanças não salvas
        toast({
          title: "Sucesso",
          description: "Configurações salvas com sucesso",
        })
        return true
      } else {
        const data = await response.json()
        toast({
          title: "Erro",
          description: data.message || "Erro ao salvar configurações",
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      console.error("❌ Erro ao salvar configurações:", error)
      toast({
        title: "Erro",
        description: "Erro de conexão ao salvar configurações",
        variant: "destructive",
      })
      return false
    }
  }

  // Função para marcar que há mudanças não salvas
  const markUnsavedChanges = () => {
    setHasUnsavedChanges(true)
  }

  const handleTabChange = (value: string) => {
    // Verificar se há mudanças não salvas antes de trocar de aba
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        "Você tem alterações não salvas. Deseja sair mesmo assim? As alterações serão perdidas."
      )
      if (!confirmLeave) {
        return
      }
      setHasUnsavedChanges(false)
    }
    setActiveTab(value)
  }

  // Se há erro de autenticação, mostrar interface de erro
  if (authError) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              Erro de Autenticação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-red-700">{authError}</p>
            
            <div className="flex gap-3">
              <Button 
                onClick={() => window.location.href = "/admin/login"}
                variant="destructive"
              >
                Ir para Login
              </Button>
              
              <Button 
                onClick={loadSettings}
                variant="outline"
              >
                Tentar Novamente
              </Button>
              
              <Button 
                onClick={() => setShowDiagnostic(!showDiagnostic)}
                variant="secondary"
              >
                {showDiagnostic ? "Ocultar" : "Mostrar"} Diagnóstico
              </Button>
            </div>

            {showDiagnostic && (
              <div className="bg-gray-100 p-4 rounded-lg text-sm">
                <h4 className="font-semibold mb-2">Informações de Debug:</h4>
                <ul className="space-y-1 text-gray-700">
                  <li><strong>Usuário:</strong> {user ? `${user.email} (${user.role})` : "Não logado"}</li>
                  <li><strong>Token:</strong> {localStorage.getItem("auth-token") ? "Presente" : "Ausente"}</li>
                  <li><strong>User Data:</strong> {localStorage.getItem("user-data") ? "Presente" : "Ausente"}</li>
                </ul>
                <Button 
                  onClick={runDiagnostic}
                  size="sm"
                  className="mt-3"
                >
                  Executar Diagnóstico Completo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600">Gerencie as configurações do sistema e seu perfil</p>
        {hasUnsavedChanges && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              ⚠️ Há alterações não salvas nesta seção
            </p>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Aparência
          </TabsTrigger>
          <TabsTrigger value="delivery" className="flex items-center gap-2">
            <Bike className="w-4 h-4" />
            Entrega
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Pagamento
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Segurança
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <AdminProfile />
        </TabsContent>

        <TabsContent value="general">
          <GeneralSettings 
            settings={settings} 
            onSave={saveSettings}
            onMarkUnsaved={markUnsavedChanges}
          />
        </TabsContent>

        <TabsContent value="appearance">
          <AppearanceSettings 
            settings={settings} 
            onSave={saveSettings}
            onMarkUnsaved={markUnsavedChanges}
          />
        </TabsContent>

        <TabsContent value="delivery">
          <DeliverySettings 
            settings={settings} 
            onSave={saveSettings}
            onMarkUnsaved={markUnsavedChanges}
          />
        </TabsContent>

        <TabsContent value="payment">
          <PaymentSettings 
            settings={settings} 
            onSave={saveSettings}
            onMarkUnsaved={markUnsavedChanges}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings 
            settings={settings} 
            onSave={saveSettings}
            onMarkUnsaved={markUnsavedChanges}
          />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySettings 
            settings={settings} 
            onSave={saveSettings}
            onMarkUnsaved={markUnsavedChanges}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
