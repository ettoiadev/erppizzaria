"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Save, CreditCard, Banknote, QrCode, Smartphone } from "lucide-react"

interface PaymentSettingsProps {
  settings: Record<string, any>
  onSave: (settings: Record<string, any>) => Promise<boolean>
  onMarkUnsaved?: () => void
}

export function PaymentSettings({ settings: initialSettings, onSave, onMarkUnsaved }: PaymentSettingsProps) {
  const [settings, setSettings] = useState({
    pixEnabled: initialSettings.pixEnabled ?? true,
    pixKey: initialSettings.pixKey || "12996367326",
    cashEnabled: initialSettings.cashEnabled ?? true,
    cardOnDeliveryEnabled: initialSettings.cardOnDeliveryEnabled ?? true,
    creditCardEnabled: initialSettings.creditCardEnabled ?? false,
    debitCardEnabled: initialSettings.debitCardEnabled ?? false,
    stripePublicKey: initialSettings.stripePublicKey || "",
    stripeSecretKey: initialSettings.stripeSecretKey || "",
    mercadoPagoAccessToken: initialSettings.mercadoPagoAccessToken || "",
    paypalClientId: initialSettings.paypalClientId || "",
  })

  const [originalSettings, setOriginalSettings] = useState(settings)
  const [isLoading, setIsLoading] = useState(false)

  // Atualizar configurações quando props mudarem
  useEffect(() => {
    if (initialSettings && Object.keys(initialSettings).length > 0) {
      const mergedSettings = { ...settings, ...initialSettings }
      setSettings(mergedSettings)
      setOriginalSettings(mergedSettings)
    }
  }, [initialSettings])

  // Verificar se houve mudanças
  const hasChanges = () => {
    return JSON.stringify(settings) !== JSON.stringify(originalSettings)
  }

  // Validação da chave PIX
  const validatePixKey = (key: string) => {
    if (!key) return true // Opcional
    // Validação básica - pode ser CPF, CNPJ, email ou telefone
    const cpfRegex = /^\d{11}$/
    const cnpjRegex = /^\d{14}$/
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phoneRegex = /^\d{10,11}$/
    
    return cpfRegex.test(key) || cnpjRegex.test(key) || emailRegex.test(key) || phoneRegex.test(key)
  }

  // Validação das chaves Stripe
  const validateStripePublicKey = (key: string) => {
    if (!key) return true // Opcional
    return key.startsWith('pk_') && key.length > 10
  }

  const validateStripeSecretKey = (key: string) => {
    if (!key) return true // Opcional
    return key.startsWith('sk_') && key.length > 10
  }

  // Validação do token Mercado Pago
  const validateMercadoPagoToken = (token: string) => {
    if (!token) return true // Opcional
    return token.startsWith('APP_USR-') && token.length > 20
  }

  // Validação do PayPal Client ID
  const validatePayPalClientId = (id: string) => {
    if (!id) return true // Opcional
    return id.length > 10 && /^[A-Za-z0-9_-]+$/.test(id)
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [field]: value }
      
      // Marcar como não salvo se houve mudança
      setTimeout(() => {
        if (onMarkUnsaved && JSON.stringify(newSettings) !== JSON.stringify(originalSettings)) {
          onMarkUnsaved()
        }
      }, 0)
      
      return newSettings
    })
  }

  const handleSave = async () => {
    // Validar todas as configurações
    if (settings.pixEnabled && !validatePixKey(settings.pixKey)) {
      return
    }
    if (!validateStripePublicKey(settings.stripePublicKey)) {
      return
    }
    if (!validateStripeSecretKey(settings.stripeSecretKey)) {
      return
    }
    if (!validateMercadoPagoToken(settings.mercadoPagoAccessToken)) {
      return
    }
    if (!validatePayPalClientId(settings.paypalClientId)) {
      return
    }

    setIsLoading(true)
    try {
      console.log("Saving payment settings:", settings)
      const success = await onSave(settings)
      
      if (success) {
        // Atualizar configurações originais após salvamento bem-sucedido
        setOriginalSettings({ ...settings })
      }
    } catch (error) {
      console.error("Error saving payment settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Verificar se pode salvar
  const canSave = () => {
    if (!hasChanges()) return false
    if (settings.pixEnabled && !validatePixKey(settings.pixKey)) return false
    if (!validateStripePublicKey(settings.stripePublicKey)) return false
    if (!validateStripeSecretKey(settings.stripeSecretKey)) return false
    if (!validateMercadoPagoToken(settings.mercadoPagoAccessToken)) return false
    if (!validatePayPalClientId(settings.paypalClientId)) return false
    return true
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Métodos de Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <QrCode className="w-6 h-6 text-blue-600" />
                <div>
                  <Label>PIX</Label>
                  <p className="text-sm text-gray-600">Pagamento após confirmação manual</p>
                </div>
              </div>
              <Switch
                checked={Boolean(settings.pixEnabled)}
                onCheckedChange={(checked) => handleInputChange("pixEnabled", checked)}
              />
            </div>

            {settings.pixEnabled && (
              <div className="ml-9 space-y-2">
                <Label htmlFor="pixKey">Chave PIX *</Label>
                <Input
                  id="pixKey"
                  value={settings.pixKey}
                  onChange={(e) => handleInputChange("pixKey", e.target.value)}
                  placeholder="CPF, CNPJ, email ou telefone"
                  className={!validatePixKey(settings.pixKey) ? "border-red-300" : ""}
                />
                {!validatePixKey(settings.pixKey) && (
                  <p className="text-sm text-red-600">Chave PIX inválida. Use CPF, CNPJ, email ou telefone.</p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Banknote className="w-6 h-6 text-green-600" />
                <div>
                  <Label>Dinheiro na Entrega</Label>
                  <p className="text-sm text-gray-600">Pagamento em espécie na entrega</p>
                </div>
              </div>
              <Switch
                checked={Boolean(settings.cashEnabled)}
                onCheckedChange={(checked) => handleInputChange("cashEnabled", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-purple-600" />
                <div>
                  <Label>Cartão na Entrega</Label>
                  <p className="text-sm text-gray-600">Débito ou crédito na entrega</p>
                </div>
              </div>
              <Switch
                checked={Boolean(settings.cardOnDeliveryEnabled)}
                onCheckedChange={(checked) => handleInputChange("cardOnDeliveryEnabled", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pagamentos Online</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-blue-600" />
                <div>
                  <Label>Cartão de Crédito Online</Label>
                  <p className="text-sm text-gray-600">Pagamento online com cartão de crédito</p>
                </div>
              </div>
              <Switch
                checked={Boolean(settings.creditCardEnabled)}
                onCheckedChange={(checked) => handleInputChange("creditCardEnabled", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="w-6 h-6 text-orange-600" />
                <div>
                  <Label>Cartão de Débito Online</Label>
                  <p className="text-sm text-gray-600">Pagamento online com cartão de débito</p>
                </div>
              </div>
              <Switch
                checked={Boolean(settings.debitCardEnabled)}
                onCheckedChange={(checked) => handleInputChange("debitCardEnabled", checked)}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium text-lg">Configurações de Gateway</h4>
            <p className="text-sm text-gray-600">Configure suas chaves de integração com os gateways de pagamento.</p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stripePublicKey">Stripe - Chave Pública</Label>
                <Input
                  id="stripePublicKey"
                  value={settings.stripePublicKey}
                  onChange={(e) => handleInputChange("stripePublicKey", e.target.value)}
                  placeholder="pk_test_..."
                  className={!validateStripePublicKey(settings.stripePublicKey) ? "border-red-300" : ""}
                />
                {!validateStripePublicKey(settings.stripePublicKey) && (
                  <p className="text-sm text-red-600">Chave pública inválida. Deve começar com 'pk_'</p>
                )}
                <p className="text-xs text-gray-500">Chave pública para processar pagamentos com Stripe</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stripeSecretKey">Stripe - Chave Secreta</Label>
                <Input
                  id="stripeSecretKey"
                  type="password"
                  value={settings.stripeSecretKey}
                  onChange={(e) => handleInputChange("stripeSecretKey", e.target.value)}
                  placeholder="sk_test_..."
                  className={!validateStripeSecretKey(settings.stripeSecretKey) ? "border-red-300" : ""}
                />
                {!validateStripeSecretKey(settings.stripeSecretKey) && (
                  <p className="text-sm text-red-600">Chave secreta inválida. Deve começar com 'sk_'</p>
                )}
                <p className="text-xs text-gray-500">Chave secreta para autenticar com a API do Stripe</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mercadoPagoAccessToken">Mercado Pago - Access Token</Label>
                <Input
                  id="mercadoPagoAccessToken"
                  type="password"
                  value={settings.mercadoPagoAccessToken}
                  onChange={(e) => handleInputChange("mercadoPagoAccessToken", e.target.value)}
                  placeholder="APP_USR-..."
                  className={!validateMercadoPagoToken(settings.mercadoPagoAccessToken) ? "border-red-300" : ""}
                />
                {!validateMercadoPagoToken(settings.mercadoPagoAccessToken) && (
                  <p className="text-sm text-red-600">Token inválido. Deve começar com 'APP_USR-'</p>
                )}
                <p className="text-xs text-gray-500">Token de acesso para integração com Mercado Pago</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paypalClientId">PayPal - Client ID</Label>
                <Input
                  id="paypalClientId"
                  value={settings.paypalClientId}
                  onChange={(e) => handleInputChange("paypalClientId", e.target.value)}
                  placeholder="AY..."
                  className={!validatePayPalClientId(settings.paypalClientId) ? "border-red-300" : ""}
                />
                {!validatePayPalClientId(settings.paypalClientId) && (
                  <p className="text-sm text-red-600">Client ID inválido. Deve conter apenas letras, números, _ e -</p>
                )}
                <p className="text-xs text-gray-500">ID do cliente para integração com PayPal</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading || !canSave()}>
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  )
}
