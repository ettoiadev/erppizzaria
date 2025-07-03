"use client"


import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Upload, Save, MapPin, Phone, Mail, Clock, X, Zap, Bike } from "lucide-react"

interface GeneralSettingsProps {
  settings: Record<string, any>
  onSave: (settings: Record<string, any>) => Promise<boolean>
  onMarkUnsaved?: () => void
}

export function GeneralSettings({ settings: initialSettings, onSave, onMarkUnsaved }: GeneralSettingsProps) {
  const [settings, setSettings] = useState({
    restaurant_name: "William Disk Pizza",
    description: "A melhor pizza da cidade, entregue na sua porta",
    restaurant_address: "Rua das Pizzas, 123 - Centro, São Paulo/SP",
    restaurant_phone: "(11) 99999-9999",
    email: "contato@williamdiskpizza.com",
    website: "www.williamdiskpizza.com",
    logo_url: "",
    openingHours: "18:00",
    closingHours: "23:00",
    isOpen: true,
    acceptOrders: true,
    min_order_value: 25.0,
    delivery_fee: 5.0,
    delivery_time: 45,
    logo: null as File | null,
    // Landing page hero image
    heroImage: null as File | null,
    // Feature boxes
    fastDeliveryEnabled: true,
    fastDeliveryTitle: "Super Rápido",
    fastDeliverySubtext: "Entrega expressa em até 30 minutos ou sua pizza é grátis",
    freeDeliveryEnabled: true,
    freeDeliveryTitle: "Frete Grátis",
    freeDeliverySubtext: "Entrega gratuita para pedidos acima de R$ 50,00",
    ...initialSettings
  })

  const [originalSettings, setOriginalSettings] = useState(settings)
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessingHeroImage, setIsProcessingHeroImage] = useState(false)
  const [validationErrors, setValidationErrors] = useState({
    email: "",
    restaurant_phone: "",
    website: "",
  })

  useEffect(() => {
    if (initialSettings && Object.keys(initialSettings).length > 0) {
      const mergedSettings = { ...settings, ...initialSettings }
      setSettings(mergedSettings)
      setOriginalSettings(mergedSettings)
    }
  }, [initialSettings])

  // Função para validar email
  const validateEmail = (email: string) => {
    if (!email) return ""
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) ? "" : "Formato de email inválido"
  }

  // Função para validar telefone
  const validatePhone = (phone: string) => {
    if (!phone) return ""
    const numbers = phone.replace(/\D/g, '')
    return numbers.length >= 10 && numbers.length <= 11 ? "" : "Telefone deve ter 10 ou 11 dígitos"
  }

  // Função para validar website
  const validateWebsite = (website: string) => {
    if (!website) return ""
    const websiteRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
    return websiteRegex.test(website) ? "" : "Formato de website inválido"
  }

  // Verificar se houve mudanças
  const hasChanges = () => {
    const currentSettings = { ...settings }
    delete (currentSettings as any).logo
    delete (currentSettings as any).heroImage
    
    const original = { ...originalSettings }
    delete (original as any).logo
    delete (original as any).heroImage
    
    return JSON.stringify(currentSettings) !== JSON.stringify(original)
  }

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [field]: value }
      
      // Validações em tempo real
      if (field === "email") {
        const error = validateEmail(value as string)
        setValidationErrors(prev => ({ ...prev, email: error }))
      } else if (field === "restaurant_phone") {
        const error = validatePhone(value as string)
        setValidationErrors(prev => ({ ...prev, restaurant_phone: error }))
      } else if (field === "website") {
        const error = validateWebsite(value as string)
        setValidationErrors(prev => ({ ...prev, website: error }))
      }
      
      // Marcar como não salvo se houve mudança
      setTimeout(() => {
        if (onMarkUnsaved && hasChanges()) {
          onMarkUnsaved()
        }
      }, 0)
      
      return newSettings
    })
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSettings((prev) => ({ ...prev, logo: file }))
      if (onMarkUnsaved) onMarkUnsaved()
    }
  }

  const processImage = async (file: File, targetWidth: number, targetHeight: number): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")

          if (!ctx) {
            reject(new Error("Could not get canvas context"))
            return
          }

          canvas.width = targetWidth
          canvas.height = targetHeight

          // Calculate dimensions for center cropping
          const sourceAspectRatio = img.width / img.height
          const targetAspectRatio = targetWidth / targetHeight

          let sourceWidth, sourceHeight, sourceX, sourceY

          if (sourceAspectRatio > targetAspectRatio) {
            // Image is wider than target, crop width
            sourceHeight = img.height
            sourceWidth = img.height * targetAspectRatio
            sourceX = (img.width - sourceWidth) / 2
            sourceY = 0
          } else {
            // Image is taller than target, crop height
            sourceWidth = img.width
            sourceHeight = img.width / targetAspectRatio
            sourceX = 0
            sourceY = (img.height - sourceHeight) / 2
          }

          // Draw the cropped and resized image
          ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight)

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const processedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                })
                resolve(processedFile)
              } else {
                reject(new Error("Could not process image"))
              }
            },
            "image/jpeg",
            0.9,
          )
        }
        img.onerror = () => reject(new Error("Could not load image"))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error("Could not read file"))
      reader.readAsDataURL(file)
    })
  }

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsProcessingHeroImage(true)
      try {
        // Process image to 800x600 for hero section
        const processedFile = await processImage(file, 660, 660)
        setSettings((prev) => ({ ...prev, heroImage: processedFile }))
        if (onMarkUnsaved) onMarkUnsaved()
      } catch (error) {
        console.error("Error processing hero image:", error)
      } finally {
        setIsProcessingHeroImage(false)
      }
    }
  }

  const removeHeroImage = () => {
    setSettings((prev) => ({ ...prev, heroImage: null }))
    if (onMarkUnsaved) onMarkUnsaved()
  }

  const handleSave = async () => {
    // Validar antes de salvar
    const emailError = validateEmail(settings.email)
    const phoneError = validatePhone(settings.restaurant_phone)
    const websiteError = validateWebsite(settings.website)

    setValidationErrors({
      email: emailError,
      restaurant_phone: phoneError,
      website: websiteError,
    })

    if (emailError || phoneError || websiteError) {
      return
    }

    // Validações obrigatórias
    if (!settings.restaurant_name?.trim()) {
      alert("Nome da empresa é obrigatório")
      return
    }

    setIsLoading(true)
    try {
      // Filtrar apenas as configurações que devem ser salvas (excluir files)
      const { logo, heroImage, ...settingsToSave } = settings
      
      // Se há um novo logo para fazer upload
      if (logo) {
        try {
          const logoFormData = new FormData()
          logoFormData.append('file', logo)
          
          const logoResponse = await fetch('/api/upload', {
            method: 'POST',
            body: logoFormData
          })
          
          if (logoResponse.ok) {
            const logoResult = await logoResponse.json()
            if (logoResult.url) {
              settingsToSave.logo_url = logoResult.url
            }
          }
        } catch (logoError) {
          console.error("Error uploading logo:", logoError)
        }
      }
      
      console.log("Saving general settings:", settingsToSave)
      const success = await onSave(settingsToSave)
      
      if (success) {
        // Atualizar configurações originais após salvamento bem-sucedido
        setOriginalSettings({ ...settings })
      }
    } catch (error) {
      console.error("Error saving general settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Verificar se há erros de validação
  const hasValidationErrors = () => {
    return !!(validationErrors.email || validationErrors.restaurant_phone || validationErrors.website)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações da Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="restaurant_name">Nome da Empresa</Label>
              <Input
                id="restaurant_name"
                value={settings.restaurant_name || ""}
                onChange={(e) => handleInputChange("restaurant_name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={settings.website || ""}
                onChange={(e) => handleInputChange("website", e.target.value)}
                className={validationErrors.website ? "border-red-300" : ""}
                placeholder="www.exemplo.com"
              />
              {validationErrors.website && (
                <p className="text-sm text-red-600">{validationErrors.website}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={settings.description || ""}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Logo da Empresa</Label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                {settings.logo ? (
                  <img
                    src={URL.createObjectURL(settings.logo)}
                    alt="Logo"
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : settings.logo_url ? (
                  <img
                    src={settings.logo_url}
                    alt="Logo"
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <Upload className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div>
                <input type="file" id="logo" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                <Button variant="outline" onClick={() => document.getElementById("logo")?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  {settings.logo || settings.logo_url ? "Alterar Logo" : "Fazer Upload"}
                </Button>
                {(settings.logo || settings.logo_url) && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSettings(prev => ({ ...prev, logo: null, logo_url: "" }))}
                    className="ml-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Tamanho máximo recomendado: 150x150 pixels • Formatos aceitos: JPG, PNG, WebP
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Contato e Localização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="restaurant_address">Endereço</Label>
            <Input
              id="restaurant_address"
              value={settings.restaurant_address || ""}
              onChange={(e) => handleInputChange("restaurant_address", e.target.value)}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="restaurant_phone">Telefone *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="restaurant_phone"
                  className={`pl-10 ${validationErrors.restaurant_phone ? "border-red-300" : ""}`}
                  value={formatPhone(settings.restaurant_phone || "")}
                  onChange={(e) => handleInputChange("restaurant_phone", e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
              {validationErrors.restaurant_phone && (
                <p className="text-sm text-red-600">{validationErrors.restaurant_phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  className={`pl-10 ${validationErrors.email ? "border-red-300" : ""}`}
                  value={settings.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="contato@empresa.com"
                />
              </div>
              {validationErrors.email && (
                <p className="text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Horário de Funcionamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="openingHours">Horário de Abertura</Label>
              <Input
                id="openingHours"
                type="time"
                value={settings.openingHours || ""}
                onChange={(e) => handleInputChange("openingHours", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="closingHours">Horário de Fechamento</Label>
              <Input
                id="closingHours"
                type="time"
                value={settings.closingHours || ""}
                onChange={(e) => handleInputChange("closingHours", e.target.value)}
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isOpen">Estabelecimento Aberto</Label>
              <p className="text-sm text-gray-600">Controla se o estabelecimento está aceitando pedidos</p>
            </div>
            <Switch
              id="isOpen"
              checked={settings.isOpen || false}
              onCheckedChange={(checked) => handleInputChange("isOpen", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="acceptOrders">Aceitar Pedidos Online</Label>
              <p className="text-sm text-gray-600">Permite ou bloqueia pedidos através do site</p>
            </div>
            <Switch
              id="acceptOrders"
              checked={settings.acceptOrders || false}
              onCheckedChange={(checked) => handleInputChange("acceptOrders", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bike className="w-5 h-5" />
            <span className="font-medium">Configurações de Entrega</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_order_value">Valor Mínimo do Pedido (R$)</Label>
              <Input
                id="min_order_value"
                type="number"
                step="0.01"
                min="0"
                value={settings.min_order_value || 0}
                onChange={(e) => handleInputChange("min_order_value", parseFloat(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_fee">Taxa de Entrega (R$)</Label>
              <Input
                id="delivery_fee"
                type="number"
                step="0.01"
                min="0"
                value={settings.delivery_fee || 0}
                onChange={(e) => handleInputChange("delivery_fee", parseFloat(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_time">Tempo de Entrega (min)</Label>
              <Input
                id="delivery_time"
                type="number"
                min="15"
                max="120"
                value={settings.delivery_time || 45}
                onChange={(e) => handleInputChange("delivery_time", parseInt(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isLoading || !hasChanges() || hasValidationErrors() || !settings.restaurant_name?.trim()}
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  )
}
