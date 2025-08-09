import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Em ambientes Node, garantir WebSocket disponível para canais Realtime
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ws = require('ws')
  if (ws && !(globalThis as any).WebSocket) {
    ;(globalThis as any).WebSocket = ws
  }
} catch {
  // Ignorar se já existir WebSocket global (navegador)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined

// Cliente público (browser e server) — usado para assinaturas
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

// Cliente com role de serviço (apenas no servidor) — usado para emitir/broadcast
export const supabaseAdmin: SupabaseClient | null =
  typeof window === 'undefined' && supabaseUrl && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null

export function assertSupabaseConfigured(context: string) {
  if (!supabaseUrl) {
    throw new Error(`[Supabase] NEXT_PUBLIC_SUPABASE_URL não configurada (${context})`)
  }
  if (!supabaseAnonKey) {
    throw new Error(`[Supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY não configurada (${context})`)
  }
}

export default supabase

