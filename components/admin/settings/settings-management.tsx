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
import { Settings, Palette, Bike, CreditCard, Bell, Shield, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function SettingsManagement() {
  const [activeTab, setActiveTab] = useState("profile")
  const [settings, setSettings] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const { toast } = useToast()

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
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` })
    }
  }

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/settings", {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings || {})
      } else {
        // Log apenas em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.warn("Settings API não disponível, usando configurações padrão")
        }
        toast({
          title: "Aviso",
          description: "Algumas configurações podem não estar disponíveis",
          variant: "default",
        })
      }
    } catch (error) {
      // Log apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.error("Erro ao carregar configurações:", error)
      }
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações",
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
      // Log apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.error("Erro ao salvar configurações:", error)
      }
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
