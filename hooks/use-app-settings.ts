import { useState, useEffect } from 'react'

export interface AppSettings {
  restaurant_name?: string
  description?: string
  restaurant_phone?: string
  restaurant_address?: string
  email?: string
  website?: string
  logo_url?: string
  delivery_fee?: string
  min_order_value?: string
  delivery_time?: string
  openingHours?: string
  closingHours?: string
  isOpen?: string
  acceptOrders?: string
  fastDeliveryEnabled?: string
  fastDeliveryTitle?: string
  fastDeliverySubtext?: string
  freeDeliveryEnabled?: string
  freeDeliveryTitle?: string
  freeDeliverySubtext?: string
}

const defaultSettings: AppSettings = {
  restaurant_name: 'William Disk Pizza',
  description: 'A melhor pizza da cidade, feita com ingredientes frescos e muito amor!',
  restaurant_phone: '(11) 99999-9999',
  restaurant_address: 'Rua das Pizzas, 123 - Centro - São Paulo/SP',
  email: 'contato@williamdiskpizza.com',
  website: 'www.williamdiskpizza.com',
  delivery_fee: '5.00',
  min_order_value: '20.00',
  delivery_time: '30',
  openingHours: '18:00',
  closingHours: '23:00',
  isOpen: 'true',
  acceptOrders: 'true',
  fastDeliveryEnabled: 'true',
  fastDeliveryTitle: 'Entrega Rápida',
  fastDeliverySubtext: 'Em até 30 minutos',
  freeDeliveryEnabled: 'true',
  freeDeliveryTitle: 'Frete Grátis',
  freeDeliverySubtext: 'Pedidos acima de R$ 50'
}

// Cache global para as configurações
let cachedSettings: AppSettings | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      // Verificar cache
      const now = Date.now()
      if (cachedSettings && (now - cacheTimestamp) < CACHE_DURATION) {
        setSettings(cachedSettings)
        setLoading(false)
        return
      }

      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          const newSettings = { ...defaultSettings, ...data.settings }
          setSettings(newSettings)
          
          // Atualizar cache
          cachedSettings = newSettings
          cacheTimestamp = now
        }
      } else {
        throw new Error('Falha ao carregar configurações')
      }
      setError(null)
    } catch (err) {
      console.error('Erro ao carregar configurações:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      // Manter configurações padrão em caso de erro
      setSettings(defaultSettings)
    } finally {
      setLoading(false)
    }
  }

  const refreshSettings = () => {
    // Limpar cache e recarregar
    cachedSettings = null
    cacheTimestamp = 0
    setLoading(true)
    fetchSettings()
  }

  return {
    settings,
    loading,
    error,
    refreshSettings
  }
}

// Função utilitária para formatar valores monetários
export const formatCurrency = (value: string | number): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numValue || 0)
}

// Função utilitária para verificar se o estabelecimento está aberto
export const isRestaurantOpen = (settings: AppSettings): boolean => {
  if (settings.isOpen !== 'true' || settings.acceptOrders !== 'true') {
    return false
  }

  const now = new Date()
  const currentTime = now.getHours() * 60 + now.getMinutes()
  
  if (settings.openingHours && settings.closingHours) {
    const [openHour, openMin] = settings.openingHours.split(':').map(Number)
    const [closeHour, closeMin] = settings.closingHours.split(':').map(Number)
    
    const openTime = openHour * 60 + openMin
    const closeTime = closeHour * 60 + closeMin
    
    if (closeTime > openTime) {
      // Mesmo dia
      return currentTime >= openTime && currentTime <= closeTime
    } else {
      // Cruza meia-noite
      return currentTime >= openTime || currentTime <= closeTime
    }
  }
  
  return true
} 