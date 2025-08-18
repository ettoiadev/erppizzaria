import { NextResponse } from 'next/server'
import { getAdminSettings } from '@/lib/db-supabase'
import { frontendLogger } from '@/lib/frontend-logger'

// API pública para buscar configurações que podem ser exibidas na página inicial
export async function GET() {
  try {
    // Buscar apenas configurações que são seguras para exibição pública
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
      'freeDeliveryMinimum'
    ]

    // Buscar configurações usando PostgreSQL
    const allSettings = await getAdminSettings()

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
      freeDeliveryMinimum: '50.00'
    }

    // Mesclar configurações padrão com as do banco
    const finalSettings = { ...defaultSettings, ...settingsObj }

    return NextResponse.json({ 
      settings: finalSettings,
      success: true 
    })
  } catch (error) {
    frontendLogger.error('Erro ao buscar configurações públicas:', {
      message: error.message,
      stack: error.stack,
      error
    })
    return NextResponse.json(
      { 
        error: 'Erro interno ao buscar configurações',
        settings: {} 
      },
      { status: 500 }
    )
  }
}