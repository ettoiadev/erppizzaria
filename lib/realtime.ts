// Arquivo de compatibilidade para imports '@/lib/realtime'
import { realtimeClient } from './realtime-client'
export { realtimeClient, useRealtime, useRealtimeNotification, subscribeOrdersRealtime } from './realtime-client'
export { realtimeClient as default } from './realtime-client'

// Constantes para canais realtime
export const REALTIME_CHANNEL = 'orders'
export const EVENT_ORDER_STATUS_UPDATED = 'order_status_updated'
export const EVENT_PAYMENT_APPROVED = 'payment_approved'
export const EVENT_NEW_ORDER = 'new_order'
export const EVENT_ORDER_CANCELLED = 'order_cancelled'

// Função para emitir eventos realtime
export async function emitRealtimeEvent(channel: string, event: string, payload: any) {
  try {
    const response = await fetch('/api/notifications/realtime', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ channel, event, payload }),
    })
    
    if (!response.ok) {
      throw new Error(`Erro ao emitir evento realtime: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Erro ao emitir evento realtime:', error)
    throw error
  }
}

// Função para subscrever a mudanças de pedidos (compatibilidade)
export function useRealtimeSubscription(channel: string, callback: (data: any) => void) {
  return realtimeClient.subscribe(channel, callback)
}