"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { CurrencyInput } from "@/components/ui/currency-input"
import { 
  MapPin, Settings, Plus, Edit, Trash2, Clock, DollarSign, 
  Save, TestTube, Map, Navigation, Target
} from "lucide-react"

interface DeliveryZone {
  id: string
  name: string
  min_distance_km: number
  max_distance_km: number
  delivery_fee: number
  estimated_time_minutes: number
  active: boolean
  color_hex: string
  description: string
  stats?: {
    cached_addresses: number
    deliverable_addresses: number
  }
}

interface GeolocationSettings {
  pizzaria_latitude: string
  pizzaria_longitude: string
  pizzaria_address: string
  max_delivery_radius_km: string
  google_maps_api_key: string
  enable_geolocation_delivery: string
  fallback_delivery_fee: string
  geocoding_cache_hours: string
}

interface StaticDeliverySettings {
  deliveryEnabled: boolean
  freeDeliveryEnabled: boolean
  freeDeliveryMinimum: number
  defaultDeliveryFee: number
  maxDeliveryDistance: number
  estimatedDeliveryTime: number
  deliveryAreas: Array<{
    name: string
    fee: number
    maxDistance: number
  }>
}

interface VisualDeliverySettingsProps {
  settings: Record<string, any>
  onSave: (settings: Record<string, any>) => Promise<boolean>
  onMarkUnsaved?: () => void
}

export function VisualDeliverySettings({ 
  settings: initialSettings, 
  onSave, 
  onMarkUnsaved 
}: VisualDeliverySettingsProps) {
  const [deliveryMode, setDeliveryMode] = useState<'static' | 'geolocation'>('static')
  const [staticSettings, setStaticSettings] = useState<StaticDeliverySettings>({
    deliveryEnabled: initialSettings.deliveryEnabled ?? true,
    freeDeliveryEnabled: initialSettings.freeDeliveryEnabled ?? true,
    freeDeliveryMinimum: initialSettings.freeDeliveryMinimum || 50.0,
    defaultDeliveryFee: initialSettings.defaultDeliveryFee || 5.9,
    maxDeliveryDistance: initialSettings.maxDeliveryDistance || 10,
    estimatedDeliveryTime: initialSettings.estimatedDeliveryTime || 30,
    deliveryAreas: initialSettings.deliveryAreas || [
      { name: "Centro", fee: 5.9, maxDistance: 5 },
      { name: "Jardins", fee: 7.9, maxDistance: 8 },
    ],
  })

  const [geoSettings, setGeoSettings] = useState<GeolocationSettings>({
    pizzaria_latitude: '-23.2946',
    pizzaria_longitude: '-45.9695',
    pizzaria_address: 'R. Bernardino de Campos, 143 - Jacareí SP',
    max_delivery_radius_km: '15',
    google_maps_api_key: '',
    enable_geolocation_delivery: 'false',
    fallback_delivery_fee: '8.00',
    geocoding_cache_hours: '168'
  })

  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null)
  const [showNewZoneForm, setShowNewZoneForm] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadGeolocationData()
    // Determinar modo baseado nas configurações
    if (initialSettings.enable_geolocation_delivery === 'true') {
      setDeliveryMode('geolocation')
    }
  }, [])

  const loadGeolocationData = async () => {
    try {
      // Carregar configurações de geolocalização
      const settingsResponse = await fetch('/api/admin/geolocation/settings', {
        credentials: 'include'
      })
      
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json()
        setGeoSettings(prev => ({ ...prev, ...settingsData.settings }))
      }

      // Carregar zonas de entrega
      const zonesResponse = await fetch('/api/admin/delivery-zones', {
        credentials: 'include'
      })
      
      if (zonesResponse.ok) {
        const zonesData = await zonesResponse.json()
        setZones(zonesData.zones || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados de geolocalização:', error)
    }
  }

  const handleModeChange = async (mode: 'static' | 'geolocation') => {
    setDeliveryMode(mode)
    
    // Atualizar configuração de geolocalização
    const newGeoSettings = {
      ...geoSettings,
      enable_geolocation_delivery: mode === 'geolocation' ? 'true' : 'false'
    }
    setGeoSettings(newGeoSettings)

    // Salvar automaticamente a mudança de modo
    try {
      await fetch('/api/admin/geolocation/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(newGeoSettings)
      })

      toast({
        title: "Modo Alterado",
        description: `Modo de entrega alterado para ${mode === 'static' ? 'Estático' : 'Geolocalização'}`
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao alterar modo de entrega",
        variant: "destructive"
      })
    }

    if (onMarkUnsaved) onMarkUnsaved()
  }

  const handleStaticSave = async () => {
    setIsLoading(true)
    try {
      const success = await onSave(staticSettings)
      if (success) {
        toast({
          title: "Sucesso",
          description: "Configurações estáticas salvas com sucesso!"
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações estáticas",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGeoSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/geolocation/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(geoSettings)
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Configurações de geolocalização salvas com sucesso!"
        })
      } else {
        throw new Error('Erro ao salvar')
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações de geolocalização",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testDeliveryAddress = async () => {
    const testAddr = prompt('Digite um endereço para testar:')
    if (!testAddr) return

    setTestResult({ loading: true })

    try {
      const response = await fetch('/api/delivery/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: testAddr })
      })

      const result = await response.json()
      setTestResult(result)
      
      if (result.deliverable) {
        toast({
          title: "Teste de Entrega",
          description: `✅ Entregável! Taxa: R$ ${Number(result.delivery_fee)?.toFixed(2)} - Tempo: ${result.estimated_time}min`
        })
      } else {
        toast({
          title: "Teste de Entrega",
          description: `❌ ${result.message}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao testar endereço",
        variant: "destructive"
      })
      setTestResult({ error: 'Erro ao testar endereço' })
    }
  }

  const saveZone = async (zoneData: Partial<DeliveryZone>) => {
    try {
      const isEditing = editingZone?.id

      const response = await fetch(
        isEditing ? `/api/admin/delivery-zones/${editingZone.id}` : '/api/admin/delivery-zones',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(zoneData)
        }
      )

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: isEditing ? 'Zona atualizada!' : 'Zona criada!'
        })
        setEditingZone(null)
        setShowNewZoneForm(false)
        await loadGeolocationData()
      } else {
        const error = await response.json()
        toast({
          title: "Erro",
          description: error.error || 'Erro ao salvar zona',
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar zona",
        variant: "destructive"
      })
    }
  }

  const deleteZone = async (zoneId: string, zoneName: string) => {
    if (!confirm(`Tem certeza que deseja deletar a zona "${zoneName}"?`)) return

    try {
      const response = await fetch(`/api/admin/delivery-zones/${zoneId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Zona deletada com sucesso!"
        })
        await loadGeolocationData()
      } else {
        const error = await response.json()
        toast({
          title: "Erro",
          description: error.error || 'Erro ao deletar zona',
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao deletar zona",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Seletor de Modo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            Modo de Configuração de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="static"
                name="deliveryMode"
                checked={deliveryMode === 'static'}
                onChange={() => handleModeChange('static')}
                className="w-4 h-4 text-blue-600"
              />
              <Label htmlFor="static" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Configuração Estática
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="geolocation"
                name="deliveryMode"
                checked={deliveryMode === 'geolocation'}
                onChange={() => handleModeChange('geolocation')}
                className="w-4 h-4 text-blue-600"
              />
              <Label htmlFor="geolocation" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Geolocalização Dinâmica
              </Label>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {deliveryMode === 'static' 
              ? 'Configuração manual de áreas e taxas fixas'
              : 'Cálculo automático baseado em coordenadas GPS e Google Maps'
            }
          </p>
        </CardContent>
      </Card>

      {deliveryMode === 'static' ? (
        /* Configuração Estática */
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais de Entrega</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={staticSettings.deliveryEnabled}
                  onCheckedChange={(checked) => {
                    setStaticSettings(prev => ({ ...prev, deliveryEnabled: checked }))
                    if (onMarkUnsaved) onMarkUnsaved()
                  }}
                />
                <Label>Habilitar Serviço de Entrega</Label>
              </div>

              <Separator />

              <div className="flex items-center space-x-2">
                <Switch
                  checked={staticSettings.freeDeliveryEnabled}
                  onCheckedChange={(checked) => {
                    setStaticSettings(prev => ({ ...prev, freeDeliveryEnabled: checked }))
                    if (onMarkUnsaved) onMarkUnsaved()
                  }}
                />
                <Label>Habilitar Frete Grátis</Label>
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="freeDeliveryMinimum" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Valor Mínimo para Frete Grátis (R$)
                  </Label>
                  <CurrencyInput
                    id="freeDeliveryMinimum"
                    value={staticSettings.freeDeliveryMinimum}
                    onChange={(value) => {
                      setStaticSettings(prev => ({ ...prev, freeDeliveryMinimum: value }))
                      if (onMarkUnsaved) onMarkUnsaved()
                    }}
                    disabled={!staticSettings.freeDeliveryEnabled}
                    className={!staticSettings.freeDeliveryEnabled ? "opacity-50" : ""}
                  />
                  {!staticSettings.freeDeliveryEnabled && (
                    <p className="text-xs text-gray-500">Campo desabilitado - frete grátis está inativo</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultDeliveryFee" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Taxa de Entrega Padrão (R$)
                  </Label>
                  <CurrencyInput
                    id="defaultDeliveryFee"
                    value={staticSettings.defaultDeliveryFee}
                    onChange={(value) => {
                      setStaticSettings(prev => ({ ...prev, defaultDeliveryFee: value }))
                      if (onMarkUnsaved) onMarkUnsaved()
                    }}
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
                    value={staticSettings.maxDeliveryDistance}
                    onChange={(e) => {
                      setStaticSettings(prev => ({ ...prev, maxDeliveryDistance: parseInt(e.target.value) }))
                      if (onMarkUnsaved) onMarkUnsaved()
                    }}
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
                    value={staticSettings.estimatedDeliveryTime}
                    onChange={(e) => {
                      setStaticSettings(prev => ({ ...prev, estimatedDeliveryTime: parseInt(e.target.value) }))
                      if (onMarkUnsaved) onMarkUnsaved()
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Áreas de Entrega Estáticas */}
          <Card>
            <CardHeader>
              <CardTitle>Áreas de Entrega</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {staticSettings.deliveryAreas.map((area, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <Input
                        placeholder="Nome da área"
                        value={area.name}
                        onChange={(e) => {
                          const newAreas = [...staticSettings.deliveryAreas]
                          newAreas[index] = { ...newAreas[index], name: e.target.value }
                          setStaticSettings(prev => ({ ...prev, deliveryAreas: newAreas }))
                          if (onMarkUnsaved) onMarkUnsaved()
                        }}
                      />
                      <CurrencyInput
                        value={area.fee}
                        onChange={(value) => {
                          const newAreas = [...staticSettings.deliveryAreas]
                          newAreas[index] = { ...newAreas[index], fee: value }
                          setStaticSettings(prev => ({ ...prev, deliveryAreas: newAreas }))
                          if (onMarkUnsaved) onMarkUnsaved()
                        }}
                      />
                      <Input
                        type="number"
                        placeholder="Distância máx (km)"
                        value={area.maxDistance}
                        onChange={(e) => {
                          const newAreas = [...staticSettings.deliveryAreas]
                          newAreas[index] = { ...newAreas[index], maxDistance: parseInt(e.target.value) }
                          setStaticSettings(prev => ({ ...prev, deliveryAreas: newAreas }))
                          if (onMarkUnsaved) onMarkUnsaved()
                        }}
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        const newAreas = staticSettings.deliveryAreas.filter((_, i) => i !== index)
                        setStaticSettings(prev => ({ ...prev, deliveryAreas: newAreas }))
                        if (onMarkUnsaved) onMarkUnsaved()
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => {
                  const newAreas = [...staticSettings.deliveryAreas, { name: "", fee: 0, maxDistance: 0 }]
                  setStaticSettings(prev => ({ ...prev, deliveryAreas: newAreas }))
                  if (onMarkUnsaved) onMarkUnsaved()
                }}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Área
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleStaticSave} disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </div>
      ) : (
        /* Configuração por Geolocalização */
        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
            <TabsTrigger value="zones">Zonas de Entrega</TabsTrigger>
            <TabsTrigger value="test">Testes</TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Localização da Pizzaria
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="address">Endereço Completo</Label>
                    <Input
                      id="address"
                      value={geoSettings.pizzaria_address}
                      onChange={(e) => {
                        setGeoSettings(prev => ({ ...prev, pizzaria_address: e.target.value }))
                        if (onMarkUnsaved) onMarkUnsaved()
                      }}
                      placeholder="R. Bernardino de Campos, 143 - Jacareí SP"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="lat">Latitude</Label>
                      <Input
                        id="lat"
                        type="number"
                        step="0.000001"
                        value={geoSettings.pizzaria_latitude}
                        onChange={(e) => {
                          setGeoSettings(prev => ({ ...prev, pizzaria_latitude: e.target.value }))
                          if (onMarkUnsaved) onMarkUnsaved()
                        }}
                        placeholder="-23.2946"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lon">Longitude</Label>
                      <Input
                        id="lon"
                        type="number"
                        step="0.000001"
                        value={geoSettings.pizzaria_longitude}
                        onChange={(e) => {
                          setGeoSettings(prev => ({ ...prev, pizzaria_longitude: e.target.value }))
                          if (onMarkUnsaved) onMarkUnsaved()
                        }}
                        placeholder="-45.9695"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Entrega</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="radius">Raio Máximo de Entrega (km)</Label>
                    <Input
                      id="radius"
                      type="number"
                      step="0.1"
                      min="1"
                      max="50"
                      value={geoSettings.max_delivery_radius_km}
                      onChange={(e) => {
                        setGeoSettings(prev => ({ ...prev, max_delivery_radius_km: e.target.value }))
                        if (onMarkUnsaved) onMarkUnsaved()
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="fallback">Taxa Padrão (R$)</Label>
                    <CurrencyInput
                      id="fallback"
                      value={parseFloat(geoSettings.fallback_delivery_fee) || 0}
                      onChange={(value) => {
                        setGeoSettings(prev => ({ ...prev, fallback_delivery_fee: value.toString() }))
                        if (onMarkUnsaved) onMarkUnsaved()
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>API do Google Maps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="apikey">Chave da API</Label>
                    <Input
                      id="apikey"
                      type="password"
                      value={geoSettings.google_maps_api_key}
                      onChange={(e) => {
                        setGeoSettings(prev => ({ ...prev, google_maps_api_key: e.target.value }))
                        if (onMarkUnsaved) onMarkUnsaved()
                      }}
                      placeholder="Sua chave da API do Google Maps"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Necessária para geocodificação automática de endereços
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleGeoSave} disabled={isLoading}>
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="zones">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Zonas de Entrega por Distância</h2>
                <Button onClick={() => setShowNewZoneForm(true)} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Nova Zona
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {zones.map((zone) => (
                  <Card key={zone.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: zone.color_hex }}
                          />
                          {zone.name}
                        </CardTitle>
                        <Badge variant={zone.active ? "default" : "secondary"}>
                          {zone.active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Distância:</span>
                          <span>{zone.min_distance_km}km - {zone.max_distance_km}km</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Taxa:</span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            R$ {Number(zone.delivery_fee).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Tempo:</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {zone.estimated_time_minutes} min
                          </span>
                        </div>
                        {zone.stats && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Endereços:</span>
                            <span>{zone.stats.cached_addresses}</span>
                          </div>
                        )}
                      </div>
                      
                      {zone.description && (
                        <p className="text-sm text-gray-600 italic">{zone.description}</p>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setEditingZone(zone)}
                          className="flex-1"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => deleteZone(zone.id, zone.name)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="test">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="w-5 h-5" />
                    Teste de Endereço
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Teste se um endereço está na área de entrega e veja a taxa calculada.
                  </p>
                  <Button onClick={testDeliveryAddress} className="w-full">
                    Testar Endereço
                  </Button>
                </CardContent>
              </Card>

              {testResult && (
                <Card>
                  <CardHeader>
                    <CardTitle>Resultado do Teste</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {testResult.loading ? (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2">Testando...</p>
                      </div>
                    ) : testResult.error ? (
                      <div className="text-red-600">
                        <p>❌ {testResult.error}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className={`p-3 rounded ${testResult.deliverable ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                          <p className="font-medium">
                            {testResult.deliverable ? '✅ Entregável' : '❌ Não Entregável'}
                          </p>
                          <p className="text-sm">{testResult.message}</p>
                        </div>
                        
                        {testResult.deliverable && (
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Taxa:</span>
                              <span className="ml-2 font-medium">R$ {Number(testResult.delivery_fee)?.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Tempo:</span>
                              <span className="ml-2 font-medium">{testResult.estimated_time} min</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Distância:</span>
                              <span className="ml-2 font-medium">{Number(testResult.distance_km)?.toFixed(1)} km</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Zona:</span>
                              <span className="ml-2 font-medium">{testResult.zone_name}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Modal para Nova Zona */}
      {showNewZoneForm && (
        <ZoneFormModal
          zone={null}
          onSave={saveZone}
          onClose={() => setShowNewZoneForm(false)}
        />
      )}

      {/* Modal para Editar Zona */}
      {editingZone && (
        <ZoneFormModal
          zone={editingZone}
          onSave={saveZone}
          onClose={() => setEditingZone(null)}
        />
      )}
    </div>
  )
}

// Componente Modal para Formulário de Zona
interface ZoneFormModalProps {
  zone: DeliveryZone | null
  onSave: (zoneData: Partial<DeliveryZone>) => Promise<void>
  onClose: () => void
}

function ZoneFormModal({ zone, onSave, onClose }: ZoneFormModalProps) {
  const [formData, setFormData] = useState({
    name: zone?.name || '',
    min_distance_km: zone?.min_distance_km || 0,
    max_distance_km: zone?.max_distance_km || 5,
    delivery_fee: zone?.delivery_fee || 8.00,
    estimated_time_minutes: zone?.estimated_time_minutes || 30,
    color_hex: zone?.color_hex || '#3B82F6',
    description: zone?.description || '',
    active: zone?.active ?? true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {zone ? 'Editar Zona' : 'Nova Zona de Entrega'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="zoneName">Nome da Zona</Label>
            <Input
              id="zoneName"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Centro, Jardins..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minDistance">Distância Mín (km)</Label>
              <Input
                id="minDistance"
                type="number"
                step="0.1"
                min="0"
                value={formData.min_distance_km}
                onChange={(e) => setFormData(prev => ({ ...prev, min_distance_km: parseFloat(e.target.value) }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="maxDistance">Distância Máx (km)</Label>
              <Input
                id="maxDistance"
                type="number"
                step="0.1"
                min="0.1"
                value={formData.max_distance_km}
                onChange={(e) => setFormData(prev => ({ ...prev, max_distance_km: parseFloat(e.target.value) }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="deliveryFee">Taxa de Entrega (R$)</Label>
              <CurrencyInput
                id="deliveryFee"
                value={formData.delivery_fee}
                onChange={(value) => setFormData(prev => ({ ...prev, delivery_fee: value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="estimatedTime">Tempo Estimado (min)</Label>
              <Input
                id="estimatedTime"
                type="number"
                min="1"
                value={formData.estimated_time_minutes}
                onChange={(e) => setFormData(prev => ({ ...prev, estimated_time_minutes: parseInt(e.target.value) }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="color">Cor da Zona</Label>
            <Input
              id="color"
              type="color"
              value={formData.color_hex}
              onChange={(e) => setFormData(prev => ({ ...prev, color_hex: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição da zona..."
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
            />
            <Label>Zona Ativa</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {zone ? 'Atualizar' : 'Criar'} Zona
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}