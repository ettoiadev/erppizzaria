"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GeneralSettings } from "./general-settings"
import { AppearanceSettings } from "./appearance-settings"
import { DeliverySettings } from "./delivery-settings"
import { VisualDeliverySettings } from "./visual-delivery-settings"
import { PaymentSettings } from "./payment-settings"
import { NotificationSettings } from "./notification-settings"
import { SecuritySettings } from "./security-settings"
import { AdminProfile } from "./admin-profile"
import { GeolocationSettings } from "./geolocation-settings"
import { PrinterSettings } from "./printer-settings"
import { Settings, Palette, Bike, CreditCard, Bell, Shield, User, AlertTriangle, MapPin, Printer } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { useProtectedApi } from "@/hooks/use-protected-api"

interface AdminSettingsResponse {
  success: boolean
  settings: Record<string, any>
  count: number
}
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function SettingsManagement() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("profile")
  const [settings, setSettings] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [showDiagnostic, setShowDiagnostic] = useState(false)
  const { toast } = useToast()
  const { user, loading } = useAuth()
  const api = useProtectedApi()

  // Definir aba inicial baseada na URL
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['profile', 'general', 'appearance', 'delivery', 'payment', 'geolocation', 'printer', 'notifications', 'security'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

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

  const runDiagnostic = async () => {
    try {
      const response = await api.callApi("/api/admin/debug")
      if (response.error) {
        throw new Error(response.error)
      }
      console.log("🔍 Diagnóstico completo:", response.data)
      
      toast({
        title: "Diagnóstico",
        description: "Verifique o console para detalhes completos",
      })
    } catch (error) {
      console.error("❌ Erro no diagnóstico:", error)
      toast({
        title: "Erro no Diagnóstico",
        description: "Não foi possível executar o diagnóstico",
        variant: "destructive",
      })
    }
  }

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      setAuthError(null)
      
      console.log("🔄 Carregando configurações...")
      
      const response = await api.callApi<AdminSettingsResponse>("/api/admin/settings")
      if (response.error) {
        throw new Error(response.error)
      }
      
      setSettings(response.data?.settings || {})
      console.log("✅ Configurações carregadas:", response.data?.settings)
      
    } catch (error: any) {
      console.error("❌ Erro ao carregar configurações:", error)
      
      if (error.message.includes('session_expired') || error.message.includes('Sessão expirada')) {
        setAuthError("Sessão expirada. Redirecionando para login...")
        // O hook já faz o redirecionamento
      } else if (error.message.includes('HTTP 403')) {
        setAuthError("Acesso negado. Você não tem permissão de administrador.")
      } else {
        setAuthError("Erro de conexão com o servidor")
      }
      
      toast({
        title: "Erro ao Carregar Configurações",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async (newSettings: Record<string, any>): Promise<boolean> => {
    try {
      const mergedSettings = { ...settings, ...newSettings }

      const response = await api.callApi("/api/admin/settings", {
        method: 'POST',
        body: mergedSettings
      })
      
      if (!response.error) {
        setSettings(mergedSettings)
        setHasUnsavedChanges(false)
        toast({
          title: "Sucesso",
          description: "Configurações salvas com sucesso",
        })
        return true
      } else {
        toast({
          title: "Erro",
          description: response.error || "Erro ao salvar configurações",
          variant: "destructive",
        })
        return false
      }
    } catch (error: any) {
      console.error("❌ Erro ao salvar configurações:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar configurações",
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

  // Se está validando sessão ou há erro de autenticação, mostrar interface de erro
  if (loading || authError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              {loading ? "Validando Sessão..." : "Problema de Autenticação"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-muted-foreground">
                Verificando sua sessão de administrador...
              </p>
            ) : (
              <>
                <p className="text-red-600 font-medium">{authError}</p>
                <div className="flex gap-2">
                  <Button onClick={() => window.location.reload()} variant="outline">
                    Tentar Novamente
                  </Button>
                  <Button onClick={() => window.location.href = "/admin/login"}>
                    Ir para Login
                  </Button>
                  <Button onClick={() => setShowDiagnostic(!showDiagnostic)} variant="secondary">
                    {showDiagnostic ? "Ocultar" : "Mostrar"} Diagnóstico
                  </Button>
                </div>
                {showDiagnostic && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Diagnóstico:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Usuário logado: {user ? `${user.email} (${user.role})` : "Nenhum"}</li>
                      <li>• Token no localStorage: {localStorage.getItem("auth-token") ? "Presente" : "Ausente"}</li>
                      <li>• URL atual: {window.location.href}</li>
                    </ul>
                    <Button onClick={runDiagnostic} size="sm" className="mt-2">
                      Executar Diagnóstico Completo
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Carregando configurações...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {hasUnsavedChanges && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Você tem alterações não salvas</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-9">
          <TabsTrigger value="profile" className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-1">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-1">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Visual</span>
          </TabsTrigger>
          <TabsTrigger value="delivery" className="flex items-center gap-1">
            <Bike className="w-4 h-4" />
            <span className="hidden sm:inline">Entrega</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-1">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Pagamento</span>
          </TabsTrigger>
          <TabsTrigger value="geolocation" className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">Geolocalização</span>
          </TabsTrigger>
          <TabsTrigger value="printer" className="flex items-center gap-1">
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Impressora</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Segurança</span>
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
          <VisualDeliverySettings 
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

        <TabsContent value="geolocation">
          <GeolocationSettings 
            settings={settings} 
            onSave={saveSettings}
            onMarkUnsaved={markUnsavedChanges}
          />
        </TabsContent>

        <TabsContent value="printer">
          <PrinterSettings 
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
