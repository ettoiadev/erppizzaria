'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { MapPin, Settings, TestTube, Plus, Edit, Trash2, Clock, DollarSign } from 'lucide-react'

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

export default function GeolocationPage() {
  const [settings, setSettings] = useState<GeolocationSettings>({
    pizzaria_latitude: '',
    pizzaria_longitude: '',
    pizzaria_address: '',
    max_delivery_radius_km: '',
    google_maps_api_key: '',
    enable_geolocation_delivery: 'true',
    fallback_delivery_fee: '',
    geocoding_cache_hours: '168'
  })
  
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null)
  const [showNewZoneForm, setShowNewZoneForm] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([loadSettings(), loadZones()])
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/geolocation/settings', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setSettings(prev => ({ ...prev, ...data.settings }))
      } else {
        throw new Error('Erro ao carregar configurações')
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      throw error
    }
  }

  const loadZones = async () => {
    try {
      const response = await fetch('/api/admin/delivery-zones', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setZones(data.zones || [])
      } else {
        throw new Error('Erro ao carregar zonas')
      }
    } catch (error) {
      console.error('Erro ao carregar zonas:', error)
      throw error
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/geolocation/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Configurações salvas com sucesso!"
        })
      } else {
        const error = await response.json()
        toast({
          title: "Erro",
          description: error.error || 'Erro ao salvar configurações',
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const testAddress = async () => {
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
        await loadZones()
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
        await loadZones()
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <MapPin className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Geolocalização e Entrega</h1>
        <Badge variant="outline" className="ml-2">
          {settings.enable_geolocation_delivery === 'true' ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="zones" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Zonas de Entrega
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            Testes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Localização da Pizzaria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Endereço Completo</Label>
                  <Input
                    id="address"
                    value={settings.pizzaria_address}
                    onChange={(e) => setSettings(prev => ({ ...prev, pizzaria_address: e.target.value }))}
                    placeholder="Rua das Pizzas, 123 - Centro, São Paulo - SP"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lat">Latitude</Label>
                    <Input
                      id="lat"
                      type="number"
                      step="0.000001"
                      value={settings.pizzaria_latitude}
                      onChange={(e) => setSettings(prev => ({ ...prev, pizzaria_latitude: e.target.value }))}
                      placeholder="-23.5505"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lon">Longitude</Label>
                    <Input
                      id="lon"
                      type="number"
                      step="0.000001"
                      value={settings.pizzaria_longitude}
                      onChange={(e) => setSettings(prev => ({ ...prev, pizzaria_longitude: e.target.value }))}
                      placeholder="-46.6333"
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
                    value={settings.max_delivery_radius_km}
                    onChange={(e) => setSettings(prev => ({ ...prev, max_delivery_radius_km: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="fallback">Taxa Padrão (R$)</Label>
                  <Input
                    id="fallback"
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.fallback_delivery_fee}
                    onChange={(e) => setSettings(prev => ({ ...prev, fallback_delivery_fee: e.target.value }))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable"
                    checked={settings.enable_geolocation_delivery === 'true'}
                    onCheckedChange={(checked) => setSettings(prev => ({ 
                      ...prev, 
                      enable_geolocation_delivery: checked ? 'true' : 'false' 
                    }))}
                  />
                  <Label htmlFor="enable">Habilitar Cálculo por Geolocalização</Label>
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
                    value={settings.google_maps_api_key}
                    onChange={(e) => setSettings(prev => ({ ...prev, google_maps_api_key: e.target.value }))}
                    placeholder="Sua chave da API do Google Maps"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Necessária para geocodificação automática de endereços
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cache e Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="cache">Horas de Cache</Label>
                  <Input
                    id="cache"
                    type="number"
                    min="1"
                    max="8760"
                    value={settings.geocoding_cache_hours}
                    onChange={(e) => setSettings(prev => ({ ...prev, geocoding_cache_hours: e.target.value }))}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Tempo para manter endereços em cache (168 = 1 semana)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 flex justify-end space-x-4">
            <Button variant="outline" onClick={loadSettings} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="zones">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Zonas de Entrega</h2>
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
                <CardTitle>Teste de Endereço</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Teste se um endereço está na área de entrega e veja a taxa calculada.
                </p>
                <Button onClick={testAddress} className="w-full">
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
    </div>
  )
}