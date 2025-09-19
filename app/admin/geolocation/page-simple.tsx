'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { MapPin, Settings } from 'lucide-react'

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

export default function GeolocationPageSimple() {
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
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadSettings()
  }, [])

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
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
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
        <h1 className="text-2xl font-bold">Geolocalização e Entrega (Simples)</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Localização da Pizzaria
            </CardTitle>
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
            <CardTitle>Status do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Geolocalização:</span>
              <span className={settings.enable_geolocation_delivery === 'true' ? 'text-green-600' : 'text-red-600'}>
                {settings.enable_geolocation_delivery === 'true' ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Raio máximo:</span>
              <span>{settings.max_delivery_radius_km} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Taxa padrão:</span>
              <span>R$ {settings.fallback_delivery_fee}</span>
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
    </div>
  )
}