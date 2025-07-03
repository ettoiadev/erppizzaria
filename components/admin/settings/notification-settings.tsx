"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Save, Bell, Mail, Smartphone, MessageSquare } from "lucide-react"

interface NotificationSettingsProps {
  settings: Record<string, any>
  onSave: (settings: Record<string, any>) => Promise<boolean>
}

export function NotificationSettings({ settings: initialSettings, onSave }: NotificationSettingsProps) {
  const [settings, setSettings] = useState({
    emailNotifications: initialSettings.emailNotifications ?? true,
    smsNotifications: initialSettings.smsNotifications ?? false,
    pushNotifications: initialSettings.pushNotifications ?? true,
    whatsappNotifications: initialSettings.whatsappNotifications ?? false,
    newOrderNotification: initialSettings.newOrderNotification ?? true,
    orderStatusNotification: initialSettings.orderStatusNotification ?? true,
    lowStockNotification: initialSettings.lowStockNotification ?? true,
    dailyReportNotification: initialSettings.dailyReportNotification ?? true,
    smtpHost: initialSettings.smtpHost || "smtp.gmail.com",
    smtpPort: initialSettings.smtpPort || 587,
    smtpUser: initialSettings.smtpUser || "",
    smtpPassword: initialSettings.smtpPassword || "",
    twilioAccountSid: initialSettings.twilioAccountSid || "",
    twilioAuthToken: initialSettings.twilioAuthToken || "",
    whatsappApiKey: initialSettings.whatsappApiKey || "",
  })

  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      console.log("Saving notification settings:", settings)
      await onSave(settings)
    } catch (error) {
      console.error("Error saving notification settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Notificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="w-6 h-6 text-blue-600" />
                <div>
                  <Label>Notificações por Email</Label>
                  <p className="text-sm text-gray-600">Receba notificações por email</p>
                </div>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleInputChange("emailNotifications", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="w-6 h-6 text-green-600" />
                <div>
                  <Label>Notificações por SMS</Label>
                  <p className="text-sm text-gray-600">Receba notificações por SMS</p>
                </div>
              </div>
              <Switch
                checked={settings.smsNotifications}
                onCheckedChange={(checked) => handleInputChange("smsNotifications", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6 text-purple-600" />
                <div>
                  <Label>Notificações Push</Label>
                  <p className="text-sm text-gray-600">Notificações no navegador</p>
                </div>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => handleInputChange("pushNotifications", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-green-500" />
                <div>
                  <Label>Notificações WhatsApp</Label>
                  <p className="text-sm text-gray-600">Receba notificações via WhatsApp</p>
                </div>
              </div>
              <Switch
                checked={settings.whatsappNotifications}
                onCheckedChange={(checked) => handleInputChange("whatsappNotifications", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Eventos de Notificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Novos Pedidos</Label>
                <p className="text-sm text-gray-600">Notificar quando um novo pedido for recebido</p>
              </div>
              <Switch
                checked={settings.newOrderNotification}
                onCheckedChange={(checked) => handleInputChange("newOrderNotification", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Mudança de Status do Pedido</Label>
                <p className="text-sm text-gray-600">Notificar quando o status de um pedido mudar</p>
              </div>
              <Switch
                checked={settings.orderStatusNotification}
                onCheckedChange={(checked) => handleInputChange("orderStatusNotification", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Estoque Baixo</Label>
                <p className="text-sm text-gray-600">Notificar quando produtos estiverem com estoque baixo</p>
              </div>
              <Switch
                checked={settings.lowStockNotification}
                onCheckedChange={(checked) => handleInputChange("lowStockNotification", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Relatório Diário</Label>
                <p className="text-sm text-gray-600">Receber relatório diário de vendas</p>
              </div>
              <Switch
                checked={settings.dailyReportNotification}
                onCheckedChange={(checked) => handleInputChange("dailyReportNotification", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configurações de Email (SMTP)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtpHost">Servidor SMTP</Label>
              <Input
                id="smtpHost"
                value={settings.smtpHost}
                onChange={(e) => handleInputChange("smtpHost", e.target.value)}
                placeholder="smtp.gmail.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtpPort">Porta SMTP</Label>
              <Input
                id="smtpPort"
                type="number"
                value={settings.smtpPort}
                onChange={(e) => handleInputChange("smtpPort", Number.parseInt(e.target.value))}
                placeholder="587"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtpUser">Usuário SMTP</Label>
              <Input
                id="smtpUser"
                type="email"
                value={settings.smtpUser}
                onChange={(e) => handleInputChange("smtpUser", e.target.value)}
                placeholder="seu@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtpPassword">Senha SMTP</Label>
              <Input
                id="smtpPassword"
                type="password"
                value={settings.smtpPassword}
                onChange={(e) => handleInputChange("smtpPassword", e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  )
}
