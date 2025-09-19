import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { frontendLogger } from '@/lib/frontend-logger'
import { ConfigCache } from '@/lib/cache-manager'

// API pública para buscar configurações que podem ser exibidas na página inicial com cache
export async function GET() {
  try {
    // Tentar obter do cache primeiro
    const cachedConfig = await ConfigCache.getConfig()
    if (cachedConfig) {
      frontendLogger.info('Cache hit: retornando configurações do cache')
      return NextResponse.json(cachedConfig)
    }

    // Se não estiver no cache, buscar do banco
    const publicSettings = [
      'restaurant_name',
      'description', 
      'restaurant_phone',
      'restaurant_address',
      'email',
      'website',
      'logo_url',
      'delivery_fee',
      'min_order_value',
      'delivery_time',
      'openingHours',
      'closingHours',
      'isOpen',
      'acceptOrders',
      'fastDeliveryEnabled',
      'fastDeliveryTitle',
      'fastDeliverySubtext',
      'freeDeliveryEnabled',
      'freeDeliveryTitle',
      'freeDeliverySubtext',
      'freeDeliveryMinimum',
      'allow_admin_registration'
    ]

    // Buscar configurações usando PostgreSQL
    const settingsResult = await query(
      'SELECT key, value FROM admin_settings WHERE key = ANY($1)',
      [publicSettings]
    )
    
    const allSettings: Record<string, any> = {}
    settingsResult.rows.forEach((row: any) => {
      allSettings[row.key] = row.value
    })

    // Filtrar apenas configurações públicas
    const settingsObj: Record<string, any> = {}
    publicSettings.forEach((key) => {
      if (allSettings[key]) {
        settingsObj[key] = allSettings[key]
      }
    })

    // Adicionar configurações padrão se não existirem
    const defaultSettings = {
      restaurant_name: 'William Disk Pizza',
      description: 'A melhor pizza da cidade, feita com ingredientes frescos e muito amor!',
      restaurant_phone: '(11) 99999-9999',
      restaurant_address: 'Rua das Pizzas, 123 - Centro',
      email: 'contato@williamdiskpizza.com',
      website: 'www.williamdiskpizza.com',
      delivery_fee: '5.00',
      min_order_value: '20.00',
      delivery_time: '45',
      openingHours: '18:00',
      closingHours: '23:00',
      isOpen: 'true',
      acceptOrders: 'true',
      fastDeliveryEnabled: 'true',
      fastDeliveryTitle: 'Super Rápido',
      fastDeliverySubtext: 'Entrega expressa em até 30 minutos ou sua pizza é grátis',
      freeDeliveryEnabled: 'true',
      freeDeliveryTitle: 'Frete Grátis',
      freeDeliverySubtext: 'Entrega gratuita para pedidos acima de R$ 50,00',
      freeDeliveryMinimum: '50.00',
      allow_admin_registration: 'true'
    }

    // Mesclar configurações padrão com as do banco
    const finalSettings = { ...defaultSettings, ...settingsObj }
    
    const response = { 
      settings: finalSettings,
      success: true 
    }

    // Armazenar no cache
    await ConfigCache.setConfig(response)
    frontendLogger.info('Configurações carregadas do banco e armazenadas no cache')

    return NextResponse.json(response)
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error))
    frontendLogger.logError('Erro ao buscar configurações públicas:', {
      message: errorObj.message,
      stack: errorObj.stack
    }, errorObj, 'api')
    return NextResponse.json(
      { 
        error: 'Erro interno ao buscar configurações',
        settings: {} 
      },
      { status: 500 }
    )
  }
}