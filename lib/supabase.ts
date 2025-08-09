import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Em ambientes Node, garantir WebSocket disponível para canais Realtime
if (typeof window === 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ws = require('ws')
    if (ws && !(globalThis as any).WebSocket) {
      ;(globalThis as any).WebSocket = ws
    }
  } catch {
    // Ignorar se já existir WebSocket global ou módulo indisponível
  }
}

// Credenciais oficiais pedidas: SUPABASE_URL e SUPABASE_KEY
const supabaseUrl = process.env.SUPABASE_URL as string | undefined
const supabaseKey = process.env.SUPABASE_KEY as string | undefined

if (!supabaseUrl || !supabaseKey) {
  // Lidar com fallback durante migração (opcional): tentar variáveis antigas se existirem
  const fallbackUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined
  const fallbackKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) as string | undefined
  if (!supabaseUrl && fallbackUrl) {
    (process as any).env.SUPABASE_URL = fallbackUrl
  }
  if (!supabaseKey && fallbackKey) {
    (process as any).env.SUPABASE_KEY = fallbackKey
  }
}

// Cliente único para o servidor. Em rotas API (Node), este é o cliente a ser usado.
export const supabaseServer: SupabaseClient | null =
  (process.env.SUPABASE_URL && process.env.SUPABASE_KEY)
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null

export function getSupabaseServerClient(): SupabaseClient {
  if (!supabaseServer) {
    throw new Error('[Supabase] SUPABASE_URL/SUPABASE_KEY não configurados no servidor')
  }
  return supabaseServer
}

export function assertSupabaseConfigured(context: string) {
  if (!process.env.SUPABASE_URL) {
    throw new Error(`[Supabase] SUPABASE_URL não configurada (${context})`)
  }
  if (!process.env.SUPABASE_KEY) {
    throw new Error(`[Supabase] SUPABASE_KEY não configurada (${context})`)
  }
}

export default supabaseServer

