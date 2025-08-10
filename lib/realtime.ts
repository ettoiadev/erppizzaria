import { getSupabaseServerClient } from './supabase'
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js'
import supabaseBrowserDefault from './supabase'

// supabaseBrowser: client somente no browser, se existir default export configurado para browser
const supabaseBrowser = typeof window !== 'undefined' ? (supabaseBrowserDefault as unknown as SupabaseClient | null) : null

// Canal e eventos padronizados
export const REALTIME_CHANNEL = 'orders'
export const EVENT_ORDER_CREATED = 'order_created'
export const EVENT_ORDER_STATUS_UPDATED = 'order_status_updated'
export const EVENT_PAYMENT_APPROVED = 'payment_approved'

// Emissor (server side) — dispara eventos customizados para clientes
let serverChannel: RealtimeChannel | null = null
let serverChannelReady: Promise<void> | null = null

function getServerChannel(): { channel: RealtimeChannel; ready: Promise<void> } {
  const supabase = getSupabaseServerClient()
  if (!serverChannel) {
    serverChannel = supabase.channel(REALTIME_CHANNEL)
    serverChannelReady = new Promise<void>((resolve) => {
      serverChannel!.subscribe((status) => {
        if (status === 'SUBSCRIBED') resolve()
      })
    })
  }
  return { channel: serverChannel, ready: serverChannelReady! }
}

export async function emitRealtimeEvent(event: string, payload: any) {
  const { channel, ready } = getServerChannel()
  await ready
  await channel.send({ type: 'broadcast', event, payload })
}

// Assinatura (client side) — inscrever-se nos eventos
export function subscribeOrdersRealtime(
  handlers: Partial<{
    onOrderCreated: (data: any) => void
    onOrderStatusUpdated: (data: any) => void
    onPaymentApproved: (data: any) => void
  }> = {}
) {
  if (!supabaseBrowser) return { unsubscribe: () => {} }

  const channel = supabaseBrowser
    .channel(REALTIME_CHANNEL)
    .on('broadcast', { event: EVENT_ORDER_CREATED }, (payload) => {
      handlers.onOrderCreated?.(payload.payload)
    })
    .on('broadcast', { event: EVENT_ORDER_STATUS_UPDATED }, (payload) => {
      handlers.onOrderStatusUpdated?.(payload.payload)
    })
    .on('broadcast', { event: EVENT_PAYMENT_APPROVED }, (payload) => {
      handlers.onPaymentApproved?.(payload.payload)
    })
    .subscribe()

  return {
    unsubscribe: () => {
      supabaseBrowser.removeChannel(channel)
    },
  }
}

export default {
  emitRealtimeEvent,
  subscribeOrdersRealtime,
}

