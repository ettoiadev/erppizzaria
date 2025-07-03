"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Save, MapPin, Clock, DollarSign, Plus, Trash2 } from "lucide-react"

interface DeliverySettingsProps {
  settings: Record<string, any>
  onSave: (settings: Record<string, any>) => Promise<boolean>
}

export function DeliverySettings({ settings: initialSettings, onSave }: DeliverySettingsProps) {
  const [settings, setSettings] = useState({
    deliveryEnabled: initialSettings.deliveryEnabled ?? true,
    freeDeliveryMinimum: initialSettings.freeDeliveryMinimum || 50.0,
    defaultDeliveryFee: initialSettings.defaultDeliveryFee || 5.9,
    maxDeliveryDistance: initialSettings.maxDeliveryDistance || 10,
    estimatedDeliveryTime: initialSettings.estimatedDeliveryTime || 30,
    deliveryAreas: initialSettings.deliveryAreas || [
      { name: "Centro", fee: 5.9, maxDistance: 5 },
      { name: "Jardins", fee: 7.9, maxDistance: 8 },
      { name: "Vila Madalena", fee: 6.9, maxDistance: 7 },
    ],
  })

  const [isLoading, setIsLoading] = useState(false)
  const [newArea, setNewArea] = useState({ name: "", fee: 0, maxDistance: 0 })

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleAreaChange = (index: number, field: string, value: string | number) => {
    const updatedAreas = [...settings.deliveryAreas]
    updatedAreas[index] = { ...updatedAreas[index], [field]: value }
    setSettings((prev) => ({ ...prev, deliveryAreas: updatedAreas }))
  }

  const addDeliveryArea = () => {
    if (newArea.name && newArea.fee > 0 && newArea.maxDistance > 0) {
      setSettings((prev) => ({
        ...prev,
        deliveryAreas: [...prev.deliveryAreas, newArea],
      }))
      setNewArea({ name: "", fee: 0, maxDistance: 0 })
    }
  }

  const removeDeliveryArea = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      deliveryAreas: prev.deliveryAreas.filter((_, i) => i !== index),
    }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      console.log("Saving delivery settings:", settings)
      await onSave(settings)
    } catch (error) {
      console.error("Error saving delivery settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações Gerais de Entrega</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="deliveryEnabled">Serviço de Entrega Ativo</Label>
              <p className="text-sm text-gray-600">Habilita ou desabilita o serviço de entrega</p>
            </div>
            <Switch
              id="deliveryEnabled"
              checked={settings.deliveryEnabled}
              onCheckedChange={(checked) => handleInputChange("deliveryEnabled", checked)}
            />
          </div>

          <Separator />

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="freeDeliveryMinimum" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Valor Mínimo para Frete Grátis (R$)
              </Label>
              <Input
                id="freeDeliveryMinimum"
                type="number"
                step="0.01"
                value={settings.freeDeliveryMinimum}
                onChange={(e) => handleInputChange("freeDeliveryMinimum", Number.parseFloat(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultDeliveryFee" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Taxa de Entrega Padrão (R$)
              </Label>
              <Input
                id="defaultDeliveryFee"
                type="number"
                step="0.01"
                value={settings.defaultDeliveryFee}
                onChange={(e) => handleInputChange("defaultDeliveryFee", Number.parseFloat(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxDeliveryDistance" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Distância Máxima de Entrega (km)
              </Label>
              <Input
                id="maxDeliveryDistance"
                type="number"
                value={settings.maxDeliveryDistance}
                onChange={(e) => handleInputChange("maxDeliveryDistance", Number.parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedDeliveryTime" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Tempo Estimado de Entrega (min)
              </Label>
              <Input
                id="estimatedDeliveryTime"
                type="number"
                value={settings.estimatedDeliveryTime}
                onChange={(e) => handleInputChange("estimatedDeliveryTime", Number.parseInt(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Áreas de Entrega</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {settings.deliveryAreas.map((area, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <Input
                    placeholder="Nome da área"
                    value={area.name}
                    onChange={(e) => handleAreaChange(index, "name", e.target.value)}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Taxa (R$)"
                    value={area.fee}
                    onChange={(e) => handleAreaChange(index, "fee", Number.parseFloat(e.target.value))}
                  />
                  <Input
                    type="number"
                    placeholder="Distância máx (km)"
                    value={area.maxDistance}
                    onChange={(e) => handleAreaChange(index, "maxDistance", Number.parseInt(e.target.value))}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => removeDeliveryArea(index)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Adicionar Nova Área</Label>
            <div className="flex items-center gap-3">
              <Input
                placeholder="Nome da área"
                value={newArea.name}
                onChange={(e) => setNewArea((prev) => ({ ...prev, name: e.target.value }))}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Taxa (R$)"
                value={newArea.fee || ""}
                onChange={(e) => setNewArea((prev) => ({ ...prev, fee: Number.parseFloat(e.target.value) || 0 }))}
              />
              <Input
                type="number"
                placeholder="Distância máx (km)"
                value={newArea.maxDistance || ""}
                onChange={(e) => setNewArea((prev) => ({ ...prev, maxDistance: Number.parseInt(e.target.value) || 0 }))}
              />
              <Button onClick={addDeliveryArea}>
                <Plus className="w-4 h-4" />
              </Button>
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
